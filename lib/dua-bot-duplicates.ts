import type { DuaBot } from "@/lib/dua-bots"
import type { Database } from "@/lib/types/database"

type DuaBotInsert = Database["public"]["Tables"]["dua_bots"]["Insert"]

const COPY_SUFFIX = " (copy)"
const MAX_BOT_NAME_LENGTH = 80

function duplicateBotName(name: string): string {
  const baseName = name.trim() || "Untitled bot"
  const availableLength = MAX_BOT_NAME_LENGTH - COPY_SUFFIX.length
  return `${baseName.slice(0, availableLength).trimEnd()}${COPY_SUFFIX}`
}

export function buildDuplicateDuaBotInsert(bot: DuaBot, userId: string): DuaBotInsert {
  return {
    name: duplicateBotName(bot.name),
    description: bot.description,
    status: "paused",
    frequency_minutes: bot.frequency_minutes,
    source_type: bot.source_type,
    rss_urls: [...bot.rss_urls],
    keywords: [...bot.keywords],
    categories: [...bot.categories],
    tone: bot.tone,
    language: bot.language,
    target_category_id: bot.target_category_id,
    publish_mode: bot.publish_mode,
    next_run_at: null,
    created_by: userId,
    updated_by: userId,
  }
}
