'use server';

import { randomBytes } from 'crypto';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import * as z from 'zod';

import { publicActionClient } from '@kit/next/safe-action';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { createCommunityApi } from './api';
import { checkRateLimit, getClientIp } from './rate-limit';

const CreateDuaSchema = z.object({
  text: z.string().trim().min(15).max(1200),
  categoryId: z.number().int().positive().nullable(),
  website: z.string().optional(), // honeypot
});

const PraySchema = z.object({
  duaId: z.number().int().positive(),
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

export async function getFeedDuas(options: { offset?: number } = {}) {
  const client = getSupabaseServerClient();
  const api = createCommunityApi(client);
  const offset = Math.max(0, Math.trunc(options.offset ?? 0));
  const { duas, total } = await api.getFeedBatch(offset);

  return {
    duas,
    total,
    pageSize: api.pageSize,
  };
}

export async function getCategories() {
  const client = getSupabaseServerClient();
  const api = createCommunityApi(client);

  return api.listCategories();
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

    const client = getSupabaseServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    const api = createCommunityApi(client);
    const categories = await api.listCategories();

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

    const admin = getSupabaseServerAdminClient();
    const { error } = await admin.from('duas').insert({
      text: parsedInput.text,
      category_id: validatedCategoryId,
      channel_id: null,
      published: true,
      flagged: false,
      user_id: user?.id ?? null,
      language: null,
    });

    if (error) {
      logger.error({ error, name: 'community.create-dua' }, 'Failed to create dua');
      throw new Error(error.message);
    }

    revalidatePath('/');

    return { success: true as const };
  });

export const prayForDuaAction = publicActionClient
  .inputSchema(PraySchema)
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

    revalidatePath('/');

    return {
      success: true as const,
      counted: Boolean(result.counted),
      likes: result.likes ?? 0,
    };
  });
