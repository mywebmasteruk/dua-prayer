#!/usr/bin/env bash
# Persistent Next.js dev server for local UI iteration.
# Agents: read .dev-server.pid — do NOT kill this process during HMR work.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
PID_FILE="$ROOT/.dev-server.pid"
LOG_FILE="${LOG_FILE:-/tmp/dua-prayer-dev.log}"
NEXT_BIN="$ROOT/node_modules/.bin/next"

# Cloud-synced workspaces (iCloud/OneDrive) need polling watchers.
export WATCHPACK_POLLING="${WATCHPACK_POLLING:-1000}"
export CHOKIDAR_USEPOLLING="${CHOKIDAR_USEPOLLING:-true}"

pid_alive() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

listener_pid_on_port() {
  lsof -ti ":${PORT}" -sTCP:LISTEN 2>/dev/null | head -1
}

port_listening() {
  [[ -n "$(listener_pid_on_port || true)" ]]
}

http_ready() {
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/" 2>/dev/null || echo "000")"
  [[ "$code" =~ ^[23] ]]
}

record_listener_pid() {
  local lpid
  lpid="$(listener_pid_on_port || true)"
  if [[ -n "$lpid" ]]; then
    echo "$lpid" > "$PID_FILE"
  fi
}

# Already healthy on target port — do not spawn a second listener.
if port_listening; then
  record_listener_pid
  if [[ -f "$PID_FILE" ]]; then
    SUP_PID="$(cat "$PID_FILE")"
  fi
  echo "Dev server already up on http://localhost:${PORT}/ (listener PID ${SUP_PID:-unknown})"
  if http_ready; then
    echo "Health: HTTP OK"
  else
    echo "Health: port open (HTTP not 2xx yet — HMR may still be compiling)"
  fi
  exit 0
fi

# Stale supervisor PID with no listener — clear and restart.
if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"
  if pid_alive "$OLD_PID"; then
    echo "Process $OLD_PID exists but port ${PORT} is not listening — wait or check $LOG_FILE"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [[ ! -x "$NEXT_BIN" ]]; then
  echo "Missing $NEXT_BIN — run npm install first" >&2
  exit 1
fi

# Detached supervisor keeps next dev alive across agent shell exits and auto-restarts on crash.
SUPERVISOR_CMD='while true; do
  echo "[$(date -Iseconds)] starting next dev on port '"$PORT"'" >> "'"$LOG_FILE"'"
  "'"$NEXT_BIN"'" dev -p '"$PORT"' >> "'"$LOG_FILE"'" 2>&1 || true
  echo "[$(date -Iseconds)] next dev exited; restarting in 2s" >> "'"$LOG_FILE"'"
  sleep 2
done'

if command -v setsid >/dev/null 2>&1; then
  setsid nohup bash -c "$SUPERVISOR_CMD" >> "$LOG_FILE" 2>&1 < /dev/null &
else
  nohup bash -c "$SUPERVISOR_CMD" >> "$LOG_FILE" 2>&1 < /dev/null &
  disown -h 2>/dev/null || true
fi
SUP_PID=$!
echo "$SUP_PID" > "$PID_FILE"
echo "Started dev supervisor (PID $SUP_PID)"
echo "Log: $LOG_FILE"
echo "URL: http://localhost:${PORT}/"

for _ in $(seq 1 60); do
  if port_listening; then
    record_listener_pid
    LPID="$(listener_pid_on_port || true)"
    if http_ready; then
      echo "Ready: HTTP OK on http://localhost:${PORT}/ (listener PID ${LPID:-$SUP_PID})"
      exit 0
    fi
    echo "Port ${PORT} listening (listener PID ${LPID:-$SUP_PID}); waiting for HTTP..."
  fi
  if ! pid_alive "$SUP_PID"; then
    echo "ERROR: dev supervisor exited early. Last log lines:" >&2
    tail -30 "$LOG_FILE" >&2 || true
    rm -f "$PID_FILE"
    exit 1
  fi
  sleep 2
done

echo "WARN: Supervisor running but / not HTTP-ready yet. Tail: tail -f $LOG_FILE"
exit 0
