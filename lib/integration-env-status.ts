export type SupabaseEnvStatus = {
  projectUrl: string | null
  anonKeyConfigured: boolean
  serviceRoleConfigured: boolean
}

export type AuthEnvStatus = {
  appUrl: string | null
  supabaseAuth: boolean
  note: string
}

export type IntegrationEnvStatus = {
  appUrl: string | null
  volunteerWebhookConfigured: boolean
  channelWebhookConfigured: boolean
  turnstileConfigured: boolean
  supabase: SupabaseEnvStatus
  auth: AuthEnvStatus
}

export function emptyIntegrationEnvStatus(): IntegrationEnvStatus {
  return {
    appUrl: null,
    volunteerWebhookConfigured: false,
    channelWebhookConfigured: false,
    turnstileConfigured: false,
    supabase: {
      projectUrl: null,
      anonKeyConfigured: false,
      serviceRoleConfigured: false,
    },
    auth: {
      appUrl: null,
      supabaseAuth: false,
      note: "Sign-in uses Supabase Auth (email magic link / OAuth configured in your Supabase project). Redirect URLs must include your app URL.",
    },
  }
}

export function getIntegrationEnvStatus(): IntegrationEnvStatus {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || null
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null

  return {
    appUrl,
    volunteerWebhookConfigured: Boolean(process.env.VOLUNTEER_WEBHOOK_SECRET?.trim()),
    channelWebhookConfigured: Boolean(process.env.CHANNEL_WEBHOOK_SECRET?.trim()),
    turnstileConfigured: Boolean(
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() && process.env.TURNSTILE_SECRET_KEY?.trim(),
    ),
    supabase: {
      projectUrl,
      anonKeyConfigured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
      ),
      serviceRoleConfigured: Boolean(
        process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
      ),
    },
    auth: {
      appUrl,
      supabaseAuth: Boolean(
        projectUrl &&
          (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()),
      ),
      note: "Sign-in uses Supabase Auth (email magic link / OAuth configured in your Supabase project). Redirect URLs must include your app URL.",
    },
  }
}

/** Placeholder-only .env.local skeleton for admin copy — never includes real secrets. */
export function buildIntegrationEnvTemplate(): string {
  return `# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SECRET_KEY=sb_secret_your_key_here

# App URL (auth redirects, webhook URLs in admin)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Inbound webhooks (header: X-Webhook-Secret)
VOLUNTEER_WEBHOOK_SECRET=generate_a_long_random_secret_here
CHANNEL_WEBHOOK_SECRET=generate_a_long_random_secret_here

# Stripe donations
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Super admin
SUPER_ADMIN_EMAIL=your-admin@example.com
`
}
