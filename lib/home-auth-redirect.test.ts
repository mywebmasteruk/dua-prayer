import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { resolveSignedInSignInRedirect } from "./home-auth-redirect"

describe("resolveSignedInSignInRedirect", () => {
  it("honors deep admin next paths for signed-in admins", () => {
    assert.equal(
      resolveSignedInSignInRedirect({ next: "/admin/settings", isAdmin: true }),
      "/admin/settings",
    )
  })

  it("does not honor arbitrary or admin-looking next paths", () => {
    assert.equal(resolveSignedInSignInRedirect({ next: "https://evil.example/admin", isAdmin: true }), "/")
    assert.equal(resolveSignedInSignInRedirect({ next: "/administer", isAdmin: true }), "/")
  })

  it("shows an admin-access error instead of silently landing home for signed-in non-admins", () => {
    assert.equal(
      resolveSignedInSignInRedirect({ next: "/admin/settings", isAdmin: false }),
      "/?signin=1&error=not_admin",
    )
  })
})
