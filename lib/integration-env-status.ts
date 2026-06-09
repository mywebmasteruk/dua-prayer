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
  supabase: SupabaseEnvStatus
  auth: AuthEnvStatus
}

export function getIntegrationEnvStatus(): IntegrationEnvStatus {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || null
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null

  return {
    appUrl,
    volunteerWebhookConfigured: Boolean(process.env.VOLUNTEER_WEBHOOK_SECRET?.trim()),
    supabase: {
      projectUrl,
      anonKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    },
    auth: {
      appUrl,
      supabaseAuth: Boolean(projectUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
      note: "Sign-in uses Supabase Auth (email magic link / OAuth configured in your Supabase project). Redirect URLs must include your app URL.",
    },
  }
}
