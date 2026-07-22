import Link from "next/link"
import { AdminSection } from "@/components/admin/admin-section"
import type { AuthEnvStatus } from "@/lib/integration-env-status"
import { cn } from "@/lib/utils"

type IntegrationAuthTabProps = {
  status: AuthEnvStatus
  appUrl: string | null
}

export function IntegrationAuthTab({ status, appUrl }: IntegrationAuthTabProps) {
  return (
    <div className="space-y-5">
      <AdminSection
        title="Authentication provider"
        description="User sign-in is handled by Supabase Auth. Provider settings (email, OAuth) are configured in Supabase."
        contentClassName="pt-0"
      >
        <dl>
          <div className="grid gap-1 border-b border-border/50 py-3 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
            <dt className="text-sm font-medium text-foreground">Provider</dt>
            <dd>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  status.supabaseAuth ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground",
                )}
              >
                {status.supabaseAuth ? "Supabase Auth" : "Not configured"}
              </span>
            </dd>
          </div>
          <div className="grid gap-1 border-b border-border/50 py-3 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
            <dt className="text-sm font-medium text-foreground">App URL</dt>
            <dd className="min-w-0">
              {appUrl ? (
                <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{appUrl}</code>
              ) : (
                <span className="text-sm text-muted-foreground">NEXT_PUBLIC_APP_URL not set</span>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Used for auth redirects, Stripe return URLs, and webhook base URLs.
              </p>
            </dd>
          </div>
        </dl>
      </AdminSection>

      <AdminSection title="Redirect URLs">
        <p className="text-sm leading-6 text-muted-foreground">{status.note}</p>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">
          <li>
            In Supabase → Authentication → URL configuration, add{" "}
            {appUrl ? (
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{appUrl}</code>
            ) : (
              "your production app URL"
            )}{" "}
            to Site URL and redirect allow list.
          </li>
          <li>Local development typically uses http://localhost:3000.</li>
        </ul>
        <p className="mt-4">
          <Link href="/admin/users" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
            Manage users in Admin → Users
          </Link>
        </p>
      </AdminSection>
    </div>
  )
}
