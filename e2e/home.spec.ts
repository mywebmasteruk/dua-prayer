import { expect, test } from "@playwright/test"

test.describe("Homepage", () => {
  test("loads category filters", async ({ page }) => {
    await page.goto("/")

    const feedFilter = page.getByRole("combobox").nth(1)
    await feedFilter.click()

    await expect(page.getByRole("option", { name: "All categories" })).toBeVisible()
    await expect(page.getByRole("option", { name: "General" })).toBeVisible()
    await expect(page.getByRole("option", { name: "Health" })).toBeVisible()
    await expect(page.getByRole("option", { name: "Family" })).toBeVisible()
  })

  test("submitted dua appears in feed without full reload", async ({ page }) => {
    await page.goto("/")

    const uniqueText = `E2E dua ${Date.now()} may Allah grant us peace and guidance.`
    const textarea = page.getByPlaceholder(/Share your Du'a here/i)

    await textarea.click()
    await textarea.fill(uniqueText)

    const shareButton = page.getByRole("button", { name: "Share Dua" })
    await expect(shareButton).toBeEnabled()
    await shareButton.click()

    await expect(page.getByText(uniqueText)).toBeVisible({ timeout: 15_000 })
  })

  test("flagging a dua keeps it visible and toggles the flag state", async ({ page }) => {
    await page.goto("/")

    const firstDua = page.locator("article").first()
    await expect(firstDua).toBeVisible()

    const duaText = await firstDua.locator("p").first().textContent()
    const currentFlagButton = firstDua.getByRole("button", { name: /Flag this dua|Flagged; click to undo/ })
    if ((await currentFlagButton.getAttribute("aria-pressed")) === "true") {
      await currentFlagButton.click()
    }

    const flagButton = firstDua.getByRole("button", { name: "Flag this dua" })

    await expect(flagButton).toHaveAttribute("aria-pressed", "false")
    await flagButton.click()

    await expect(firstDua).toBeVisible()
    await expect(firstDua.locator("p").first()).toHaveText(duaText ?? "")
    await expect(firstDua.getByRole("button", { name: "Flagged; click to undo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )

    await firstDua.getByRole("button", { name: "Flagged; click to undo" }).click()

    await expect(firstDua.getByRole("button", { name: "Flag this dua" })).toHaveAttribute("aria-pressed", "false")
    await expect(firstDua.locator("p").first()).toHaveText(duaText ?? "")
  })
})

