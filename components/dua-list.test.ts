import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

const source = readFileSync(new URL("./dua-list.tsx", import.meta.url), "utf8")

describe("dua list footer icons", () => {
  it("uses the DuaPrayer logo hands artwork for the Ameen action", () => {
    assert.match(source, /import Image from "next\/image"/)
    assert.match(source, /src="\/logo-icon\.png"/)
    assert.match(source, /alt=""/)
    assert.match(source, /className="h-4 w-4 object-contain"/)
    assert.doesNotMatch(source, /PrayerHandsIcon/)
    assert.doesNotMatch(source, /HeartHandshake/)
  })

  it("shows top hashtags instead of category names in the card metadata", () => {
    assert.match(source, /const topHashtags = getTopHashtags\(dua\.text\)/)
    assert.match(source, /topHashtags\.map\(\(hashtag\)/)
    assert.doesNotMatch(source, /renderWithArabicFont\(dua\.category_name\)/)
  })

  it("applies tighter medium serif typography only to Latin-script dua text", () => {
    assert.match(source, /const isLatinScript = isLatinScriptLanguage\(dua\.language, dua\.text\)/)
    assert.match(source, /isRtl \? "text-right font-medium leading-8" : "leading-7"/)
    assert.match(source, /isLatinScript && "font-medium leading-\[1\.5\]"/)
    assert.match(source, /isLatinScript && 'font-\[Georgia,Cambria,_"Times_New_Roman",Times,serif\]'/)
  })
})
