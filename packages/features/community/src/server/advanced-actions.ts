'use server';

import { revalidatePath } from 'next/cache';

import * as z from 'zod';

import { authActionClient } from '@kit/next/safe-action';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import {
  channelHandleFromName,
  normalizeChannelHandle,
} from '../channel-handle';
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
import { createCommunityApi } from './api';
import { notifyAccount } from './notify';

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
      channelName: z.string().trim().min(2).max(80),
      handle: z.string().trim().min(2).max(32),
      description: z.string().trim().max(500).optional(),
      message: z.string().trim().max(1000).optional(),
      captchaToken: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (process.env.CAPTCHA_SECRET_TOKEN) {
      const { verifyCaptchaToken } = await import('@kit/auth/captcha/server');

      if (!parsedInput.captchaToken) {
        throw new Error('Bot verification failed. Please try again.');
      }

      await verifyCaptchaToken(parsedInput.captchaToken);
    }

    const pending = await getMyPendingChannelApplication();

    if (pending) {
      throw new Error('You already have a channel application under review.');
    }

    const handle =
      normalizeChannelHandle(parsedInput.handle) ||
      channelHandleFromName(parsedInput.channelName);

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
      name: parsedInput.channelName.trim(),
      description: parsedInput.description?.trim() || '',
      handle,
      channel_type: 'user',
      status: 'pending_review',
      is_active: false,
      is_verified: false,
      owner_id: user.id,
      application: {
        applicantEmail: user.email ?? '',
        message: parsedInput.message ?? '',
        source: 'in-app',
      },
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
      name: z.string().trim().min(2).max(80),
      message: z.string().trim().min(10).max(2000),
      captchaToken: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    if (process.env.CAPTCHA_SECRET_TOKEN) {
      const { verifyCaptchaToken } = await import('@kit/auth/captcha/server');

      if (!parsedInput.captchaToken) {
        throw new Error('Bot verification failed. Please try again.');
      }

      await verifyCaptchaToken(parsedInput.captchaToken);
    }

    if (!user.email) {
      throw new Error('Your account needs an email address to apply.');
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
      email: user.email,
      name: parsedInput.name,
      message: parsedInput.message,
      status: 'pending',
      payload: { source: 'in-app' },
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
      .select('user_id')
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
