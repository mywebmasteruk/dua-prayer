import { NextResponse } from "next/server"
import { runDueDuaBots } from "@/lib/dua-bots"
import { secretsMatch } from "@/lib/secure-compare"

// Generating several duas (AI call + moderation each) can take a while; give the
// serverless function the headroom it needs (60s is the Hobby-plan ceiling).
export const maxDuration = 60

function cronSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || process.env.BOT_RUNNER_SECRET?.trim() || null
}

function isAuthorized(request: Request): boolean {
  const secret = cronSecret()
  if (!secret) return false

  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ") && secretsMatch(auth.slice("Bearer ".length), secret)) return true

  const url = new URL(request.url)
  const querySecret = url.searchParams.get("secret")
  return !!querySecret && secretsMatch(querySecret, secret)
}

async function run(request: Request) {
  if (!cronSecret()) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured. Admins can still trigger a manual bot run from server actions." },
      { status: 503 },
    )
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runDueDuaBots()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return run(request)
}

export async function POST(request: Request) {
  return run(request)
}
