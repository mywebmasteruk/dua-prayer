import { expect, test } from "@playwright/test"

test.describe("Homepage", () => {
  test("loads feed filters", async ({ page }) => {
    await page.goto("/")

    // Feed filtering is by trending hashtag (with an "All" reset) plus language.
    const hashtagFilters = page.getByRole("tablist", { name: "Filter duas by trending hashtag" })
    await expect(hashtagFilters).toBeVisible()
    await expect(hashtagFilters.getByRole("tab", { name: "All", exact: true })).toBeVisible()

    const languageFilters = page.getByRole("tablist", { name: "Filter duas by language" })
    await expect(languageFilters.getByRole("tab", { name: "EN" })).toBeVisible()
    await expect(languageFilters.getByRole("tab", { name: "AR" })).toBeVisible()
  })

  test("composer uses make dua action language", async ({ page }) => {
    await page.goto("/")

    const openComposerButton = page.getByRole("button", { name: "Open composer to make a dua" }).first()
    await expect(openComposerButton).toContainText("What dua would you like to make?")
    await openComposerButton.click()

    const composer = page.getByRole("dialog")
    await expect(composer.getByRole("heading", { name: "Share your dua with the Ummah." })).toBeVisible()
    await expect(composer.getByText("Please do not include personal or private details and keep it positive. All posts are subject to moderation. JZK")).toBeVisible()
    await expect(composer.getByRole("button", { name: "Make Dua" })).toBeDisabled()

    await composer.getByRole("combobox", { name: "Language" }).click()
    await page.getByRole("option", { name: "العربية" }).click()

    await expect(composer.getByRole("heading", { name: "شارك دعاءك مع الأمة." })).toBeVisible()
    await expect(
      composer.getByText(
        "يرجى عدم تضمين تفاصيل شخصية أو خاصة، واجعل الدعاء إيجابيًا. تخضع جميع المشاركات للمراجعة. جزاكم الله خيرًا",
      ),
    ).toBeVisible()
    await expect(composer.getByPlaceholder("ادعُ لنفسك أو لأهلك أو لمن يحتاج إلى الدعم...")).toHaveAttribute(
      "dir",
      "rtl",
    )
    await expect(composer.getByText("عام")).toBeVisible()
    await expect(composer.getByRole("button", { name: "إرسال الدعاء" })).toBeDisabled()
  })

  test("channel application page prompts logged-out users before showing Fillout", async ({ page }) => {
    await page.goto("/channels/apply")

    await expect(page.getByRole("heading", { name: "Apply to open a channel" })).toBeVisible()
    await expect(page.getByText("Community channels")).toBeVisible()
    await expect(page.getByRole("link", { name: /Back to channels?/i })).toHaveCount(0)
    await expect(page.getByText("Log in or create an account before applying.")).toBeVisible()
    await expect(page.getByRole("link", { name: "Log in or create account" })).toHaveAttribute(
      "href",
      "/?signin=1&next=%2Fchannels%2Fapply",
    )
    await expect(page.locator('iframe[title="DuaPrayer channel application"]')).toHaveCount(0)
  })

  test("submitted dua appears in feed without full reload", async ({ page }) => {
    await page.goto("/")

    const uniqueText = `E2E dua ${Date.now()} may Allah grant us peace and guidance.`

    await page
      .getByRole("button", { name: "Open composer to make a dua" })
      .first()
      .click()

    const composer = page.getByRole("dialog")
    const textarea = composer.getByLabel("Dua text")
    await expect(textarea).toBeVisible()
    await textarea.fill(uniqueText)

    // Scope to the dialog: feed articles also expose action buttons.
    const shareButton = composer.getByRole("button", { name: "Make Dua" })
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
      .getByRole("button", { name: "Open composer to make a dua" })
      .first()
      .click()
    const composer = page.getByRole("dialog")
    await composer.getByLabel("Dua text").fill(uniqueText)
    await composer.getByRole("button", { name: "Make Dua" }).click()

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
