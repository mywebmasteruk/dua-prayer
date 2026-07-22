import 'server-only';

import { cookies } from 'next/headers';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@kit/supabase/database';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import type { Category, Dua } from '../types';

type Client = SupabaseClient<Database>;

const FEED_BATCH_SIZE = 100;
const PAGE_SIZE = 10;

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

    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeCategory);
  }

  async getFeedBatch(offset = 0): Promise<{ duas: Dua[]; total: number }> {
    const from = Math.max(0, Math.trunc(offset));
    const { data, error, count } = await this.client
      .from('duas')
      .select(
        'id, text, user_id, category_id, channel_id, likes, created_at, published, flagged, language',
        { count: 'exact' },
      )
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, from + FEED_BATCH_SIZE - 1);

    if (error) {
      throw error;
    }

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
    if (rows.length === 0) {
      return [];
    }

    const categories = await this.listCategories();
    const categoryMap = new Map(categories.map((category) => [category.id, category]));
    const duaIds = rows.map((row) => row.id);

    const {
      data: { user },
    } = await this.client.auth.getUser();

    let prayedIds = new Set<number>();

    if (user) {
      const { data: prayers } = await this.client
        .from('dua_prayers')
        .select('dua_id')
        .eq('user_id', user.id)
        .in('dua_id', duaIds);

      prayedIds = new Set((prayers ?? []).map((prayer) => prayer.dua_id));
    } else {
      const cookieStore = await cookies();
      const voterHash = cookieStore.get('dua_voter')?.value;

      if (voterHash) {
        // Anonymous voters have no SELECT RLS on dua_prayers; use service role.
        const admin = getSupabaseServerAdminClient();
        const { data: prayers } = await admin
          .from('dua_prayers')
          .select('dua_id')
          .eq('voter_hash', voterHash)
          .in('dua_id', duaIds);

        prayedIds = new Set((prayers ?? []).map((prayer) => prayer.dua_id));
      }
    }

    return rows.map((row) => {
      const category = row.category_id
        ? categoryMap.get(row.category_id)
        : undefined;

      return {
        ...row,
        category_name: category?.name,
        user_has_prayed: prayedIds.has(row.id),
      };
    });
  }

  get pageSize() {
    return PAGE_SIZE;
  }
}
