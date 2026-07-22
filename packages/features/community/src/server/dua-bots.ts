import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import type { DuaBotRow, DuaBotStatus } from '../dua-bot-types';

export type { DuaBotRow, DuaBotStatus };

export async function listBots(): Promise<DuaBotRow[]> {
  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('dua_bots')
    .select(
      'id, name, description, status, frequency_minutes, source_type, rss_urls, keywords, categories, tone, language, system_prompt, max_duas_per_run, target_category_id, publish_mode, last_run_at, next_run_at, last_status, last_error, created_at, updated_at',
    )
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
    .select(
      'id, name, description, status, frequency_minutes, source_type, rss_urls, keywords, categories, tone, language, system_prompt, max_duas_per_run, target_category_id, publish_mode, last_run_at, next_run_at, last_status, last_error, created_at, updated_at',
    )
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

/**
 * Stub runner: advances next_run_at and records a skipped run.
 * Full RSS/AI generation remains deferred.
 */
export async function runDueBotsStub(options?: {
  botId?: number;
}): Promise<{ ran: number; skipped: number }> {
  const admin = getSupabaseServerAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  let query = admin
    .from('dua_bots')
    .select('id, frequency_minutes, status, next_run_at')
    .eq('status', 'active');

  if (options?.botId != null) {
    query = admin
      .from('dua_bots')
      .select('id, frequency_minutes, status, next_run_at')
      .eq('id', options.botId);
  } else {
    query = query.or(`next_run_at.is.null,next_run_at.lte.${nowIso}`);
  }

  const { data: bots, error } = await query.limit(50);

  if (error) throw new Error(error.message);

  let ran = 0;

  for (const bot of bots ?? []) {
    const frequency = bot.frequency_minutes || 360;
    const nextRun = new Date(now.getTime() + frequency * 60_000).toISOString();

    const { error: runError } = await admin.from('dua_bot_runs').insert({
      bot_id: bot.id,
      started_at: nowIso,
      finished_at: nowIso,
      status: 'skipped',
      events_found: 0,
      duas_created: 0,
      message: 'Stub runner: generation not implemented yet.',
    });

    if (runError) throw new Error(runError.message);

    const { error: updateError } = await admin
      .from('dua_bots')
      .update({
        last_run_at: nowIso,
        next_run_at: nextRun,
        last_status: 'skipped',
        last_error: null,
        updated_at: nowIso,
      })
      .eq('id', bot.id);

    if (updateError) throw new Error(updateError.message);

    ran += 1;
  }

  return { ran, skipped: ran };
}
