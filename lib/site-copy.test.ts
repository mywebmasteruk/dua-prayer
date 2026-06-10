import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { SITE_COPY_DEFAULTS, SITE_COPY_LABELS, type ComposerCopyKey, type SiteCopyKey } from "./site-copy"

const composerCopyKeys = [
  "composerTitleEn",
  "composerDescriptionEn",
  "composerPlaceholderEn",
  "composerCategoryPlaceholderEn",
  "composerSubmitEn",
  "composerSubmitAriaEn",
  "composerSubmittingEn",
  "composerTitleAr",
  "composerDescriptionAr",
  "composerPlaceholderAr",
  "composerCategoryPlaceholderAr",
  "composerSubmitAr",
  "composerSubmitAriaAr",
  "composerSubmittingAr",
  "composerCategoryFamilyAr",
  "composerCategoryForgivenessAr",
  "composerCategoryGeneralAr",
  "composerCategoryHealthAr",
  "composerCategoryCommunityAr",
] as const satisfies readonly SiteCopyKey[]

describe("site composer copy", () => {
  it("defines editable defaults and labels for every composer copy key", () => {
    for (const key of composerCopyKeys) {
      assert.equal(typeof SITE_COPY_DEFAULTS[key], "string", key)
      assert.ok(SITE_COPY_DEFAULTS[key].length > 0, key)
      assert.equal(typeof SITE_COPY_LABELS[key].label, "string", key)
      assert.equal(typeof SITE_COPY_LABELS[key].description, "string", key)
    }
  })

  it("provides respectful Arabic composer defaults", () => {
    assert.equal(SITE_COPY_DEFAULTS.composerTitleAr, "شارك دعاءك مع الأمة.")
    assert.equal(
      SITE_COPY_DEFAULTS.composerDescriptionAr,
      "يرجى عدم تضمين تفاصيل شخصية أو خاصة، واجعل الدعاء إيجابيًا. تخضع جميع المشاركات للمراجعة. جزاكم الله خيرًا",
    )
    assert.equal(SITE_COPY_DEFAULTS.composerPlaceholderAr, "ادعُ لنفسك أو لأهلك أو لمن يحتاج إلى الدعم...")
    assert.equal(SITE_COPY_DEFAULTS.composerCategoryPlaceholderAr, "التصنيف")
    assert.equal(SITE_COPY_DEFAULTS.composerSubmitAr, "ادعُ")
    assert.equal(SITE_COPY_DEFAULTS.composerSubmitAriaAr, "إرسال الدعاء")
    assert.equal(SITE_COPY_DEFAULTS.composerSubmittingAr, "جارٍ الإرسال...")
  })

  it("includes Arabic category label defaults for composer select options", () => {
    const expected = {
      composerCategoryFamilyAr: "العائلة",
      composerCategoryForgivenessAr: "المغفرة",
      composerCategoryGeneralAr: "عام",
      composerCategoryHealthAr: "الصحة",
      composerCategoryCommunityAr: "المجتمع",
    } as const satisfies Partial<Record<ComposerCopyKey, string>>

    for (const [key, label] of Object.entries(expected) as [keyof typeof expected, string][]) {
      assert.equal(SITE_COPY_DEFAULTS[key], label)
    }
  })
})
