import 'server-only';

import { createHash } from 'crypto';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { evaluateDuaModeration, type AiModerationSettings } from '../ai-moderation';
import { detectLanguage } from '../detect-language';
import type { DuaBotRow, DuaBotStatus } from '../dua-bot-types';
import { callAiChatCompletions } from './ai-chat';
import { RETRIEVE_OUTPUT_CONTRACT } from './dua-bot-prompt';

export type { DuaBotRow, DuaBotStatus };

const MAX_SOURCE_BYTES = 5_000_000;
const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_DUAS_PER_RUN = 3;
const BOT_SELECT =
  'id, name, description, status, frequency_minutes, source_type, rss_urls, keywords, categories, tone, language, system_prompt, max_duas_per_run, target_category_id, publish_mode, last_run_at, next_run_at, last_status, last_error, created_at, updated_at';

type BotRunStatus = 'running' | 'success' | 'error' | 'skipped';

type EventCandidate = {
  key: string;
  title: string;
  summary: string | null;
  url: string | null;
  publishedAt: string | null;
  sourceUrl: string;
};

export type BotRunnerResult = {
  botsChecked: number;
  botsRun: number;
  duasCreated: number;
  errors: Array<{ botId: number; message: string }>;
};

export type UpdateBotFields = {
  name?: string;
  description?: string;
  rss_urls?: string[];
  system_prompt?: string;
  max_duas_per_run?: number;
  target_category_id?: number | null;
  publish_mode?: 'pending' | 'published';
  frequency_minutes?: number;
  language?: string;
  tone?: string;
  keywords?: string[];
  categories?: string[];
};

function nextRunDate(frequencyMinutes: number): string {
  return new Date(Date.now() + frequencyMinutes * 60_000).toISOString();
}

function normalizeMaxDuasPerRun(value: number | null | undefined): number {
  const parsed = Number.isFinite(value) ? Math.trunc(value as number) : DEFAULT_MAX_DUAS_PER_RUN;
  return Math.min(10, Math.max(1, parsed));
}

function normalizeFrequency(value: number | undefined): number {
  const parsed = Number.isFinite(value) ? Math.trunc(value as number) : 360;
  return Math.min(10_080, Math.max(15, parsed));
}

function stripXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function firstTag(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml);
  return match?.[1] != null ? stripXml(match[1]) : null;
}

function itemBlocks(xml: string): string[] {
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi);
  if (matches?.length) return matches;
  return xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
}

function eventKey(item: {
  url: string | null;
  title: string;
  publishedAt: string | null;
}): string {
  const basis = item.url?.trim() || `${item.title}\n${item.publishedAt ?? ''}`;
  return createHash('sha256').update(basis).digest('hex');
}

function parseRssEvents(xml: string, sourceUrl: string): EventCandidate[] {
  return itemBlocks(xml)
    .map((item) => {
      const title = firstTag(item, 'title');
      if (!title) return null;
      const link =
        firstTag(item, 'link') ??
        /<link[^>]+href=["']([^"']+)["']/i.exec(item)?.[1] ??
        null;
      const summary =
        firstTag(item, 'description') ??
        firstTag(item, 'summary') ??
        firstTag(item, 'content');
      const publishedRaw =
        firstTag(item, 'pubDate') ??
        firstTag(item, 'published') ??
        firstTag(item, 'updated');
      const published = publishedRaw ? new Date(publishedRaw) : null;
      const publishedAt =
        published && !Number.isNaN(published.getTime())
          ? published.toISOString()
          : null;
      return {
        key: eventKey({ url: link, title, publishedAt }),
        title,
        summary,
        url: link,
        publishedAt,
        sourceUrl,
      };
    })
    .filter((event): event is EventCandidate => Boolean(event));
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        Accept:
          'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5',
        'User-Agent':
          'Mozilla/5.0 (compatible; DuaPrayerBot/1.0; +https://www.duaprayer.com)',
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    const text = await response.text();
    return text.slice(0, MAX_SOURCE_BYTES);
  } finally {
    clearTimeout(timeout);
  }
}

async function loadAiSettings(): Promise<AiModerationSettings> {
  const admin = getSupabaseServerAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('key, value')
    .in('key', [
      'ai_moderation.enabled',
      'ai_moderation.api_key',
      'ai_moderation.model',
      'ai_moderation.base_url',
      'ai_moderation.timeout_ms',
    ]);

  const map = new Map((data ?? []).map((row) => [row.key, row.value]));

  return {
    enabled: map.get('ai_moderation.enabled') === 'true',
    apiKey: map.get('ai_moderation.api_key')?.trim() || null,
    model: map.get('ai_moderation.model')?.trim() || 'gpt-4o-mini',
    baseUrl:
      map.get('ai_moderation.base_url')?.trim() || 'https://api.openai.com/v1',
    timeoutMs:
      Number.parseInt(map.get('ai_moderation.timeout_ms') ?? '8000', 10) || 8000,
  };
}

function extractDuaText(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as {
      text?: unknown;
      dua?: unknown;
      hashtag?: unknown;
    };
    const body =
      (typeof parsed.text === 'string' && parsed.text.trim()) ||
      (typeof parsed.dua === 'string' && parsed.dua.trim()) ||
      '';
    if (!body) return null;
    const hashtag =
      typeof parsed.hashtag === 'string' && parsed.hashtag.trim()
        ? parsed.hashtag.trim().startsWith('#')
          ? parsed.hashtag.trim()
          : `#${parsed.hashtag.trim()}`
        : '';
    return hashtag ? `${body}\n\n${hashtag}` : body;
  } catch {
    // Plain text dua
    return trimmed;
  }
}

export async function listBots(): Promise<DuaBotRow[]> {
  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('dua_bots')
    .select(BOT_SELECT)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data ?? []) as DuaBotRow[];
}

export async function createBot(input: {
  name: string;
  description?: string;
  frequencyMinutes?: number;
  createdBy?: string | null;
}): Promise<DuaBotRow> {
  const admin = getSupabaseServerAdminClient();
  const now = new Date();
  const frequency = input.frequencyMinutes ?? 360;
  const nextRun = new Date(now.getTime() + frequency * 60_000).toISOString();

  const { data, error } = await admin
    .from('dua_bots')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      status: 'paused',
      frequency_minutes: frequency,
      next_run_at: nextRun,
      created_by: input.createdBy ?? null,
      updated_by: input.createdBy ?? null,
    })
    .select(BOT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return data as DuaBotRow;
}

export async function setBotStatus(
  botId: number,
  status: DuaBotStatus,
  updatedBy?: string | null,
): Promise<void> {
  const admin = getSupabaseServerAdminClient();
  const { error } = await admin
    .from('dua_bots')
    .update({
      status,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', botId);

  if (error) throw new Error(error.message);
}

export async function updateBot(
  botId: number,
  fields: UpdateBotFields,
  updatedBy?: string | null,
): Promise<DuaBotRow> {
  const admin = getSupabaseServerAdminClient();
  const patch: {
    updated_by: string | null;
    updated_at: string;
    name?: string;
    description?: string;
    rss_urls?: string[];
    system_prompt?: string;
    max_duas_per_run?: number;
    target_category_id?: number | null;
    publish_mode?: 'pending' | 'published';
    frequency_minutes?: number;
    language?: string;
    tone?: string;
    keywords?: string[];
    categories?: string[];
  } = {
    updated_by: updatedBy ?? null,
    updated_at: new Date().toISOString(),
  };

  if (fields.name !== undefined) {
    const name = fields.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new Error('Bot name must be 2–80 characters.');
    }
    patch.name = name;
  }

  if (fields.description !== undefined) {
    patch.description = fields.description.trim();
  }

  if (fields.rss_urls !== undefined) {
    patch.rss_urls = fields.rss_urls
      .map((url) => url.trim())
      .filter((url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
          return false;
        }
      });
  }

  if (fields.system_prompt !== undefined) {
    patch.system_prompt = fields.system_prompt.trim();
  }

  if (fields.max_duas_per_run !== undefined) {
    patch.max_duas_per_run = normalizeMaxDuasPerRun(fields.max_duas_per_run);
  }

  if (fields.target_category_id !== undefined) {
    patch.target_category_id = fields.target_category_id;
  }

  if (fields.publish_mode !== undefined) {
    if (fields.publish_mode !== 'pending' && fields.publish_mode !== 'published') {
      throw new Error('Invalid publish mode.');
    }
    patch.publish_mode = fields.publish_mode;
  }

  if (fields.frequency_minutes !== undefined) {
    patch.frequency_minutes = normalizeFrequency(fields.frequency_minutes);
  }

  if (fields.language !== undefined) {
    const language = fields.language.trim() || 'English';
    patch.language = language.slice(0, 80);
  }

  if (fields.tone !== undefined) {
    const tone = fields.tone.trim() || 'compassionate';
    patch.tone = tone.slice(0, 80);
  }

  if (fields.keywords !== undefined) {
    patch.keywords = fields.keywords.map((item) => item.trim()).filter(Boolean);
  }

  if (fields.categories !== undefined) {
    patch.categories = fields.categories
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const { data, error } = await admin
    .from('dua_bots')
    .update(patch)
    .eq('id', botId)
    .select(BOT_SELECT)
    .single();

  if (error) throw new Error(error.message);

  return data as DuaBotRow;
}

async function getPostedEventKeys(
  botId: number,
  keys: string[],
): Promise<Set<string>> {
  const uniqueKeys = [...new Set(keys)];
  if (uniqueKeys.length === 0) return new Set();

  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('dua_bot_event_posts')
    .select('event_key')
    .eq('bot_id', botId)
    .in('event_key', uniqueKeys);

  if (error) {
    console.error('Error checking bot event dedupe:', error);
    return new Set(uniqueKeys);
  }

  return new Set((data ?? []).map((row) => row.event_key as string));
}

async function discoverRssEvents(
  bot: DuaBotRow,
): Promise<{ events: EventCandidate[]; warnings: string[] }> {
  const events: EventCandidate[] = [];
  const warnings: string[] = [];
  const urls = Array.isArray(bot.rss_urls) ? bot.rss_urls : [];

  for (const sourceUrl of urls) {
    try {
      const content = await fetchWithTimeout(sourceUrl);
      events.push(...parseRssEvents(content, sourceUrl));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`${sourceUrl}: ${message}`);
    }
  }

  return { events, warnings };
}

async function createDuaFromEvent(
  bot: DuaBotRow,
  runId: number,
  event: EventCandidate,
  aiSettings: AiModerationSettings,
): Promise<boolean> {
  const pageText = event.summary?.trim() || event.title;
  const system = [bot.system_prompt?.trim(), RETRIEVE_OUTPUT_CONTRACT]
    .filter(Boolean)
    .join('\n');
  const user = [
    `Event title: ${JSON.stringify(event.title)}`,
    event.url ? `Event URL: ${event.url}` : '',
    event.publishedAt ? `Published: ${event.publishedAt}` : '',
    'Event content:',
    pageText,
  ]
    .filter(Boolean)
    .join('\n');

  const raw = await callAiChatCompletions({
    settings: aiSettings,
    system,
    user,
    timeoutMs: Math.max(aiSettings.timeoutMs, 15_000),
  });

  const text = extractDuaText(raw);
  if (!text || text.trim().length < 15) return false;

  const clipped = text.slice(0, 1200).trim();

  const moderation = await evaluateDuaModeration({
    text: clipped,
    settings: aiSettings,
  });

  if (moderation.severity === 'block') {
    return false;
  }

  const published = bot.publish_mode === 'published';
  const admin = getSupabaseServerAdminClient();
  const { data: dua, error: duaError } = await admin
    .from('duas')
    .insert({
      text: clipped,
      category_id: bot.target_category_id,
      published,
      flagged: !published,
      user_id: null,
      language: detectLanguage(clipped),
    })
    .select('id')
    .single();

  if (duaError) throw new Error(duaError.message);

  const { error: postError } = await admin.from('dua_bot_event_posts').insert({
    bot_id: bot.id,
    run_id: runId,
    dua_id: dua.id,
    event_key: event.key,
    event_title: event.title,
    event_url: event.url,
    event_published_at: event.publishedAt,
    source_type: 'rss',
    source_url: event.sourceUrl,
  });

  if (postError) throw new Error(postError.message);

  return true;
}

async function finishRun(
  runId: number,
  status: BotRunStatus,
  eventsFound: number,
  duasCreated: number,
  message: string | null,
) {
  const admin = getSupabaseServerAdminClient();
  const { error } = await admin
    .from('dua_bot_runs')
    .update({
      status,
      events_found: eventsFound,
      duas_created: duasCreated,
      message,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId);

  if (error) console.error('Error updating dua bot run:', error);
}

async function updateBotRunState(
  bot: DuaBotRow,
  status: Exclude<BotRunStatus, 'running'>,
  message: string | null,
) {
  const admin = getSupabaseServerAdminClient();
  const { error } = await admin
    .from('dua_bots')
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: nextRunDate(bot.frequency_minutes || 360),
      last_status: status,
      last_error: status === 'error' ? message : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bot.id);

  if (error) console.error('Error updating dua bot state:', error);
}

async function runOneBot(bot: DuaBotRow): Promise<{ created: number; error: string | null }> {
  const admin = getSupabaseServerAdminClient();
  let runId: number | null = null;
  let eventsFound = 0;
  let created = 0;

  try {
    const { data: run, error: runError } = await admin
      .from('dua_bot_runs')
      .insert({
        bot_id: bot.id,
        status: 'running',
      })
      .select('id')
      .single();

    if (runError || !run) throw new Error(runError?.message ?? 'Could not start bot run.');
    runId = run.id as number;

    const aiSettings = await loadAiSettings();
    if (!aiSettings.apiKey) {
      throw new Error(
        'AI is not configured. Save an API key under Admin → Settings (AI moderation) before running dua bots.',
      );
    }

    const urls = Array.isArray(bot.rss_urls) ? bot.rss_urls.filter(Boolean) : [];
    if (urls.length === 0) {
      throw new Error('No RSS URLs configured for this bot.');
    }

    const discovery = await discoverRssEvents(bot);
    const matched = discovery.events.sort((a, b) =>
      (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
    );
    eventsFound = matched.length;

    const postedKeys = await getPostedEventKeys(
      bot.id,
      matched.map((event) => event.key),
    );
    const limit = normalizeMaxDuasPerRun(bot.max_duas_per_run);
    const selected = matched
      .filter((event) => !postedKeys.has(event.key))
      .slice(0, limit);

    const eventErrors: string[] = [];
    for (const event of selected) {
      try {
        if (await createDuaFromEvent(bot, runId, event, aiSettings)) {
          created += 1;
        }
      } catch (error) {
        eventErrors.push(error instanceof Error ? error.message : String(error));
      }
    }

    const warnings = [...discovery.warnings, ...eventErrors.map((err) => `Event error: ${err}`)];
    const status: BotRunStatus =
      created > 0 ? 'success' : eventErrors.length > 0 ? 'error' : 'skipped';
    const message =
      created > 0
        ? `Created ${created} dua(s) from ${eventsFound} event(s).`
        : eventErrors.length > 0
          ? `No duas created — attempts failed. ${warnings.join('; ')}`
          : `No new duas (${eventsFound} event(s) found).${warnings.length ? ` ${warnings.join('; ')}` : ''}`;

    await finishRun(runId, status, eventsFound, created, message);
    await updateBotRunState(bot, status, message);
    return { created, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (runId != null) {
      await finishRun(runId, 'error', eventsFound, created, message);
    }
    await updateBotRunState(bot, 'error', message);
    return { created, error: message };
  }
}

function isDue(bot: DuaBotRow, manual: boolean): boolean {
  if (manual) return true;
  if (bot.status !== 'active') return false;
  if (!bot.next_run_at) return true;
  return new Date(bot.next_run_at).getTime() <= Date.now();
}

/**
 * RSS → AI → dua runner MVP.
 * Cron selects active bots due by next_run_at; manual botId runs even if paused.
 */
export async function runDueDuaBots(options?: {
  botId?: number;
}): Promise<BotRunnerResult> {
  const admin = getSupabaseServerAdminClient();
  const manual = options?.botId != null;

  let query = admin.from('dua_bots').select(BOT_SELECT);

  if (manual) {
    query = query.eq('id', options!.botId!);
  } else {
    query = query.eq('status', 'active');
  }

  const { data, error } = await query.limit(50);
  if (error) throw new Error(error.message);

  const bots = ((data ?? []) as DuaBotRow[]).filter((bot) => isDue(bot, manual));
  const result: BotRunnerResult = {
    botsChecked: data?.length ?? 0,
    botsRun: 0,
    duasCreated: 0,
    errors: [],
  };

  for (const bot of bots) {
    result.botsRun += 1;
    const run = await runOneBot(bot);
    result.duasCreated += run.created;
    if (run.error) result.errors.push({ botId: bot.id, message: run.error });
  }

  return result;
}
