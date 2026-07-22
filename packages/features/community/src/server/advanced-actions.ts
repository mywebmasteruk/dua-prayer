'use server';

import { revalidatePath } from 'next/cache';

import * as z from 'zod';

import { verifyCaptchaToken } from '@kit/auth/captcha/server';
import { authActionClient } from '@kit/next/safe-action';
import type { Json } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  channelHandleFromName,
  normalizeChannelHandle,
} from '../channel-handle';
import {
  FOOTER_LINKS_SETTING_KEY,
  parseFooterLinks,
  resolveFooterLinks,
  type FooterLink,
} from '../footer-links';
import {
  fieldForBinding,
  parseFormRegistry,
  validateAnswers,
  type FormAnswerValue,
  type FormKind,
  type FormRegistry,
} from '../form-fields';
import {
  parseRssSettings,
  RSS_DEFAULTS,
  RSS_SETTING_KEY_LIST,
  RSS_SETTING_KEYS,
  type RssSettings,
} from '../rss-settings';
import {
  SITE_COPY_DEFAULTS,
  SITE_COPY_SETTING_KEYS,
  type SiteCopyKey,
} from '../site-copy';
import {
  isVolunteerStatus,
  isVolunteerTier,
  VOLUNTEER_TIERS,
  VOLUNTEER_STATUSES,
} from '../volunteer-tiers';
import { createCommunityApi } from './api';
import {
  createBot,
  listBots,
  runDueBotsStub,
  setBotStatus,
} from './dua-bots';
import { loadFormRegistry, saveFormRegistry } from './form-registry';
import { notifyAccount } from './notify';

function answerString(
  answers: Record<string, unknown>,
  key: string,
): string {
  const value = answers[key];
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function bindingValue(
  registry: FormRegistry,
  answers: Record<string, unknown>,
  binding: string,
): string {
  const field = fieldForBinding(registry, binding);
  if (!field) return '';
  return answerString(answers, field.id);
}

async function maybeVerifyCaptcha(captchaToken?: string) {
  if (!process.env.CAPTCHA_SECRET_TOKEN) return;

  if (!captchaToken) {
    throw new Error('Bot verification failed. Please try again.');
  }

  await verifyCaptchaToken(captchaToken);
}

async function requireSuperAdmin() {
  const client = getSupabaseServerClient();
  const { data, error } = await client.rpc('is_super_admin');

  if (error || !data) {
    throw new Error('Unauthorized');
  }
}

export async function getMyPendingChannelApplication() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return null;

  const admin = getSupabaseServerAdminClient();
  const { data } = await admin
    .from('categories')
    .select('id, name, handle, status, description, created_at')
    .eq('channel_type', 'user')
    .eq('status', 'pending_review')
    .eq('owner_id', user.id)
    .maybeSingle();

  return data;
}

export async function listChannelApplications() {
  await requireSuperAdmin();
  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('categories')
    .select(
      'id, name, handle, description, status, owner_id, application, created_at, reviewed_at',
    )
    .eq('channel_type', 'user')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export const submitChannelApplicationAction = authActionClient
  .inputSchema(
    z.object({
      answers: z.record(z.string(), z.unknown()).optional(),
      channelName: z.string().trim().min(2).max(80).optional(),
      handle: z.string().trim().min(2).max(32).optional(),
      description: z.string().trim().max(500).optional(),
      message: z.string().trim().max(1000).optional(),
      captchaToken: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await maybeVerifyCaptcha(parsedInput.captchaToken);

    const pending = await getMyPendingChannelApplication();

    if (pending) {
      throw new Error('You already have a channel application under review.');
    }

    const registry = await loadFormRegistry('channel');
    const answers = (parsedInput.answers ?? {}) as Record<string, unknown>;

    if (parsedInput.answers) {
      const validation = validateAnswers(
        registry,
        answers as Record<string, FormAnswerValue | undefined>,
      );
      if (!validation.ok) {
        throw new Error(Object.values(validation.errors)[0] ?? 'Invalid form');
      }
    }

    const channelName =
      bindingValue(registry, answers, 'channelName') ||
      parsedInput.channelName?.trim() ||
      '';
    const description =
      bindingValue(registry, answers, 'description') ||
      parsedInput.description?.trim() ||
      '';
    const handleInput =
      bindingValue(registry, answers, 'handle') ||
      parsedInput.handle?.trim() ||
      '';
    const applicantName = bindingValue(registry, answers, 'applicantName');
    const applicantEmail =
      bindingValue(registry, answers, 'email') || user.email || '';
    const message =
      answerString(answers, 'message') || parsedInput.message?.trim() || '';

    if (channelName.length < 2) {
      throw new Error('Channel name is required.');
    }

    const handle =
      normalizeChannelHandle(handleInput) ||
      channelHandleFromName(channelName);

    if (handle.length < 2) {
      throw new Error('Channel handle must be at least 2 characters.');
    }

    const admin = getSupabaseServerAdminClient();
    const { data: existing } = await admin
      .from('categories')
      .select('id')
      .eq('handle', handle)
      .maybeSingle();

    if (existing) {
      throw new Error('That handle is already taken.');
    }

    const { error } = await admin.from('categories').insert({
      name: channelName,
      description,
      handle,
      channel_type: 'user',
      status: 'pending_review',
      is_active: false,
      is_verified: false,
      owner_id: user.id,
      application: {
        applicantEmail,
        applicantName,
        message,
        answers,
        source: 'in-app',
      } as Json,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/channels/apply');
    revalidatePath('/admin/channels');

    return { success: true as const };
  });

export const reviewChannelApplicationAction = authActionClient
  .inputSchema(
    z.object({
      channelId: z.number().int().positive(),
      decision: z.enum(['approved', 'rejected']),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await requireSuperAdmin();
    const admin = getSupabaseServerAdminClient();
    const approved = parsedInput.decision === 'approved';

    const { data: channel } = await admin
      .from('categories')
      .select('owner_id, handle, name')
      .eq('id', parsedInput.channelId)
      .eq('channel_type', 'user')
      .maybeSingle();

    const { error } = await admin
      .from('categories')
      .update({
        status: parsedInput.decision,
        is_active: approved,
        is_verified: approved,
        verified_at: approved ? new Date().toISOString() : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', parsedInput.channelId)
      .eq('channel_type', 'user');

    if (error) throw new Error(error.message);

    await notifyAccount({
      accountId: channel?.owner_id,
      body: approved
        ? `Your channel application for ${channel?.name ?? 'your channel'} was approved.`
        : `Your channel application for ${channel?.name ?? 'your channel'} was not approved.`,
      link: approved && channel?.handle ? `/channels/${channel.handle}` : '/channels',
    });

    revalidatePath('/channels');
    revalidatePath('/admin/channels');

    return { success: true as const };
  });

export async function listVolunteerApplications() {
  await requireSuperAdmin();
  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('volunteer_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export const submitVolunteerApplicationAction = authActionClient
  .inputSchema(
    z.object({
      answers: z.record(z.string(), z.unknown()).optional(),
      name: z.string().trim().min(2).max(80).optional(),
      message: z.string().trim().min(10).max(2000).optional(),
      captchaToken: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await maybeVerifyCaptcha(parsedInput.captchaToken);

    const registry = await loadFormRegistry('volunteer');
    const answers = (parsedInput.answers ?? {}) as Record<string, unknown>;

    if (parsedInput.answers) {
      const validation = validateAnswers(
        registry,
        answers as Record<string, FormAnswerValue | undefined>,
      );
      if (!validation.ok) {
        throw new Error(Object.values(validation.errors)[0] ?? 'Invalid form');
      }
    }

    const email =
      bindingValue(registry, answers, 'email') || user.email || '';
    const name =
      bindingValue(registry, answers, 'name') ||
      parsedInput.name?.trim() ||
      '';
    const message =
      answerString(answers, 'message') || parsedInput.message?.trim() || '';

    if (!email) {
      throw new Error('Your account needs an email address to apply.');
    }

    if (!parsedInput.answers && message.length < 10) {
      throw new Error('Please share a short note about why you want to help.');
    }

    const admin = getSupabaseServerAdminClient();
    const { data: existing } = await admin
      .from('volunteer_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      throw new Error('You already have a volunteer application under review.');
    }

    const { error } = await admin.from('volunteer_applications').insert({
      user_id: user.id,
      email,
      name: name || email,
      message: message || 'Submitted via dynamic form.',
      status: 'pending',
      payload: { source: 'in-app', answers } as Json,
    });

    if (error) throw new Error(error.message);

    revalidatePath('/volunteer');
    revalidatePath('/admin/volunteers');

    return { success: true as const };
  });

export const reviewVolunteerApplicationAction = authActionClient
  .inputSchema(
    z.object({
      applicationId: z.number().int().positive(),
      decision: z.enum(['approved', 'rejected']),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await requireSuperAdmin();
    const admin = getSupabaseServerAdminClient();

    const { data: application } = await admin
      .from('volunteer_applications')
      .select('user_id, email, name')
      .eq('id', parsedInput.applicationId)
      .maybeSingle();

    const { error } = await admin
      .from('volunteer_applications')
      .update({
        status: parsedInput.decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsedInput.applicationId);

    if (error) throw new Error(error.message);

    const approved = parsedInput.decision === 'approved';

    if (approved && application?.user_id) {
      const now = new Date().toISOString();
      const { error: rosterError } = await admin
        .from('community_volunteers')
        .upsert(
          {
            user_id: application.user_id,
            email: application.email ?? '',
            name: application.name ?? '',
            tier: 'helper',
            status: 'active',
            updated_at: now,
          },
          { onConflict: 'user_id' },
        );

      if (rosterError) throw new Error(rosterError.message);
    }

    await notifyAccount({
      accountId: application?.user_id,
      body: approved
        ? 'Your volunteer application was approved. Thank you for offering to help.'
        : 'Your volunteer application was not approved at this time.',
      link: '/volunteer',
    });

    revalidatePath('/admin/volunteers');

    return { success: true as const };
  });

export async function listCommunityVolunteers() {
  await requireSuperAdmin();
  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('community_volunteers')
    .select(
      'user_id, email, name, tier, status, notes, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  return data ?? [];
}

export const updateVolunteerTierAction = authActionClient
  .inputSchema(
    z.object({
      userId: z.string().uuid(),
      tier: z.enum(VOLUNTEER_TIERS),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    if (!isVolunteerTier(parsedInput.tier)) {
      throw new Error('Invalid tier');
    }

    const admin = getSupabaseServerAdminClient();
    const { error } = await admin
      .from('community_volunteers')
      .update({
        tier: parsedInput.tier,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', parsedInput.userId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/volunteers');

    return { success: true as const };
  });

export const setVolunteerStatusAction = authActionClient
  .inputSchema(
    z.object({
      userId: z.string().uuid(),
      status: z.enum(VOLUNTEER_STATUSES),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    if (!isVolunteerStatus(parsedInput.status)) {
      throw new Error('Invalid status');
    }

    const admin = getSupabaseServerAdminClient();
    const { error } = await admin
      .from('community_volunteers')
      .update({
        status: parsedInput.status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', parsedInput.userId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/volunteers');

    return { success: true as const };
  });

export async function getSiteCopyForAdmin() {
  await requireSuperAdmin();
  const client = getSupabaseServerClient();
  const copy = await createCommunityApi(client).getSiteCopy();

  return Object.entries(SITE_COPY_DEFAULTS).map(([key, defaultValue]) => ({
    key: key as SiteCopyKey,
    settingKey: SITE_COPY_SETTING_KEYS[key as SiteCopyKey],
    value: copy[key as SiteCopyKey],
    defaultValue,
  }));
}

export const updateSiteCopyAction = authActionClient
  .inputSchema(
    z.object({
      values: z.record(z.string(), z.string()),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    const admin = getSupabaseServerAdminClient();
    const rows = Object.entries(parsedInput.values)
      .filter(([key]) => key in SITE_COPY_SETTING_KEYS)
      .map(([key, value]) => ({
        key: SITE_COPY_SETTING_KEYS[key as SiteCopyKey],
        value: value.trim(),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length === 0) return { success: true as const };

    const { error } = await admin.from('site_settings').upsert(rows);

    if (error) throw new Error(error.message);

    revalidatePath('/');
    revalidatePath('/admin/copy');

    return { success: true as const };
  });

export async function getRssSettings(): Promise<RssSettings> {
  try {
    const admin = getSupabaseServerAdminClient();
    const { data, error } = await admin
      .from('site_settings')
      .select('key, value')
      .in('key', [...RSS_SETTING_KEY_LIST]);

    if (error) return { ...RSS_DEFAULTS };

    return parseRssSettings(data ?? []);
  } catch {
    return { ...RSS_DEFAULTS };
  }
}

export const updateRssSettingsAction = authActionClient
  .inputSchema(
    z.object({
      enabled: z.boolean(),
      itemCount: z.number().int().min(5).max(50),
      title: z.string().trim().max(120),
      description: z.string().trim().max(500),
      author: z.string().trim().max(160),
      copyright: z.string().trim().max(160),
      language: z.string().trim().min(2).max(16),
      ttlMinutes: z.number().int().min(1).max(1440),
      includeChannelPosts: z.boolean(),
      includeFreeformDuas: z.boolean(),
      onlyVerifiedChannels: z.boolean(),
      excludedChannelIds: z.array(z.number().int().positive()),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    const admin = getSupabaseServerAdminClient();
    const excluded = [...new Set(parsedInput.excludedChannelIds)].sort(
      (a, b) => a - b,
    );
    const now = new Date().toISOString();
    const { error } = await admin.from('site_settings').upsert([
      {
        key: RSS_SETTING_KEYS.enabled,
        value: parsedInput.enabled ? 'true' : 'false',
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.itemCount,
        value: String(parsedInput.itemCount),
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.title,
        value: parsedInput.title || RSS_DEFAULTS.title,
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.description,
        value: parsedInput.description || RSS_DEFAULTS.description,
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.author,
        value: parsedInput.author,
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.copyright,
        value: parsedInput.copyright,
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.language,
        value: parsedInput.language || RSS_DEFAULTS.language,
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.ttlMinutes,
        value: String(parsedInput.ttlMinutes),
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.includeChannelPosts,
        value: parsedInput.includeChannelPosts ? 'true' : 'false',
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.includeFreeformDuas,
        value: parsedInput.includeFreeformDuas ? 'true' : 'false',
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.onlyVerifiedChannels,
        value: parsedInput.onlyVerifiedChannels ? 'true' : 'false',
        updated_at: now,
      },
      {
        key: RSS_SETTING_KEYS.excludedChannelIds,
        value: JSON.stringify(excluded),
        updated_at: now,
      },
    ]);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/settings');
    revalidatePath('/feed.xml');
    revalidatePath('/feed-tags.xml');

    return { success: true as const };
  });

export const updateAiModerationSettingsAction = authActionClient
  .inputSchema(
    z.object({
      enabled: z.boolean(),
      apiKey: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    const admin = getSupabaseServerAdminClient();
    const rows = [
      {
        key: 'ai_moderation.enabled',
        value: parsedInput.enabled ? 'true' : 'false',
        updated_at: new Date().toISOString(),
      },
    ];

    if (parsedInput.apiKey !== undefined) {
      rows.push({
        key: 'ai_moderation.api_key',
        value: parsedInput.apiKey.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    if (parsedInput.model?.trim()) {
      rows.push({
        key: 'ai_moderation.model',
        value: parsedInput.model.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    if (parsedInput.baseUrl?.trim()) {
      rows.push({
        key: 'ai_moderation.base_url',
        value: parsedInput.baseUrl.trim(),
        updated_at: new Date().toISOString(),
      });
    }

    const { error } = await admin.from('site_settings').upsert(rows);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/settings');

    return { success: true as const };
  });

export async function getFooterLinks(): Promise<ReadonlyArray<FooterLink>> {
  const admin = getSupabaseServerAdminClient();
  const { data } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', FOOTER_LINKS_SETTING_KEY)
    .maybeSingle();

  return resolveFooterLinks(data?.value);
}

export const updateFooterLinksAction = authActionClient
  .inputSchema(
    z.object({
      links: z.array(
        z.object({
          label: z.string(),
          href: z.string(),
          openInNewTab: z.boolean(),
        }),
      ),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    const sanitized = parseFooterLinks(JSON.stringify(parsedInput.links));
    const admin = getSupabaseServerAdminClient();
    const { error } = await admin.from('site_settings').upsert({
      key: FOOTER_LINKS_SETTING_KEY,
      value: JSON.stringify(sanitized),
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);

    revalidatePath('/');
    revalidatePath('/admin/copy');

    return { success: true as const };
  });

export async function getFormRegistryForAdmin(kind: FormKind) {
  await requireSuperAdmin();
  return loadFormRegistry(kind);
}

export const updateFormRegistryAction = authActionClient
  .inputSchema(
    z.object({
      kind: z.enum(['channel', 'volunteer']),
      registry: z.object({
        version: z.literal(1),
        fields: z.array(z.unknown()),
      }),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    const fallback = await loadFormRegistry(parsedInput.kind);
    const registry = parseFormRegistry(
      JSON.stringify(parsedInput.registry),
      fallback,
    );

    await saveFormRegistry(parsedInput.kind, registry);

    revalidatePath('/admin/forms');
    revalidatePath('/channels/apply');
    revalidatePath('/volunteer');

    return { success: true as const };
  });

export async function listDuaBotsForAdmin() {
  await requireSuperAdmin();
  return listBots();
}

export const createDuaBotAction = authActionClient
  .inputSchema(
    z.object({
      name: z.string().trim().min(2).max(80),
      description: z.string().trim().max(500).optional(),
      frequencyMinutes: z.number().int().min(15).max(10080).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await requireSuperAdmin();
    const bot = await createBot({
      name: parsedInput.name,
      description: parsedInput.description,
      frequencyMinutes: parsedInput.frequencyMinutes,
      createdBy: user.id,
    });

    revalidatePath('/admin/bots');

    return { success: true as const, bot };
  });

export const setDuaBotStatusAction = authActionClient
  .inputSchema(
    z.object({
      botId: z.number().int().positive(),
      status: z.enum(['active', 'paused']),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await requireSuperAdmin();
    await setBotStatus(parsedInput.botId, parsedInput.status, user.id);
    revalidatePath('/admin/bots');

    return { success: true as const };
  });

export const runDuaBotsStubAction = authActionClient
  .inputSchema(
    z.object({
      botId: z.number().int().positive().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    await requireSuperAdmin();
    const result = await runDueBotsStub({ botId: parsedInput.botId });
    revalidatePath('/admin/bots');

    return { success: true as const, ...result };
  });
