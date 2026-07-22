import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getUserNavState } from "./user-nav"

describe("user navigation state", () => {
  it("shows sign-in CTA for logged-out visitors", () => {
    const state = getUserNavState(null)

    assert.equal(state.showAdminLink, false)
    assert.deepEqual(state.guestAccountItem, {
      href: "/?signin=1",
      label: "Sign in",
      variant: "cta",
    })
    assert.equal(state.signedInSummary, null)
    assert.deepEqual(state.signedInItems, [])
    assert.equal(state.mobileUserItem.href, "/?signin=1")
    assert.equal(state.mobileUserItem.label, "Sign in")
  })

  it("shows normal signed-in features without admin or broken account links", () => {
    const state = getUserNavState("member@example.com")

    assert.equal(state.showAdminLink, false)
    assert.equal(state.guestAccountItem, null)
    assert.deepEqual(state.signedInSummary, {
      eyebrow: "Signed in",
      label: "member@example.com",
    })
    assert.deepEqual(
      state.signedInItems.map((item) => [item.href, item.label]),
      [
        ["/profile", "Profile"],
        ["/bookmarks", "Bookmarks"],
        ["/notifications", "Notifications"],
      ],
    )
    assert.equal(state.mobileUserItem.href, "/account")
    assert.equal(state.mobileUserItem.label, "Account")
  })

  it("exposes admin to the founding webmaster", () => {
    const state = getUserNavState("webmaster@duaprayer.com")

    assert.equal(state.showAdminLink, true)
    assert.equal(state.guestAccountItem, null)
    assert.equal(state.mobileUserItem.href, "/admin")
    assert.equal(state.mobileUserItem.label, "Admin")
  })

  it("exposes admin to non-founding users with admin permissions (moderators, volunteers)", () => {
    const state = getUserNavState("helper@example.com", true)
    assert.equal(state.showAdminLink, true)
    assert.equal(state.mobileUserItem.href, "/admin")
  })

  it("hides admin from a regular signed-in member", () => {
    const state = getUserNavState("member@example.com", false)
    assert.equal(state.showAdminLink, false)
    assert.equal(state.mobileUserItem.href, "/account")
  })
})
