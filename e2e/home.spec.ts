import { expect, test } from "@playwright/test"

test.describe("Homepage", () => {
  test("loads category filters", async ({ page }) => {
    await page.goto("/")

    const categoryFilters = page.getByRole("tablist", { name: "Filter duas by category" })
    await expect(categoryFilters).toBeVisible()

    // "All" plus at least one real category pill; pill names depend on seed data.
    await expect(categoryFilters.getByRole("tab", { name: "All", exact: true })).toBeVisible()
    expect(await categoryFilters.getByRole("tab").count()).toBeGreaterThan(1)

    const languageFilters = page.getByRole("tablist", { name: "Filter duas by language" })
    await expect(languageFilters.getByRole("tab", { name: "EN" })).toBeVisible()
    await expect(languageFilters.getByRole("tab", { name: "AR" })).toBeVisible()
  })

  test("submitted dua appears in feed without full reload", async ({ page }) => {
    await page.goto("/")

    const uniqueText = `E2E dua ${Date.now()} may Allah grant us peace and guidance.`

    await page
      .getByRole("button", { name: "Open composer to share a dua request" })
      .first()
      .click()

    const composer = page.getByRole("dialog")
    const textarea = composer.getByLabel("Dua text")
    await expect(textarea).toBeVisible()
    await textarea.fill(uniqueText)

    // Scope to the dialog: every feed article also has a "Share dua" button.
    const shareButton = composer.getByRole("button", { name: "Share Dua" })
    await expect(shareButton).toBeEnabled()
    await shareButton.click()

    await expect(page.getByText(uniqueText)).toBeVisible({ timeout: 15_000 })
  })

  test("flagging a dua keeps it visible and locks the flag state", async ({ page }) => {
    await page.goto("/")

    // Create a fresh dua so the test never depends on (or mutates) someone
    // else's content — flags are one-way and only admins can clear them.
    const uniqueText = `E2E flag target ${Date.now()} may Allah grant us patience and ease.`
    await page
      .getByRole("button", { name: "Open composer to share a dua request" })
      .first()
      .click()
    const composer = page.getByRole("dialog")
    await composer.getByLabel("Dua text").fill(uniqueText)
    await composer.getByRole("button", { name: "Share Dua" }).click()

    const targetDua = page.locator("article").filter({ hasText: uniqueText }).first()
    await expect(targetDua).toBeVisible({ timeout: 15_000 })

    const flagButton = targetDua.getByRole("button", { name: "Flag this dua" })
    await expect(flagButton).toHaveAttribute("aria-pressed", "false")
    await flagButton.click()

    const flaggedButton = targetDua.getByRole("button", { name: "Flagged for review" })
    await expect(flaggedButton).toHaveAttribute("aria-pressed", "true")
    await expect(flaggedButton).toBeDisabled()

    // The dua stays visible to the reporter; flagging never hides content.
    await expect(targetDua).toBeVisible()
    await expect(targetDua.getByText(uniqueText)).toBeVisible()
  })
})
