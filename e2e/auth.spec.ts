import { expect, test, type Page } from "@playwright/test"

const realLoginEmail = process.env.E2E_LOGIN_EMAIL
const realLoginPassword = process.env.E2E_LOGIN_PASSWORD

async function openSignInModal(page: Page) {
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

  test("root OAuth code fallback routes through callback exchange", async ({ page }) => {
    await page.goto("/?code=invalid-oauth-code&next=/admin")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/signin=1/)
    await expect(page).toHaveURL(/error=/)
    await expect(page).not.toHaveURL(/\?code=invalid-oauth-code/)
    await expect(page.getByText("User sign in")).toBeVisible()
  })

  test("signs in a normal user with password and shows signed-in sidebar", async ({ page }) => {
    test.skip(
      !realLoginEmail || !realLoginPassword,
      "Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run the real Supabase password login flow.",
    )

    await openSignInModal(page)

    const passwordPanel = page.getByRole("tabpanel", { name: "Password" })
    await passwordPanel.getByLabel("Email").fill(realLoginEmail!)
    await passwordPanel.getByLabel("Password").fill(realLoginPassword!)
    await passwordPanel.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL(/^(?!.*signin=1).*/, { timeout: 15_000 })
    await expect(page.getByText("User sign in")).toHaveCount(0)
    await expect(page.getByText("Signed in")).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(realLoginEmail!)).toBeVisible()
    await expect(page.getByRole("link", { name: "Following" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0)
  })
})

test.describe("Admin access", () => {
  test("redirects unauthenticated users to sign in", async ({ page }) => {
    await page.goto("/admin")

    await expect(page).toHaveURL(/signin=1&next=%2Fadmin/)
    await expect(page.getByText("User sign in")).toBeVisible()
  })
})
