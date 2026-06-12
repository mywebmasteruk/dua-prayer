import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { FOUNDING_ADMIN_EMAIL, FOUNDING_ADMIN_EMAILS, isFoundingAdminEmail } from "./admin-policy"

describe("admin policy", () => {
  it("allows the configured founding admin emails", () => {
    assert.equal(FOUNDING_ADMIN_EMAIL, "webmaster@duaprayer.com")
    assert.deepEqual([...FOUNDING_ADMIN_EMAILS], [
      "webmaster@duaprayer.com",
      "mywebmasteruk@gmail.com",
    ])
    assert.equal(isFoundingAdminEmail("webmaster@duaprayer.com"), true)
    assert.equal(isFoundingAdminEmail("mywebmasteruk@gmail.com"), true)
  })

  it("does not allow env-era aliases, case variants, or missing emails", () => {
    assert.equal(isFoundingAdminEmail("admin@duaprayer.com"), false)
    assert.equal(isFoundingAdminEmail("Webmaster@duaprayer.com"), false)
    assert.equal(isFoundingAdminEmail("MyWebmasterUk@gmail.com"), false)
    assert.equal(isFoundingAdminEmail(null), false)
    assert.equal(isFoundingAdminEmail(undefined), false)
  })
})
