'use server';

import { randomBytes } from 'crypto';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import * as z from 'zod';

import { authActionClient, publicActionClient } from '@kit/next/safe-action';
import { getLogger } from '@kit/shared/logger';
import type { Json } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { evaluateDuaModeration } from '../ai-moderation';
import { detectLanguage } from '../detect-language';
import {
  parseFeedLanguages,
  parseFeedTopics,
  readFeedLanguagesFromPublicData,
  readFeedTopicsFromPublicData,
  readOnboardedAtFromPublicData,
} from '../feed-languages';
import {
  shouldAllowPublicDuaSubmission,
  shouldHoldSubmissionForReview,
} from '../posting-settings';
import type { Category, ChannelItem } from '../types';
import { createCommunityApi } from './api';
import { crossedAmeenMilestone, notifyAccount } from './notify';
import { checkRateLimit, getClientIp } from './rate-limit';

const CreateDuaSchema = z.object({
  text: z.string().trim().min(15).max(1200),
  categoryId: z.number().int().positive().nullable(),
  channelId: z.number().int().positive().nullable().optional(),
  website: z.string().optional(),
  captchaToken: z.string().optional(),
});

const IdSchema = z.object({
  id: z.number().int().positive(),
});

const AdminDuaStatusSchema = z.object({
  duaId: z.number().int().positive(),
  published: z.boolean(),
});

async function getVoterHash() {
  const cookieStore = await cookies();
  const existing = cookieStore.get('dua_voter')?.value;

  if (existing && existing.length >= 16) {
    return existing;
  }

  const hash = randomBytes(24).toString('hex');

  cookieStore.set('dua_voter', hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return hash;
}

async function isSuperAdminUser() {
  const client = getSupabaseServerClient();
  const { data, error } = await client.rpc('is_super_admin');

  if (error) return false;

  return Boolean(data);
}

export async function getFeedDuas(
  options: {
    offset?: number;
    channelId?: number;
    followingOnly?: boolean;
  } = {},
) {
  const client = getSupabaseServerClient();
  const api = createCommunityApi(client);
  const offset = Math.max(0, Math.trunc(options.offset ?? 0));
  const {
    data: { user },
  } = await client.auth.getUser();

  let followedChannelIds: number[] | undefined;
  let languages: string[] | undefined;
  let topicIds: number[] | undefined;

  if (user) {
    const [feedLanguages, feedTopics] = await Promise.all([
      api.getFeedLanguages(user.id),
      api.getFeedTopics(user.id),
    ]);
    languages = feedLanguages;
    topicIds = feedTopics;
  }

  if (options.followingOnly) {
    if (!user) {
      return { duas: [], total: 0, pageSize: api.pageSize };
    }

    followedChannelIds = await api.listFollowIds(user.id);

    if (followedChannelIds.length === 0) {
      return { duas: [], total: 0, pageSize: api.pageSize };
    }
  }

  const { duas, total } = await api.getFeedBatch(offset, {
    channelId: options.channelId,
    followedChannelIds,
    languages:
      languages && languages.length > 0 ? languages : undefined,
    topicIds: topicIds && topicIds.length > 0 ? topicIds : undefined,
  });

  return { duas, total, pageSize: api.pageSize };
}

async function updatePersonalPublicData(
  userId: string,
  patch: Record<string, string | string[] | number[] | null>,
) {
  const client = getSupabaseServerClient();
  const { data: account, error: loadError } = await client
    .from('accounts')
    .select('public_data')
    .eq('id', userId)
    .eq('is_personal_account', true)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);

  const current =
    account?.public_data &&
    typeof account.public_data === 'object' &&
    !Array.isArray(account.public_data)
      ? { ...(account.public_data as Record<string, unknown>) }
      : {};

  const { error } = await client
    .from('accounts')
    .update({
      public_data: {
        ...current,
        ...patch,
      } as Json,
    })
    .eq('id', userId)
    .eq('is_personal_account', true);

  if (error) throw new Error(error.message);
}

export async function getMyFeedLanguages() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return [];

  return createCommunityApi(client).getFeedLanguages(user.id);
}

export async function getMyFeedTopics() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return [];

  return createCommunityApi(client).getFeedTopics(user.id);
}

export async function getMyOnboardingState() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return {
      needsOnboarding: false,
      topics: [] as Category[],
      channels: [] as ChannelItem[],
      followedIds: [] as number[],
    };
  }

  const api = createCommunityApi(client);
  const [onboardedAt, topics, channels, followedIds] = await Promise.all([
    api.getOnboardedAt(user.id),
    api.listCategories(),
    api.listChannels(),
    api.listFollowIds(user.id),
  ]);

  return {
    needsOnboarding: !onboardedAt,
    topics,
    channels: channels.slice(0, 12),
    followedIds,
  };
}

export const completeOnboardingAction = authActionClient
  .inputSchema(
    z.object({
      languages: z.array(z.string()).optional(),
      topics: z.array(z.number().int().positive()).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const api = createCommunityApi(client);
    const patch: Record<string, string | string[] | number[]> = {
      onboarded_at: new Date().toISOString(),
    };

    if (parsedInput.languages !== undefined) {
      patch.feed_languages = parseFeedLanguages(parsedInput.languages);
    }

    if (parsedInput.topics !== undefined) {
      const categories = await api.listCategories();
      const allowed = new Set(categories.map((category) => category.id));
      patch.feed_topics = parseFeedTopics(parsedInput.topics).filter((id) =>
        allowed.has(id),
      );
    }

    await updatePersonalPublicData(user.id, patch);

    revalidatePath('/');
    revalidatePath('/channels');
    revalidatePath('/home/settings');

    return {
      success: true as const,
      onboardedAt: readOnboardedAtFromPublicData({
        onboarded_at: patch.onboarded_at,
      }),
    };
  });

export const updateMyFeedLanguagesAction = authActionClient
  .inputSchema(
    z.object({
      languages: z.array(z.string()),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const languages = parseFeedLanguages(parsedInput.languages);

    await updatePersonalPublicData(user.id, {
      feed_languages: languages,
    });

    revalidatePath('/');
    revalidatePath('/channels');
    revalidatePath('/home/settings');

    return {
      success: true as const,
      languages: readFeedLanguagesFromPublicData({
        feed_languages: languages,
      }),
    };
  });

export const updateMyFeedTopicsAction = authActionClient
  .inputSchema(
    z.object({
      topics: z.array(z.number().int().positive()),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const client = getSupabaseServerClient();
    const api = createCommunityApi(client);
    const categories = await api.listCategories();
    const allowed = new Set(categories.map((category) => category.id));
    const topics = parseFeedTopics(parsedInput.topics).filter((id) =>
      allowed.has(id),
    );

    await updatePersonalPublicData(user.id, {
      feed_topics: topics,
    });

    revalidatePath('/');
    revalidatePath('/channels');
    revalidatePath('/home/settings');

    return {
      success: true as const,
      topics: readFeedTopicsFromPublicData({
        feed_topics: topics,
      }),
    };
  });

export async function getCategories() {
  const client = getSupabaseServerClient();
  return createCommunityApi(client).listCategories();
}

export async function getChannels() {
  const client = getSupabaseServerClient();
  return createCommunityApi(client).listChannels();
}

export async function getChannelByHandle(handle: string) {
  const client = getSupabaseServerClient();
  return createCommunityApi(client).getChannelByHandle(handle);
}

export async function getPostingMode() {
  const client = getSupabaseServerClient();
  return createCommunityApi(client).getPostingMode();
}

export async function getSiteCopy() {
  const client = getSupabaseServerClient();
  return createCommunityApi(client).getSiteCopy();
}

export async function listMyFollowIds() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) return [] as number[];

  return createCommunityApi(client).listFollowIds(user.id);
}

export async function listMyBookmarks() {
  const client = getSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' as const };
  }

  const admin = getSupabaseServerAdminClient();
  const { data: rows, error } = await admin
    .from('bookmarks')
    .select('dua_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };

  const duaIds = (rows ?? []).map((row) => row.dua_id);

  if (duaIds.length === 0) return { duas: [] };

  const { data: duaRows, error: duaError } = await admin
    .from('duas')
    .select(
      'id, text, user_id, category_id, channel_id, likes, published, flagged, language, created_at',
    )
    .in('id', duaIds)
    .eq('published', true);

  if (duaError) return { error: duaError.message };

  const api = createCommunityApi(client);
  const enriched = await api.enrichDuas(duaRows ?? []);
  const order = new Map(duaIds.map((id, index) => [id, index]));

  enriched.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return { duas: enriched };
}

export async function getAdminDuas() {
  if (!(await isSuperAdminUser())) {
    return { error: 'Unauthorized' as const, duas: [] };
  }

  const admin = getSupabaseServerAdminClient();
  const { data, error } = await admin
    .from('duas')
    .select(
      'id, text, user_id, category_id, channel_id, likes, created_at, published, flagged, language',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return { error: error.message, duas: [] };

  const client = getSupabaseServerClient();
  const api = createCommunityApi(client);

  return { duas: await api.enrichDuas(data ?? []) };
}

export const createDuaAction = publicActionClient
  .inputSchema(CreateDuaSchema)
  .action(async ({ parsedInput }) => {
    const logger = await getLogger();
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const rate = checkRateLimit(`create:${ip}`, 5);

    if (!rate.allowed) {
      throw new Error('Too many submissions. Please wait a moment.');
    }

    if (parsedInput.website) {
      throw new Error('Submission rejected');
    }

    if (process.env.CAPTCHA_SECRET_TOKEN) {
      const { verifyCaptchaToken } = await import('@kit/auth/captcha/server');

      if (!parsedInput.captchaToken) {
        throw new Error('Bot verification failed. Please try again.');
      }

      await verifyCaptchaToken(parsedInput.captchaToken);
    }

    const client = getSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    const api = createCommunityApi(client);
    const [categories, channels, postingMode, isAdmin] = await Promise.all([
      api.listCategories(),
      api.listChannels(),
      api.getPostingMode(),
      isSuperAdminUser(),
    ]);

    const access = shouldAllowPublicDuaSubmission({
      mode: postingMode,
      isAuthenticated: Boolean(user),
      isAdmin,
    });

    if (!access.allowed) {
      throw new Error(access.error);
    }

    let validatedCategoryId: number | null = null;

    if (parsedInput.categoryId != null) {
      const target = categories.find(
        (category) => category.id === parsedInput.categoryId,
      );

      if (!target || target.channel_type !== 'category') {
        throw new Error('Choose a valid topic');
      }

      validatedCategoryId = target.id;
    }

    let validatedChannelId: number | null = null;

    if (parsedInput.channelId != null) {
      const channel = channels.find(
        (item) => item.id === parsedInput.channelId,
      );

      if (!channel) {
        throw new Error('Choose a valid channel');
      }

      const full = await api.getChannelByHandle(channel.handle);

      if (!full || !user || full.owner_id !== user.id) {
        throw new Error('Only the channel owner can post in this channel.');
      }

      validatedChannelId = channel.id;
    }

    const holdForReview = shouldHoldSubmissionForReview({
      mode: postingMode,
      isAuthenticated: Boolean(user),
      isAdmin,
    });

    const moderation = await evaluateDuaModeration({
      text: parsedInput.text,
      settings: await api.getAiModerationSettings(),
    });

    if (moderation.severity === 'block') {
      throw new Error(
        'This dua could not be submitted because it appears to violate our community guidelines.',
      );
    }

    const requiresReview =
      holdForReview ||
      moderation.flagged ||
      moderation.severity === 'review';

    const admin = getSupabaseServerAdminClient();
    const { error } = await admin.from('duas').insert({
      text: parsedInput.text,
      category_id: validatedCategoryId,
      channel_id: validatedChannelId,
      published: !requiresReview,
      flagged: requiresReview,
      user_id: user?.id ?? null,
      language: detectLanguage(parsedInput.text),
    });

    if (error) {
      logger.error({ error, name: 'community.create-dua' }, 'Failed to create dua');
      throw new Error(error.message);
    }

    revalidatePath('/');
    revalidatePath('/channels');
    revalidatePath('/admin/duas');

    return {
      success: true as const,
      heldForReview: requiresReview,
    };
  });

export const prayForDuaAction = publicActionClient
  .inputSchema(z.object({ duaId: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const rate = checkRateLimit(`pray:${ip}`, 30);

    if (!rate.allowed) {
      throw new Error('Too many requests. Please slow down.');
    }

    const client = getSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    const voterHash = user ? null : await getVoterHash();

    const { data, error } = await client.rpc('pray_for_dua', {
      p_dua_id: parsedInput.duaId,
      p_voter_hash: voterHash,
    });

    if (error) {
      throw new Error('Could not record your ameen');
    }

    const result = data as {
      success?: boolean;
      counted?: boolean;
      likes?: number;
      error?: string;
    };

    if (!result.success) {
      throw new Error(
        result.error === 'not_found'
          ? 'Dua not found'
          : 'Could not make ameen for this dua',
      );
    }

    const likes = result.likes ?? 0;

    if (result.counted) {
      const milestone = crossedAmeenMilestone(likes);

      if (milestone) {
        const admin = getSupabaseServerAdminClient();
        const { data: dua } = await admin
          .from('duas')
          .select('user_id')
          .eq('id', parsedInput.duaId)
          .maybeSingle();

        await notifyAccount({
          accountId: dua?.user_id,
          body: `Your dua reached ${milestone} ameens.`,
          link: `/#dua-${parsedInput.duaId}`,
        });
      }
    }

    revalidatePath('/');

    return {
      success: true as const,
      counted: Boolean(result.counted),
      likes,
    };
  });

export const toggleBookmarkAction = authActionClient
  .inputSchema(IdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const admin = getSupabaseServerAdminClient();
    const { data: existing, error: loadError } = await admin
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('dua_id', parsedInput.id)
      .maybeSingle();

    if (loadError) throw new Error(loadError.message);

    if (existing) {
      const { error } = await admin
        .from('bookmarks')
        .delete()
        .eq('id', existing.id);

      if (error) throw new Error(error.message);

      revalidatePath('/bookmarks');

      return { bookmarked: false as const };
    }

    const { error } = await admin.from('bookmarks').insert({
      user_id: user.id,
      dua_id: parsedInput.id,
    });

    if (error && error.code !== '23505') {
      throw new Error(error.message);
    }

    revalidatePath('/bookmarks');

    return { bookmarked: true as const };
  });

export const flagDuaAction = authActionClient
  .inputSchema(IdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const rate = checkRateLimit(`flag:${user.id}`, 30);

    if (!rate.allowed) {
      throw new Error('Too many flags. Please wait.');
    }

    const admin = getSupabaseServerAdminClient();
    const { data: dua } = await admin
      .from('duas')
      .select('id')
      .eq('id', parsedInput.id)
      .eq('published', true)
      .maybeSingle();

    if (!dua) throw new Error('Dua not found');

    const { error } = await admin.from('dua_flags').upsert(
      { dua_id: parsedInput.id, user_id: user.id },
      { onConflict: 'dua_id,user_id' },
    );

    if (error) throw new Error(error.message);

    await admin.from('duas').update({ flagged: true }).eq('id', parsedInput.id);
    revalidatePath('/admin/duas');

    return { success: true as const };
  });

export const unflagMyFlagAction = authActionClient
  .inputSchema(IdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const admin = getSupabaseServerAdminClient();
    const { error } = await admin
      .from('dua_flags')
      .delete()
      .eq('dua_id', parsedInput.id)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);

    const { count } = await admin
      .from('dua_flags')
      .select('id', { count: 'exact', head: true })
      .eq('dua_id', parsedInput.id);

    if ((count ?? 0) === 0) {
      await admin
        .from('duas')
        .update({ flagged: false })
        .eq('id', parsedInput.id);
    }

    return { success: true as const };
  });

export const followChannelAction = authActionClient
  .inputSchema(IdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const admin = getSupabaseServerAdminClient();
    const { error } = await admin.from('user_follows').upsert(
      { user_id: user.id, channel_id: parsedInput.id },
      { onConflict: 'user_id,channel_id' },
    );

    if (error) throw new Error(error.message);

    revalidatePath('/channels');

    return { success: true as const };
  });

export const unfollowChannelAction = authActionClient
  .inputSchema(IdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const admin = getSupabaseServerAdminClient();
    const { error } = await admin
      .from('user_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('channel_id', parsedInput.id);

    if (error) throw new Error(error.message);

    revalidatePath('/channels');

    return { success: true as const };
  });

export const updateDuaStatusAction = authActionClient
  .inputSchema(AdminDuaStatusSchema)
  .action(async ({ parsedInput }) => {
    if (!(await isSuperAdminUser())) {
      throw new Error('Unauthorized');
    }

    const admin = getSupabaseServerAdminClient();
    const { data: existing } = await admin
      .from('duas')
      .select('user_id')
      .eq('id', parsedInput.duaId)
      .maybeSingle();

    const { error } = await admin
      .from('duas')
      .update({
        published: parsedInput.published,
        flagged: parsedInput.published ? false : undefined,
      })
      .eq('id', parsedInput.duaId);

    if (error) throw new Error(error.message);

    await notifyAccount({
      accountId: existing?.user_id,
      body: parsedInput.published
        ? 'Your dua is now visible in the community feed.'
        : 'Your dua was unpublished and is waiting for review.',
      link: parsedInput.published ? `/#dua-${parsedInput.duaId}` : '/',
    });

    revalidatePath('/');
    revalidatePath('/admin/duas');

    return { success: true as const };
  });

export const deleteDuaAction = authActionClient
  .inputSchema(z.object({ duaId: z.number().int().positive() }))
  .action(async ({ parsedInput }) => {
    if (!(await isSuperAdminUser())) {
      throw new Error('Unauthorized');
    }

    const admin = getSupabaseServerAdminClient();
    const { error } = await admin
      .from('duas')
      .delete()
      .eq('id', parsedInput.duaId);

    if (error) throw new Error(error.message);

    revalidatePath('/');
    revalidatePath('/admin/duas');

    return { success: true as const };
  });

export const updatePostingModeAction = authActionClient
  .inputSchema(
    z.object({
      mode: z.enum([
        'public',
        'registered_only',
        'visitor_moderated',
        'closed',
      ]),
    }),
  )
  .action(async ({ parsedInput }) => {
    if (!(await isSuperAdminUser())) {
      throw new Error('Unauthorized');
    }

    const admin = getSupabaseServerAdminClient();
    const { error } = await admin.from('site_settings').upsert({
      key: 'posting.mode',
      value: parsedInput.mode,
      updated_at: new Date().toISOString(),
    });

    if (error) throw new Error(error.message);

    revalidatePath('/');
    revalidatePath('/admin/duas');

    return { success: true as const };
  });
