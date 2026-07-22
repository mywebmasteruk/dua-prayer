#!/usr/bin/env node
/**
 * Upsert Makerkit env aliases on the Vercel project.
 * Reads .vercel/.env.production.local (from `vercel pull`).
 * Never prints secret values.
 */
import { readFileSync } from 'node:fs';

const token = process.env.VERCEL_TOKEN;
const orgId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;
const webhookSecret = process.env.SUPABASE_DB_WEBHOOK_SECRET || '';

if (!token || !orgId || !projectId) {
  console.error('Missing VERCEL_TOKEN / VERCEL_ORG_ID / VERCEL_PROJECT_ID');
  process.exit(1);
}

function loadEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    let v = t.slice(i + 1);
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[t.slice(0, i)] = v;
  }
  return env;
}

async function listEnv() {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${orgId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = await res.json();
  return json.envs || [];
}

async function deleteEnv(id) {
  await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env/${id}?teamId=${orgId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

async function upsert(key, value) {
  if (!value) {
    console.log(`skip ${key}`);
    return;
  }

  const envs = await listEnv();
  for (const e of envs) {
    if (e.key === key && (e.target || []).includes('production')) {
      await deleteEnv(e.id);
    }
  }

  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${orgId}&upsert=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value,
        type: 'encrypted',
        target: ['production'],
      }),
    },
  );
  const json = await res.json();
  console.log('upserted', json.key || json.error || res.status);
}

const env = loadEnvFile('.vercel/.env.production.local');
const publicKey =
  env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

await upsert('NEXT_PUBLIC_SITE_URL', 'https://www.duaprayer.com');
await upsert('NEXT_PUBLIC_SUPABASE_PUBLIC_KEY', publicKey);
if (webhookSecret) {
  await upsert('SUPABASE_DB_WEBHOOK_SECRET', webhookSecret);
}

console.log('env sync complete');
