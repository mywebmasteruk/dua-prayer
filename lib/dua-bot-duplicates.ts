import type { BotFormInput, DuaBot } from "@/lib/dua-bots"
import type { Database } from "@/lib/types/database"

type DuaBotInsert = Database["public"]["Tables"]["dua_bots"]["Insert"]

const COPY_SUFFIX = " (copy)"
const MAX_BOT_NAME_LENGTH = 80

function duplicateBotName(name: string): string {
  const baseName = name.trim() || "Untitled bot"
  const availableLength = MAX_BOT_NAME_LENGTH - COPY_SUFFIX.length
  return `${baseName.slice(0, availableLength).trimEnd()}${COPY_SUFFIX}`
}

export function buildDuplicateDuaBotDraft(bot: DuaBot): BotFormInput {
  return {
    name: duplicateBotName(bot.name),
    description: bot.description,
    systemPrompt: bot.system_prompt ?? undefined,
    status: "paused",
    frequencyMinutes: bot.frequency_minutes,
    sourceType: bot.source_type,
    rssUrls: [...bot.rss_urls],
    keywords: [...bot.keywords],
    categories: [...bot.categories],
    tone: bot.tone,
    language: bot.language,
    targetCategoryId: bot.target_category_id,
    publishMode: bot.publish_mode,
  }
}

export function buildDuplicateDuaBotInsert(bot: DuaBot, userId: string): DuaBotInsert {
  const draft = buildDuplicateDuaBotDraft(bot)

  return {
    name: draft.name,
    description: draft.description,
    system_prompt: draft.systemPrompt ?? null,
    status: "paused",
    frequency_minutes: draft.frequencyMinutes,
    source_type: draft.sourceType,
    rss_urls: draft.rssUrls as string[],
    keywords: draft.keywords as string[],
    categories: draft.categories as string[],
    tone: draft.tone,
    language: draft.language,
    target_category_id: draft.targetCategoryId,
    publish_mode: draft.publishMode,
    next_run_at: null,
    created_by: userId,
    updated_by: userId,
  }
}
