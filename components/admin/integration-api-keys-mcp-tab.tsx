"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { buildIntegrationEnvTemplate } from "@/lib/integration-env-status"
import type { IntegrationEnvStatus } from "@/lib/integration-env-status"
import type { StripeSettingsAdminView } from "@/lib/stripe-settings-server"
import { cn } from "@/lib/utils"

type IntegrationApiKeysMcpTabProps = {
  envStatus: IntegrationEnvStatus
  stripeSettings: StripeSettingsAdminView
}

type EnvVarRow = {
  name: string
  optional?: boolean
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-full" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </>
      )}
    </Button>
  )
}

function EnvVarList({ vars }: { vars: EnvVarRow[] }) {
  return (
    <ul className="space-y-1.5">
      {vars.map((item) => (
        <li key={item.name} className="flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{item.name}</code>
          {item.optional ? <span className="text-muted-foreground">(optional)</span> : null}
        </li>
      ))}
    </ul>
  )
}

function ApiKeyCard({
  title,
  purpose,
  configured,
  configuredLabel,
  envVars,
  configureHref,
  configureLabel,
  children,
}: {
  title: string
  purpose: string
  configured: boolean
  configuredLabel?: string
  envVars?: EnvVarRow[]
  configureHref?: string
  configureLabel?: string
  children?: ReactNode
}) {
  return (
    <AdminSection
      variant="plain"
      title={title}
      description={purpose}
      action={
        <AdminStatusBadge
          label={configuredLabel ?? (configured ? "Configured" : "Not configured")}
          tone={configured ? "success" : "warning"}
        />
      }
    >
      <div className="rounded-xl border border-border/60 bg-background px-5 py-4">
        {envVars?.length ? (
          <div className="mb-3">
            <p className="mb-2 text-xs font-medium text-foreground">Environment variables</p>
            <EnvVarList vars={envVars} />
          </div>
        ) : null}
        {children}
        {configureHref ? (
          <p className="mt-3">
            <Link
              href={configureHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {configureLabel ?? "Configure"}
            </Link>
          </p>
        ) : null}
      </div>
    </AdminSection>
  )
}

function McpServerCard({
  name,
  cursorServerId,
  purpose,
  prerequisites,
  configured,
  docsHref,
}: {
  name: string
  cursorServerId: string
  purpose: string
  prerequisites: string[]
  configured: boolean
  docsHref?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{purpose}</p>
        </div>
        <AdminStatusBadge
          label={configured ? "Prerequisites met" : "Missing prerequisites"}
          tone={configured ? "success" : "warning"}
        />
      </div>
      <dl className="mt-4 space-y-2 text-xs">
        <div>
          <dt className="font-medium text-foreground">Cursor MCP server</dt>
          <dd>
            <code className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 font-mono">{cursorServerId}</code>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Requires</dt>
          <dd className="mt-1 text-muted-foreground">
            <ul className="list-inside list-disc space-y-1">
              {prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      {docsHref ? (
        <p className="mt-3">
          <a
            href={docsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Plugin documentation
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </p>
      ) : null}
    </div>
  )
}

export function IntegrationApiKeysMcpTab({
  envStatus,
  stripeSettings,
}: IntegrationApiKeysMcpTabProps) {
  const activeStripe = stripeSettings.mode === "test" ? stripeSettings.test : stripeSettings.live
  const stripeSecretConfigured = stripeSettings.live.hasSecretKey || stripeSettings.test.hasSecretKey
  const stripePublishableConfigured =
    Boolean(stripeSettings.live.publishableKey.trim()) || Boolean(stripeSettings.test.publishableKey.trim())
  const supabaseReady =
    envStatus.supabase.projectUrl &&
    envStatus.supabase.anonKeyConfigured &&
    envStatus.supabase.serviceRoleConfigured

  return (
    <div className="space-y-8">
      <AdminSection
        title="Environment template"
        description="Copy a placeholder-only .env.local skeleton. Values are never read from or written to this page."
        action={<CopyButton value={buildIntegrationEnvTemplate()} label="Copy env template" />}
      />

      <div>
        <h2 className="mb-1 text-base font-semibold tracking-tight text-foreground">API keys</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Status dashboard for secrets and credentials. Keys are stored in environment variables or admin settings —
          never displayed here.
        </p>

        <div className="space-y-5">
          <ApiKeyCard
            title="Stripe"
            purpose="Donation checkout on /donate. Live and test credentials are managed in the Stripe tab or via env fallbacks."
            configured={stripeSecretConfigured}
            configuredLabel={
              stripeSecretConfigured
                ? `${stripeSettings.mode === "test" ? "Test" : "Live"} mode · secret key set`
                : "Secret key missing"
            }
            envVars={[
              { name: "STRIPE_SECRET_KEY" },
              { name: "STRIPE_TEST_SECRET_KEY", optional: true },
              { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", optional: true },
              { name: "NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY", optional: true },
              { name: "STRIPE_WEBHOOK_SECRET", optional: true },
            ]}
            configureHref="/admin/integration?tab=stripe"
            configureLabel="Integration → Stripe"
          >
            <dl className="space-y-2 border-t border-border/50 pt-3 text-xs">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">Active mode secret</dt>
                <dd className={cn("font-medium", activeStripe.hasSecretKey ? "text-emerald-700" : "text-amber-800")}>
                  {activeStripe.hasSecretKey
                    ? `Configured (…${activeStripe.secretKeyLast4 ?? "****"})`
                    : "Not configured"}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-muted-foreground">Publishable key</dt>
                <dd className={cn("font-medium", stripePublishableConfigured ? "text-emerald-700" : "text-muted-foreground")}>
                  {stripePublishableConfigured ? "Configured" : "Optional — not set"}
                </dd>
              </div>
            </dl>
          </ApiKeyCard>

          <ApiKeyCard
            title="Supabase"
            purpose="Database, auth, and server-side admin operations. Keys must stay in env — never paste service role keys into site settings."
            configured={Boolean(supabaseReady)}
            envVars={[
              { name: "NEXT_PUBLIC_SUPABASE_URL" },
              { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" },
              { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", optional: true },
              { name: "SUPABASE_SECRET_KEY" },
              { name: "SUPABASE_SERVICE_ROLE_KEY", optional: true },
            ]}
            configureHref="/admin/integration?tab=supabase"
            configureLabel="Integration → Supabase"
          >
            <p className="text-xs text-muted-foreground">
              Project URL:{" "}
              {envStatus.supabase.projectUrl ? (
                <code className="rounded bg-muted px-1 py-0.5">{envStatus.supabase.projectUrl}</code>
              ) : (
                "Not set"
              )}
            </p>
          </ApiKeyCard>

          {envStatus.turnstileConfigured ? (
            <ApiKeyCard
              title="Cloudflare Turnstile"
              purpose="Optional bot protection on public forms."
              configured={envStatus.turnstileConfigured}
              envVars={[
                { name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY" },
                { name: "TURNSTILE_SECRET_KEY" },
              ]}
            />
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-base font-semibold tracking-tight text-foreground">MCP (Model Context Protocol)</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Cursor MCP plugins help admins and developers manage Stripe and Supabase from the IDE. Enable plugins in
          Cursor Settings → MCP — this page documents useful servers and whether env prerequisites are met.
        </p>

        <AdminSection
          variant="plain"
          title="Cursor setup"
          description="Add or enable these MCP servers in your local Cursor workspace. Authentication is handled by each plugin (OAuth or API key in plugin settings — not stored in DuaPrayer)."
        >
          <ol className="list-inside list-decimal space-y-2 text-sm leading-6 text-muted-foreground">
            <li>Open Cursor → Settings → MCP (or edit .cursor/mcp.json).</li>
            <li>Enable the Supabase and Stripe plugins for this project.</li>
            <li>Complete each plugin&apos;s sign-in or API key prompt in Cursor — secrets stay in the IDE, not in the app.</li>
            <li>Restart the agent after enabling a new server.</li>
          </ol>
        </AdminSection>

        <div className="mt-5 space-y-4">
          <McpServerCard
            name="Supabase MCP"
            cursorServerId="plugin-supabase-supabase"
            purpose="Query tables, run migrations, inspect auth, and debug RLS from Cursor."
            prerequisites={[
              "NEXT_PUBLIC_SUPABASE_URL set in .env.local",
              "Service role key (SUPABASE_SECRET_KEY) for server-side operations",
              "Supabase plugin auth completed in Cursor",
            ]}
            configured={Boolean(supabaseReady)}
            docsHref="https://supabase.com/docs/guides/getting-started/ai-skills"
          />

          <McpServerCard
            name="Stripe MCP"
            cursorServerId="plugin-stripe-stripe"
            purpose="Inspect payments, customers, and webhooks; validate Stripe integration during development."
            prerequisites={[
              "Stripe secret key configured (admin Stripe tab or STRIPE_SECRET_KEY)",
              "Stripe plugin API key or OAuth in Cursor",
            ]}
            configured={stripeSecretConfigured}
            docsHref="https://docs.stripe.com"
          />
        </div>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          DuaPrayer does not host an MCP server. This tab is documentation and env status only. For webhook URLs and
          signing secrets, use{" "}
          <Link href="/admin/integration?tab=webhooks" className="font-medium text-primary underline-offset-2 hover:underline">
            Integration → Webhooks
          </Link>
          . Legacy URL{" "}
          <Link href="/admin/settings/stripe" className="font-medium text-primary underline-offset-2 hover:underline">
            /admin/settings/stripe
          </Link>{" "}
          redirects to Integration → Stripe.
        </p>
      </div>
    </div>
  )
}
