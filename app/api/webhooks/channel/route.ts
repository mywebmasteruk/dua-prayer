import { NextResponse } from "next/server"
import {
  notifyChannelApplicationWebhook,
  registerChannelApplication,
} from "@/lib/channel-applications"
import {
  parseChannelWebhookBody,
  readChannelWebhookBody,
} from "@/lib/channel-webhook-parse"

const WEBHOOK_PATH = "/api/webhooks/channel"

const corsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Secret",
}

function getWebhookSecret(): string | null {
  return process.env.CHANNEL_WEBHOOK_SECRET?.trim() || null
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
        "Channel application webhook is active. Submit applications with POST, JSON body, and X-Webhook-Secret header.",
      requiredFields: [
        "email (or Fillout Email question)",
        "channel name (or Channel name / organization question)",
      ],
      optionalFields: ["description", "handle", "name", "message", "organization", "website", "source"],
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
    return NextResponse.json({ error: "Channel webhook is not configured." }, { status: 503 })
  }

  const providedSecret = request.headers.get("x-webhook-secret")?.trim()
  if (!providedSecret || providedSecret !== configuredSecret) {
    return unauthorized()
  }

  const bodyResult = await readChannelWebhookBody(request)
  if (!bodyResult.ok) {
    console.error("Channel webhook body read failed:", bodyResult.error)
    return NextResponse.json({ error: bodyResult.error }, { status: 400 })
  }

  const parsed = parseChannelWebhookBody(bodyResult.body)
  if ("error" in parsed) {
    console.error("Channel webhook parse failed:", parsed.error, parsed.hint ?? "", {
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

  const {
    channelName,
    description,
    applicantEmail,
    applicantName,
    handle,
    filloutSubmissionId,
    payload,
  } = parsed

  const result = await registerChannelApplication({
    channelName,
    description,
    applicantEmail,
    applicantName,
    handle,
    filloutSubmissionId,
    payload,
    source: payload.source ?? "webhook",
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
  }

  if (result.created) {
    await notifyChannelApplicationWebhook({
      channelId: result.channelId,
      channelName,
      applicantEmail,
      applicantName,
      status: result.status,
      created: result.created,
      payload,
    })
  }

  return NextResponse.json({
    ok: true,
    channelId: result.channelId,
    applicationId: result.channelId,
    status: result.status,
    created: result.created,
  })
}
