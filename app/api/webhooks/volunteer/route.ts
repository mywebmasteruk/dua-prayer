import { secretsMatch } from "@/lib/secure-compare"
import { NextResponse } from "next/server"
import { notifyVolunteerWebhook, registerVolunteerApplicant } from "@/lib/volunteers"
import {
  parseVolunteerWebhookBody,
  readVolunteerWebhookBody,
} from "@/lib/volunteer-webhook-parse"

const WEBHOOK_PATH = "/api/webhooks/volunteer"

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
}

function getWebhookSecret(): string | null {
  return process.env.VOLUNTEER_WEBHOOK_SECRET?.trim() || null
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: WEBHOOK_PATH,
      method: "POST",
      message:
        "Volunteer webhook is active. Submit applications with POST, JSON body, and X-Webhook-Secret header.",
      requiredFields: ["email (or Fillout Email question)"],
      optionalFields: [
        "name",
        "message",
        "skills",
        "Area of Support",
        "timezone",
        "availability",
        "source",
      ],
      fillout:
        "Default Fillout webhook payload (submission.questions[]) is supported without custom body mapping.",
    },
    { headers: corsHeaders },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      ...corsHeaders,
    },
  })
}

export async function POST(request: Request) {
  const configuredSecret = getWebhookSecret()
  if (!configuredSecret) {
    return NextResponse.json({ error: "Volunteer webhook is not configured." }, { status: 503 })
  }

  const providedSecret = request.headers.get("x-webhook-secret")?.trim()
  if (!providedSecret || !secretsMatch(providedSecret, configuredSecret)) {
    return unauthorized()
  }

  const bodyResult = await readVolunteerWebhookBody(request)
  if (!bodyResult.ok) {
    console.error("Volunteer webhook body read failed:", bodyResult.error)
    return NextResponse.json({ error: bodyResult.error }, { status: 400 })
  }

  const parsed = parseVolunteerWebhookBody(bodyResult.body)
  if ("error" in parsed) {
    console.error("Volunteer webhook parse failed:", parsed.error, parsed.hint ?? "", {
      receivedKeys: parsed.receivedKeys,
    })
    return NextResponse.json(
      {
        error: parsed.error,
        hint: parsed.hint,
        receivedKeys: parsed.receivedKeys,
      },
      { status: 400 },
    )
  }

  const { email, name, application } = parsed

  const result = await registerVolunteerApplicant({
    email,
    name,
    application,
    source: application.source ?? "webhook",
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
  }

  // Only notify on genuinely new applicants — the event name is
  // "volunteer.application.created", and re-applications are updates.
  if (result.created) {
    await notifyVolunteerWebhook({
      userId: result.userId,
      email,
      name,
      status: result.status,
      created: result.created,
      application,
    })
  }

  return NextResponse.json({
    ok: true,
    userId: result.userId,
    status: result.status,
    created: result.created,
  })
}
