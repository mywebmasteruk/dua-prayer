import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import type { SupabaseEnvStatus } from "@/lib/integration-env-status"
import { cn } from "@/lib/utils"

type IntegrationSupabaseTabProps = {
  status: SupabaseEnvStatus
}

function EnvStatusRow({
  label,
  configured,
  detail,
}: {
  label: string
  configured: boolean
  detail?: string
}) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
      <dt className="text-sm font-medium text-foreground">{label}</dt>
      <dd>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            configured ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground",
          )}
        >
          {configured ? "Configured" : "Missing"}
        </span>
        {detail ? <p className="mt-1 break-all text-xs text-muted-foreground">{detail}</p> : null}
      </dd>
    </div>
  )
}

export function IntegrationSupabaseTab({ status }: IntegrationSupabaseTabProps) {
  return (
    <div className="space-y-5">
      <AdminSection
        title="Project connection"
        description="Read-only status from environment variables. Secrets are never shown here."
        contentClassName="pt-0"
      >
        <dl>
          <div className="grid gap-1 border-b border-border/50 py-3 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
            <dt className="text-sm font-medium text-foreground">Project URL</dt>
            <dd className="min-w-0">
              {status.projectUrl ? (
                <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{status.projectUrl}</code>
              ) : (
                <span className="text-sm text-muted-foreground">NEXT_PUBLIC_SUPABASE_URL not set</span>
              )}
            </dd>
          </div>
          <EnvStatusRow label="Anon key" configured={status.anonKeyConfigured} detail="NEXT_PUBLIC_SUPABASE_ANON_KEY" />
          <EnvStatusRow
            label="Service role"
            configured={status.serviceRoleConfigured}
            detail="SUPABASE_SERVICE_ROLE_KEY (server only)"
          />
        </dl>
      </AdminSection>

      <AdminSection title="Manage in Supabase">
        <p className="text-sm leading-6 text-muted-foreground">
          Database schema, RLS policies, auth providers, and storage are managed in the Supabase dashboard. Local
          migrations live in <code className="rounded bg-muted px-1 py-0.5 text-xs">supabase/migrations/</code>.
        </p>
        {status.projectUrl ? (
          <p className="mt-3">
            <Link
              href={`${status.projectUrl.replace(/\/$/, "")}/project/default`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Supabase project
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </p>
        ) : null}
      </AdminSection>
    </div>
  )
}
