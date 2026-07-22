#!/usr/bin/env bash
# Persistent Next.js dev server for local UI iteration.
# .dev-server.pid always holds the SUPERVISOR bash PID (never the next listener).
# Agents: read .dev-server.pid — do NOT kill this process during HMR work.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
PID_FILE="$ROOT/.dev-server.pid"
LOG_FILE="${LOG_FILE:-/tmp/dua-prayer-dev.log}"
NEXT_BIN="$ROOT/node_modules/.bin/next"
SUPERVISOR_MARKER="dua-prayer-dev-supervisor"

export WATCHPACK_POLLING="${WATCHPACK_POLLING:-2000}"
export CHOKIDAR_USEPOLLING="${CHOKIDAR_USEPOLLING:-true}"
export NEXT_DIST_DIR="${NEXT_DIST_DIR:-/tmp/dua-prayer-next}"

pid_alive() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

is_supervisor_pid() {
  local pid="$1"
  pid_alive "$pid" || return 1
  ps -p "$pid" -o args= 2>/dev/null | grep -q "$SUPERVISOR_MARKER"
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

read_supervisor_pid() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE" 2>/dev/null
  fi
}

clear_stale_pid_file() {
  local pid
  pid="$(read_supervisor_pid || true)"
  if [[ -n "$pid" ]] && ! is_supervisor_pid "$pid"; then
    rm -f "$PID_FILE"
  fi
}

wait_for_http() {
  local attempts="${1:-60}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    if port_listening && http_ready; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# --- Idempotent fast path: healthy supervisor + listener ---
clear_stale_pid_file
SUP_PID="$(read_supervisor_pid || true)"
if [[ -n "$SUP_PID" ]] && is_supervisor_pid "$SUP_PID"; then
  if port_listening; then
    echo "Dev supervisor already running (PID $SUP_PID) on http://localhost:${PORT}/"
    if http_ready; then
      echo "Health: HTTP OK"
    else
      echo "Health: port open (HTTP not 2xx yet — HMR may still be compiling)"
    fi
    exit 0
  fi
  echo "Supervisor PID $SUP_PID is alive; waiting for port ${PORT}..."
  if wait_for_http 30; then
    echo "Ready: http://localhost:${PORT}/"
    exit 0
  fi
  echo "Supervisor running but port ${PORT} not ready — tail $LOG_FILE"
  exit 0
fi

# Port up without a supervisor (orphan next dev) — do not kill; do not overwrite PID file.
if port_listening; then
  echo "Port ${PORT} is listening but no dev supervisor found."
  echo "Leave it running during iteration. To attach a supervisor later, stop dev only when the user asks, then run: npm run dev"
  if http_ready; then
    echo "Health: HTTP OK (unmanaged listener PID $(listener_pid_on_port || echo unknown))"
  fi
  exit 0
fi

if [[ ! -x "$NEXT_BIN" ]]; then
  echo "Missing $NEXT_BIN — run npm install first" >&2
  exit 1
fi

# --- Start detached supervisor (auto-restarts next dev + port health watchdog) ---
SUPERVISOR_CMD="$SUPERVISOR_MARKER
export NEXT_DIST_DIR=\"$NEXT_DIST_DIR\"
export WATCHPACK_POLLING=\"$WATCHPACK_POLLING\"
export CHOKIDAR_USEPOLLING=\"$CHOKIDAR_USEPOLLING\"
PORT=\"$PORT\"
NEXT_BIN=\"$NEXT_BIN\"
LOG_FILE=\"$LOG_FILE\"
PID_FILE=\"$PID_FILE\"

pid_alive() { local p=\"\$1\"; [[ -n \"\$p\" ]] && kill -0 \"\$p\" 2>/dev/null; }
listener_pid_on_port() { lsof -ti \":\${PORT}\" -sTCP:LISTEN 2>/dev/null | head -1; }
port_listening() { [[ -n \"\$(listener_pid_on_port || true)\" ]]; }

echo \"\$\$\" > \"\$PID_FILE\"
trap 'rm -f \"\$PID_FILE\"' EXIT

while true; do
  echo \"[\$(date -Iseconds)] starting next dev on port \${PORT}\" >> \"\$LOG_FILE\"
  \"\$NEXT_BIN\" dev -p \"\$PORT\" >> \"\$LOG_FILE\" 2>&1 &
  NEXT_PID=\$!
  DOWN_CHECKS=0
  STARTED_AT=\$(date +%s)

  while pid_alive \"\$NEXT_PID\"; do
    sleep 3
    if port_listening; then
      DOWN_CHECKS=0
      continue
    fi
    NOW=\$(date +%s)
    # Grace period while next is booting
    if (( NOW - STARTED_AT < 45 )); then
      continue
    fi
    DOWN_CHECKS=\$((DOWN_CHECKS + 1))
    if (( DOWN_CHECKS >= 3 )); then
      echo \"[\$(date -Iseconds)] port \${PORT} down while next PID \${NEXT_PID} alive — restarting next\" >> \"\$LOG_FILE\"
      kill \"\$NEXT_PID\" 2>/dev/null || true
      wait \"\$NEXT_PID\" 2>/dev/null || true
      break
    fi
  done

  if pid_alive \"\$NEXT_PID\"; then
    wait \"\$NEXT_PID\" 2>/dev/null || true
  fi
  echo \"[\$(date -Iseconds)] next dev exited; restarting in 2s\" >> \"\$LOG_FILE\"
  sleep 2
done"

if command -v setsid >/dev/null 2>&1; then
  setsid nohup bash -c "$SUPERVISOR_CMD" >> "$LOG_FILE" 2>&1 < /dev/null &
else
  nohup bash -c "$SUPERVISOR_CMD" >> "$LOG_FILE" 2>&1 < /dev/null &
  disown -h 2>/dev/null || true
fi
SUP_PID=$!

for _ in $(seq 1 15); do
  if [[ -f "$PID_FILE" ]]; then
    break
  fi
  sleep 1
done

if ! is_supervisor_pid "$(read_supervisor_pid || true)"; then
  echo "ERROR: dev supervisor failed to start. Last log lines:" >&2
  tail -30 "$LOG_FILE" >&2 || true
  rm -f "$PID_FILE"
  exit 1
fi

SUP_PID="$(read_supervisor_pid)"
echo "Started dev supervisor (PID $SUP_PID)"
echo "Log: $LOG_FILE"
echo "URL: http://localhost:${PORT}/"

if wait_for_http 60; then
  LPID="$(listener_pid_on_port || true)"
  echo "Ready: HTTP OK on http://localhost:${PORT}/ (listener PID ${LPID:-unknown})"
  exit 0
fi

echo "WARN: Supervisor running but / not HTTP-ready yet. Tail: tail -f $LOG_FILE"
exit 0
