import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { FOUNDING_ADMIN_EMAIL, isFoundingAdminEmail } from "./admin-policy"

describe("admin policy", () => {
  it("allows only the fixed founding admin email", () => {
    assert.equal(FOUNDING_ADMIN_EMAIL, "webmaster@duaprayer.com")
    assert.equal(isFoundingAdminEmail("webmaster@duaprayer.com"), true)
  })

  it("does not allow env-era aliases, case variants, or missing emails", () => {
    assert.equal(isFoundingAdminEmail("admin@duaprayer.com"), false)
    assert.equal(isFoundingAdminEmail("Webmaster@duaprayer.com"), false)
    assert.equal(isFoundingAdminEmail(null), false)
    assert.equal(isFoundingAdminEmail(undefined), false)
  })
})
