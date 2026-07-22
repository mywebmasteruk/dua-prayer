import { NextResponse } from 'next/server';

import { runDueDuaBots } from '@kit/community/server/dua-bots';

export const maxDuration = 60;

function cronSecret(): string | null {
  return (
    process.env.CRON_SECRET?.trim() ||
    process.env.BOT_RUNNER_SECRET?.trim() ||
    null
  );
}

function secretsMatch(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isAuthorized(request: Request): boolean {
  const secret = cronSecret();
  if (!secret) return false;

  const auth = request.headers.get('authorization');
  if (
    auth?.startsWith('Bearer ') &&
    secretsMatch(auth.slice('Bearer '.length), secret)
  ) {
    return true;
  }

  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  return Boolean(querySecret && secretsMatch(querySecret, secret));
}

async function run(request: Request) {
  if (!cronSecret()) {
    return NextResponse.json(
      {
        error:
          'CRON_SECRET is not configured. Admins can still trigger a run from /admin/bots.',
      },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runDueDuaBots();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
