import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  getPostingModeOption,
  isPostingMode,
  normalizePostingMode,
  POSTING_MODE_OPTIONS,
  shouldAllowPublicDuaSubmission,
  shouldHoldSubmissionForReview,
} from "./posting-settings-shared"

describe("posting settings", () => {
  it("normalizes missing or invalid posting modes to public", () => {
    assert.equal(normalizePostingMode(null), "public")
    assert.equal(normalizePostingMode(undefined), "public")
    assert.equal(normalizePostingMode("registered_only"), "registered_only")
    assert.equal(normalizePostingMode("closed"), "closed")
    assert.equal(normalizePostingMode("unknown"), "public")
  })

  it("recognizes only supported posting modes", () => {
    assert.equal(isPostingMode("public"), true)
    assert.equal(isPostingMode("registered_only"), true)
    assert.equal(isPostingMode("closed"), true)
    assert.equal(isPostingMode("admins_only"), false)
  })

  it("allows public dua submissions according to mode and identity", () => {
    assert.equal(shouldAllowPublicDuaSubmission({ mode: "public", isAuthenticated: false, isAdmin: false }).allowed, true)
    assert.equal(
      shouldAllowPublicDuaSubmission({ mode: "registered_only", isAuthenticated: false, isAdmin: false }).allowed,
      false,
    )
    assert.equal(
      shouldAllowPublicDuaSubmission({ mode: "registered_only", isAuthenticated: true, isAdmin: false }).allowed,
      true,
    )
    assert.equal(shouldAllowPublicDuaSubmission({ mode: "closed", isAuthenticated: true, isAdmin: false }).allowed, false)
    assert.equal(shouldAllowPublicDuaSubmission({ mode: "closed", isAuthenticated: true, isAdmin: true }).allowed, true)
    // visitor_moderated: everyone may submit (visitor posts are held, not blocked)
    assert.equal(
      shouldAllowPublicDuaSubmission({ mode: "visitor_moderated", isAuthenticated: false, isAdmin: false }).allowed,
      true,
    )
  })

  it("holds only visitor submissions for review in visitor_moderated mode", () => {
    assert.equal(shouldHoldSubmissionForReview({ mode: "visitor_moderated", isAuthenticated: false, isAdmin: false }), true)
    assert.equal(shouldHoldSubmissionForReview({ mode: "visitor_moderated", isAuthenticated: true, isAdmin: false }), false)
    assert.equal(shouldHoldSubmissionForReview({ mode: "public", isAuthenticated: false, isAdmin: false }), false)
    assert.equal(shouldHoldSubmissionForReview({ mode: "registered_only", isAuthenticated: false, isAdmin: false }), false)
  })

  it("exposes labels for every selectable mode", () => {
    for (const option of POSTING_MODE_OPTIONS) {
      const found = getPostingModeOption(option.mode)
      assert.ok(found)
      assert.equal(found.label.length > 0, true)
      assert.equal(found.helper.length > 0, true)
    }
  })
})
