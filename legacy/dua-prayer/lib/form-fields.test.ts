import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  DEFAULT_CHANNEL_REGISTRY,
  DEFAULT_VOLUNTEER_REGISTRY,
  parseFormRegistry,
  serializeFormRegistry,
  validateAnswers,
  fieldForBinding,
  type FormRegistry,
} from "./form-fields"
import { readAnswersFromFormData, boundString, stringAnswer } from "./form-submit"

describe("parseFormRegistry", () => {
  it("falls back on empty / malformed input", () => {
    assert.equal(parseFormRegistry(null, DEFAULT_CHANNEL_REGISTRY), DEFAULT_CHANNEL_REGISTRY)
    assert.equal(parseFormRegistry("", DEFAULT_CHANNEL_REGISTRY), DEFAULT_CHANNEL_REGISTRY)
    assert.equal(parseFormRegistry("not json", DEFAULT_CHANNEL_REGISTRY), DEFAULT_CHANNEL_REGISTRY)
    assert.equal(parseFormRegistry('{"fields":[]}', DEFAULT_CHANNEL_REGISTRY), DEFAULT_CHANNEL_REGISTRY)
  })

  it("drops malformed fields and sorts by order", () => {
    const raw = JSON.stringify({
      version: 1,
      fields: [
        { id: "b", label: "B", type: "text", order: 20 },
        { id: "bad", type: "text" }, // missing label → dropped
        { id: "a", label: "A", type: "email", order: 10 },
      ],
    })
    const parsed = parseFormRegistry(raw, DEFAULT_VOLUNTEER_REGISTRY)
    assert.deepEqual(parsed.fields.map((f) => f.id), ["a", "b"])
    assert.equal(parsed.fields[0].required, false) // default applied
    assert.equal(parsed.fields[0].enabled, true)
  })

  it("round-trips through serialize", () => {
    const serialized = serializeFormRegistry(DEFAULT_CHANNEL_REGISTRY)
    const parsed = parseFormRegistry(serialized, DEFAULT_VOLUNTEER_REGISTRY)
    assert.equal(parsed.fields.length, DEFAULT_CHANNEL_REGISTRY.fields.length)
  })
})

describe("validateAnswers", () => {
  const registry: FormRegistry = {
    version: 1,
    fields: [
      { id: "email", key: "email", label: "Email", type: "email", required: true, enabled: true, showInReview: true, order: 10 },
      { id: "agree", key: "agree", label: "Agree", type: "checkbox", required: true, enabled: true, showInReview: true, order: 20 },
      { id: "doc", key: "doc", label: "Doc", type: "file", required: true, enabled: true, showInReview: true, order: 30 },
      { id: "note", key: "note", label: "Note", type: "textarea", required: false, enabled: true, showInReview: true, order: 40 },
      { id: "off", key: "off", label: "Disabled req", type: "text", required: true, enabled: false, showInReview: true, order: 50 },
    ],
  }

  it("flags missing required fields, ignores disabled ones", () => {
    const result = validateAnswers(registry, {})
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.ok(result.errors.email)
      assert.ok(result.errors.agree)
      assert.ok(result.errors.doc)
      assert.equal(result.errors.off, undefined) // disabled → skipped
      assert.equal(result.errors.note, undefined) // optional
    }
  })

  it("passes when required fields are satisfied", () => {
    const result = validateAnswers(registry, {
      email: "a@b.com",
      agree: true,
      doc: { path: "channel/doc/x/file.pdf", name: "file.pdf", size: 10, type: "application/pdf" },
    })
    assert.equal(result.ok, true)
  })

  it("treats an unchecked checkbox and empty file as missing", () => {
    const result = validateAnswers(registry, { email: "a@b.com", agree: false, doc: "not-a-file" as never })
    assert.equal(result.ok, false)
  })
})

describe("readAnswersFromFormData + bindings", () => {
  it("maps form data by field id and extracts system bindings", () => {
    const registry = DEFAULT_CHANNEL_REGISTRY
    const fd = new FormData()
    fd.set("channel_name", "Masjid Al-Noor")
    fd.set("email", "imam@example.com")
    fd.set("description", "Community duas")
    fd.set("agree_terms", "true")
    fd.set(
      "registration_document",
      JSON.stringify({ path: "channel/registration_document/x/doc.pdf", name: "doc.pdf", size: 5, type: "application/pdf" }),
    )

    const answers = readAnswersFromFormData(registry, fd)

    assert.equal(boundString(registry, answers, "channelName"), "Masjid Al-Noor")
    assert.equal(boundString(registry, answers, "email"), "imam@example.com")
    assert.equal(boundString(registry, answers, "description"), "Community duas")
    assert.equal(answers.agree_terms, true)
    assert.equal(stringAnswer(answers, "channel_name"), "Masjid Al-Noor")
    assert.ok(answers.registration_document && typeof answers.registration_document === "object")
    assert.equal(fieldForBinding(registry, "channelName")?.id, "channel_name")
  })
})
