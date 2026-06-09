import { expect, test } from "@playwright/test"

async function openSignInModal(page: import("@playwright/test").Page) {
  await page.goto("/?signin=1")
  await page.waitForLoadState("networkidle")
}

test.describe("Auth modal", () => {
  test("shows clean sign-in with password and magic link tabs", async ({ page }) => {
    await openSignInModal(page)

    await expect(page.getByText("User sign in")).toBeVisible()
    await expect(
      page.getByText("You can browse duas, share requests, and say ameen without an account."),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Password" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Magic link" })).toBeVisible()
    await expect(
      page.getByRole("tabpanel", { name: "Password" }).getByRole("button", { name: "Sign in" }),
    ).toBeVisible()
  })

  test("does not show inline forgot-password form on sign-in modal", async ({ page }) => {
    await openSignInModal(page)

    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Reset" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Send reset link" })).toHaveCount(0)
  })

  test("forgot password link points to dedicated page", async ({ page }) => {
    await page.goto("/?signin=1&next=/admin")
    await page.waitForLoadState("networkidle")

    const forgotLink = page
      .getByRole("tabpanel", { name: "Password" })
      .getByRole("link", { name: "Forgot password?" })
    await expect(forgotLink).toHaveAttribute("href", "/auth/forgot-password?next=%2Fadmin")

    const href = await forgotLink.getAttribute("href")
    await page.goto(href!)

    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible()
    await expect(
      page.getByRole("tabpanel", { name: "Password" }).getByRole("button", { name: "Sign in" }),
    ).toHaveCount(0)
  })

  test("magic link tab shows send form without visible password fields", async ({ page }) => {
    await openSignInModal(page)

    await page.getByRole("tab", { name: "Magic link" }).click()
    await expect(page.getByRole("tabpanel", { name: "Magic link" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Send magic link" })).toBeVisible()
    await expect(page.getByRole("tabpanel", { name: "Password" })).toBeHidden()
  })

  test("/auth redirects to homepage sign-in modal", async ({ page }) => {
    await page.goto("/auth?next=/admin")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/signin=1&next=%2Fadmin/)
    await expect(page.getByText("User sign in")).toBeVisible()
  })
})

test.describe("Admin access", () => {
  test("redirects unauthenticated users to sign in", async ({ page }) => {
    await page.goto("/admin")

    await expect(page).toHaveURL(/signin=1&next=%2Fadmin/)
    await expect(page.getByText("User sign in")).toBeVisible()
  })
})
