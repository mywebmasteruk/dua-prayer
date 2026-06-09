import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { AdminSection } from "@/components/admin/admin-section"
import { cn } from "@/lib/utils"

type IntegrationChannelWebhookTabProps = {
  appUrl: string | null
  webhookConfigured: boolean
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 last:border-b-0 sm:grid-cols-[minmax(8rem,11rem)_1fr] sm:gap-x-6">
      <dt className="text-sm font-medium text-foreground">{label}</dt>
      <dd className="min-w-0">
        <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs">{value}</code>
        {ok !== undefined ? (
          <p
            className={cn(
              "mt-1 text-xs",
              ok ? "text-emerald-700" : "text-amber-800",
            )}
          >
            {ok ? "Configured" : "Not configured in environment"}
          </p>
        ) : null}
      </dd>
    </div>
  )
}

export function IntegrationChannelWebhookTab({
  appUrl,
  webhookConfigured,
}: IntegrationChannelWebhookTabProps) {
  const webhookUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/api/webhooks/channel` : null

  return (
    <div className="space-y-5">
      <AdminSection
        title="Webhook endpoint"
        description="Fillout POSTs channel registration applications here. Requires the shared secret header documented below."
        contentClassName="pt-0"
      >
        <dl>
          <StatusRow
            label="POST URL"
            value={webhookUrl ?? "Set NEXT_PUBLIC_APP_URL to display full URL"}
          />
          <StatusRow
            label="Health check"
            value={webhookUrl ? `${webhookUrl} (GET)` : "GET /api/webhooks/channel"}
          />
          <StatusRow
            label="Secret header"
            value="X-Webhook-Secret: <CHANNEL_WEBHOOK_SECRET>"
            ok={webhookConfigured}
          />
        </dl>
      </AdminSection>

      <AdminSection
        title="Setup"
        description="Point your channel registration Fillout form at this endpoint. Review pending rows in Admin → Channels."
      >
        <ul className="list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">
          <li>
            Set <code className="rounded bg-muted px-1 py-0.5 text-xs">CHANNEL_WEBHOOK_SECRET</code> in your
            deployment environment (never commit it).
          </li>
          <li>
            Send the same value in the <code className="rounded bg-muted px-1 py-0.5 text-xs">X-Webhook-Secret</code>{" "}
            header on each POST.
          </li>
          <li>
            Fillout&apos;s default webhook payload (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">submission.questions[]</code>) is supported. Include
            Email and Channel name questions at minimum.
          </li>
          <li>
            Approve or reject in{" "}
            <Link href="/admin/channels" className="font-medium text-primary underline-offset-2 hover:underline">
              Admin → Channels
            </Link>
            .
          </li>
        </ul>
        <p className="mt-4">
          <Link
            href="https://github.com/mywebmasteruk/dua-prayer/blob/main/docs/channel-webhook.md"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Full webhook documentation
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </p>
      </AdminSection>
    </div>
  )
}
