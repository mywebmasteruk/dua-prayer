import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  getComposerCategoryLabel,
  SITE_COPY_DEFAULTS,
  SITE_COPY_LABELS,
  type ComposerCopyKey,
  type SiteCopyKey,
} from "./site-copy"
import { getGroupedSiteCopyKeys, SITE_COPY_GROUPS, type SiteCopyField } from "./site-copy-groups"

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
  "composerCategoryGuidanceAr",
  "composerCategoryGratitudeAr",
  "composerCategoryProtectionAr",
] as const satisfies readonly SiteCopyKey[]

describe("site copy grouping", () => {
  it("assigns every editable copy key to exactly one admin group", () => {
    const groupedKeys = getGroupedSiteCopyKeys()
    const uniqueGroupedKeys = new Set(groupedKeys)
    const defaultKeys = Object.keys(SITE_COPY_DEFAULTS) as SiteCopyKey[]

    assert.deepEqual(groupedKeys, [...uniqueGroupedKeys])
    assert.deepEqual([...uniqueGroupedKeys].sort(), [...defaultKeys].sort())
  })

  it("keeps composer translations in side-by-side translation pairs", () => {
    const composerGroup = SITE_COPY_GROUPS.find((group) => group.value === "composer")
    assert.ok(composerGroup)

    const translationFields = composerGroup.sections
      .flatMap((section) => section.fields as readonly SiteCopyField[])
      .filter((field) => field.type === "translation")

    assert.ok(translationFields.length > 0)
    for (const field of translationFields) {
      assert.match(field.enKey, /En$/)
      assert.match(field.arKey, /Ar$/)
    }
  })
})

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
      composerCategoryGuidanceAr: "الهداية",
      composerCategoryGratitudeAr: "الشكر",
      composerCategoryProtectionAr: "الحماية",
    } as const satisfies Partial<Record<ComposerCopyKey, string>>

    for (const [key, label] of Object.entries(expected) as [keyof typeof expected, string][]) {
      assert.equal(SITE_COPY_DEFAULTS[key], label)
    }
  })

  it("resolves known Arabic category labels and preserves unknown custom categories", () => {
    assert.equal(getComposerCategoryLabel("Guidance", SITE_COPY_DEFAULTS, "ar"), "الهداية")
    assert.equal(getComposerCategoryLabel("Gratitude", SITE_COPY_DEFAULTS, "ar"), "الشكر")
    assert.equal(getComposerCategoryLabel("Protection", SITE_COPY_DEFAULTS, "ar"), "الحماية")
    assert.equal(getComposerCategoryLabel("Custom channel", SITE_COPY_DEFAULTS, "ar"), "Custom channel")
    assert.equal(getComposerCategoryLabel("Guidance", SITE_COPY_DEFAULTS, "en"), "Guidance")
  })
})
