import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { parseChannelWebhookBody, readChannelWebhookBody } from "./channel-webhook-parse"

describe("parseChannelWebhookBody", () => {
  it("parses Fillout default submission questions", () => {
    const parsed = parseChannelWebhookBody({
      formId: "form_123",
      formName: "Channel form",
      submission: {
        submissionId: "sub_123",
        questions: [
          { id: "q_email", name: "Email", type: "EmailInput", value: "imam@example.com" },
          { id: "q_channel", name: "Channel name", type: "ShortAnswer", value: "Masjid Al-Noor" },
          { id: "q_description", name: "Description", type: "LongAnswer", value: "Community duas" },
        ],
      },
    })

    assert.ok(!("error" in parsed))
    assert.equal(parsed.applicantEmail, "imam@example.com")
    assert.equal(parsed.channelName, "Masjid Al-Noor")
    assert.equal(parsed.description, "Community duas")
    assert.equal(parsed.filloutSubmissionId, "sub_123")
  })

  it("parses Fillout name/value arrays such as urlParameters", () => {
    const parsed = parseChannelWebhookBody({
      formId: "form_123",
      formName: "Channel form",
      submission: {
        submissionId: "sub_123",
        questions: [{ id: "q_channel", name: "Channel name", value: "Masjid Al-Noor" }],
        urlParameters: [{ id: "email", name: "email", value: "imam@example.com" }],
      },
    })

    assert.ok(!("error" in parsed))
    assert.equal(parsed.applicantEmail, "imam@example.com")
    assert.equal(parsed.channelName, "Masjid Al-Noor")
  })

  it("parses Fillout submissions when answers are keyed by question id", () => {
    const parsed = parseChannelWebhookBody({
      submissionId: "sub_456",
      questions: [
        { id: "q_email", name: "Email", type: "EmailInput" },
        { id: "q_channel", name: "Channel name", type: "ShortAnswer" },
      ],
      answers: {
        q_email: "imam@example.com",
        q_channel: "Masjid Al-Noor",
      },
    })

    assert.ok(!("error" in parsed))
    assert.equal(parsed.applicantEmail, "imam@example.com")
    assert.equal(parsed.channelName, "Masjid Al-Noor")
    assert.equal(parsed.filloutSubmissionId, "sub_456")
  })

  it("parses common nested answer arrays", () => {
    const parsed = parseChannelWebhookBody({
      form_response: {
        token: "sub_789",
        answers: [
          { field: { title: "Email" }, email: "imam@example.com" },
          { field: { title: "Channel name" }, text: "Masjid Al-Noor" },
          { field: { title: "Website" }, url: "https://masjid.example" },
        ],
      },
    })

    assert.ok(!("error" in parsed))
    assert.equal(parsed.applicantEmail, "imam@example.com")
    assert.equal(parsed.channelName, "Masjid Al-Noor")
    assert.equal(parsed.payload.website, "https://masjid.example")
    assert.equal(parsed.filloutSubmissionId, "sub_789")
  })
})

describe("readChannelWebhookBody", () => {
  it("rejects empty form-encoded requests instead of treating them as an empty object", async () => {
    const request = new Request("https://example.test/api/webhooks/channel", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "",
    })

    const result = await readChannelWebhookBody(request)

    assert.deepEqual(result, { ok: false, error: "Empty request body." })
  })

  it("uses query parameters when Fillout sends fields in the URL instead of the body", async () => {
    const request = new Request(
      "https://example.test/api/webhooks/channel?email=imam%40example.com&channel%20name=Masjid%20Al-Noor",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "",
      },
    )

    const result = await readChannelWebhookBody(request)

    assert.deepEqual(result, {
      ok: true,
      body: {
        email: "imam@example.com",
        "channel name": "Masjid Al-Noor",
      },
    })
  })

  it("parses form-urlencoded request bodies", async () => {
    const request = new Request("https://example.test/api/webhooks/channel", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "email=imam%40example.com&channel%20name=Masjid%20Al-Noor",
    })

    const result = await readChannelWebhookBody(request)

    assert.deepEqual(result, {
      ok: true,
      body: {
        email: "imam@example.com",
        "channel name": "Masjid Al-Noor",
      },
    })
  })
})
