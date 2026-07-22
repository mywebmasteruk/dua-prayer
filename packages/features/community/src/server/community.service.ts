import 'server-only';

import { cookies } from 'next/headers';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { normalizePostingMode, type PostingMode } from '../posting-settings';
import type { Category, ChannelItem, Dua } from '../types';

type Client = SupabaseClient<Database>;

const FEED_BATCH_SIZE = 100;

const CATEGORY_SELECT =
  'id, name, description, is_active, sort_order, channel_type, status, owner_id, handle, is_verified';

function normalizeCategory(row: {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  channel_type: string;
  status: string;
  owner_id: string | null;
  handle: string | null;
  is_verified: boolean;
}): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    is_active: row.is_active,
    sort_order: row.sort_order,
    channel_type: row.channel_type === 'user' ? 'user' : 'category',
    status:
      row.status === 'pending_review' || row.status === 'rejected'
        ? row.status
        : 'approved',
    owner_id: row.owner_id,
    handle: row.handle,
    is_verified: row.is_verified,
  };
}

export function createCommunityService(client: Client) {
  return new CommunityService(client);
}

class CommunityService {
  constructor(private readonly client: Client) {}

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.client
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('is_active', true)
      .eq('status', 'approved')
      .eq('channel_type', 'category')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(normalizeCategory);
  }

  async listChannels(): Promise<ChannelItem[]> {
    const admin = getSupabaseServerAdminClient();
    const { data, error } = await admin
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('is_active', true)
      .eq('status', 'approved')
      .eq('channel_type', 'user')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    const channels = (data ?? []).map(normalizeCategory);
    const ids = channels.map((channel) => channel.id);

    const counts = new Map<number, { duas: number; likes: number }>();

    if (ids.length > 0) {
      const { data: duas } = await admin
        .from('duas')
        .select('channel_id, likes')
        .eq('published', true)
        .in('channel_id', ids);

      for (const row of duas ?? []) {
        if (row.channel_id == null) continue;
        const current = counts.get(row.channel_id) ?? { duas: 0, likes: 0 };
        current.duas += 1;
        current.likes += row.likes ?? 0;
        counts.set(row.channel_id, current);
      }
    }

    return channels
      .filter((channel) => Boolean(channel.handle))
      .map((channel) => {
        const stats = counts.get(channel.id) ?? { duas: 0, likes: 0 };

        return {
          id: channel.id,
          name: channel.name,
          handle: channel.handle as string,
          description: channel.description,
          channelType: channel.channel_type,
          isVerified: channel.is_verified,
          duaCount: stats.duas,
          ameenCount: stats.likes,
          sortOrder: channel.sort_order,
        };
      });
  }

  async getChannelByHandle(handle: string): Promise<Category | null> {
    const normalized = handle.trim().toLowerCase().replace(/^@/, '');

    const { data, error } = await this.client
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('handle', normalized)
      .eq('channel_type', 'user')
      .eq('status', 'approved')
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return normalizeCategory(data);
  }

  async getFeedBatch(
    offset = 0,
    options: { channelId?: number; followedChannelIds?: number[] } = {},
  ): Promise<{ duas: Dua[]; total: number }> {
    const from = Math.max(0, Math.trunc(offset));
    let query = this.client
      .from('duas')
      .select(
        'id, text, user_id, category_id, channel_id, likes, created_at, published, flagged, language',
        { count: 'exact' },
      )
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (options.channelId != null) {
      query = query.eq('channel_id', options.channelId);
    }

    if (options.followedChannelIds && options.followedChannelIds.length > 0) {
      query = query.in('channel_id', options.followedChannelIds);
    }

    const { data, error, count } = await query.range(
      from,
      from + FEED_BATCH_SIZE - 1,
    );

    if (error) throw error;

    return {
      duas: await this.enrichDuas(data ?? []),
      total: count ?? 0,
    };
  }

  async enrichDuas(
    rows: Array<{
      id: number;
      text: string;
      user_id: string | null;
      category_id: number | null;
      channel_id: number | null;
      likes: number;
      created_at: string;
      published: boolean;
      flagged: boolean;
      language: string | null;
    }>,
  ): Promise<Dua[]> {
    if (rows.length === 0) return [];

    const admin = getSupabaseServerAdminClient();
    const { data: categories } = await admin
      .from('categories')
      .select(CATEGORY_SELECT);

    const categoryMap = new Map(
      (categories ?? []).map((row) => [row.id, normalizeCategory(row)]),
    );
    const duaIds = rows.map((row) => row.id);

    const {
      data: { user },
    } = await this.client.auth.getUser();

    let prayedIds = new Set<number>();
    let flaggedByMe = new Set<number>();
    let bookmarkedByMe = new Set<number>();

    if (user) {
      const [{ data: prayers }, { data: flags }, { data: bookmarks }] =
        await Promise.all([
          this.client
            .from('dua_prayers')
            .select('dua_id')
            .eq('user_id', user.id)
            .in('dua_id', duaIds),
          admin
            .from('dua_flags')
            .select('dua_id')
            .eq('user_id', user.id)
            .in('dua_id', duaIds),
          admin
            .from('bookmarks')
            .select('dua_id')
            .eq('user_id', user.id)
            .in('dua_id', duaIds),
        ]);

      prayedIds = new Set((prayers ?? []).map((row) => row.dua_id));
      flaggedByMe = new Set((flags ?? []).map((row) => row.dua_id));
      bookmarkedByMe = new Set((bookmarks ?? []).map((row) => row.dua_id));
    } else {
      const cookieStore = await cookies();
      const voterHash = cookieStore.get('dua_voter')?.value;

      if (voterHash) {
        const { data: prayers } = await admin
          .from('dua_prayers')
          .select('dua_id')
          .eq('voter_hash', voterHash)
          .in('dua_id', duaIds);

        prayedIds = new Set((prayers ?? []).map((row) => row.dua_id));
      }
    }

    return rows.map((row) => {
      const category = row.category_id
        ? categoryMap.get(row.category_id)
        : undefined;
      const channel = row.channel_id
        ? categoryMap.get(row.channel_id)
        : undefined;

      return {
        ...row,
        category_name: category?.name,
        channel_name: channel?.name,
        channel_handle: channel?.handle ?? undefined,
        channel_is_verified: channel?.is_verified,
        user_has_prayed: prayedIds.has(row.id),
        user_has_flagged: flaggedByMe.has(row.id),
        user_has_bookmarked: bookmarkedByMe.has(row.id),
      };
    });
  }

  async getPostingMode(): Promise<PostingMode> {
    const { data } = await this.client
      .from('site_settings')
      .select('value')
      .eq('key', 'posting.mode')
      .maybeSingle();

    return normalizePostingMode(data?.value);
  }

  async listFollowIds(userId: string): Promise<number[]> {
    const { data, error } = await this.client
      .from('user_follows')
      .select('channel_id')
      .eq('user_id', userId);

    if (error) throw error;

    return (data ?? []).map((row) => row.channel_id);
  }

  get pageSize() {
    return 10;
  }
}
