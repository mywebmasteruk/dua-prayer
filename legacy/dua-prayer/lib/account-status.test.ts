import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  accountStatusPostAuthRedirect,
  accountStatusSignInMessage,
  shouldLimitInactiveAccount,
} from "./account-status"

describe("account status auth flow", () => {
  it("keeps pending-review users signed in and sends them to account status", () => {
    assert.equal(shouldLimitInactiveAccount("pending_review"), true)
    assert.equal(accountStatusPostAuthRedirect("pending_review"), "/account")
    assert.equal(
      accountStatusSignInMessage("pending_review"),
      "Your volunteer application is under review. We will email you when your account is activated.",
    )
  })

  it("does not reroute active users to account status", () => {
    assert.equal(shouldLimitInactiveAccount("active"), false)
    assert.equal(accountStatusPostAuthRedirect("active"), null)
  })
})
