import * as z from 'zod';

/**
 * Resolves the public Supabase key, accepting Makerkit and legacy DuaPrayer names.
 */
function resolvePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

/**
 * Returns and validates the Supabase client keys from the environment.
 */
export function getSupabaseClientKeys() {
  return z
    .object({
      url: z.string({
        error: `Please provide the variable NEXT_PUBLIC_SUPABASE_URL`,
      }),
      publicKey: z.string({
        error: `Please provide NEXT_PUBLIC_SUPABASE_PUBLIC_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)`,
      }),
    })
    .parse({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publicKey: resolvePublicKey(),
    });
}
