import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  LayoutGrid,
  MessageCircle,
  Server,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { DonateForm } from "@/components/donate-form"
import { getPlatformStats } from "@/app/actions/stats"
import { isStripeConfigured } from "@/lib/stripe"

export const metadata: Metadata = {
  title: "Donate — DuaPrayer",
  description: "Support DuaPrayer and help keep the community prayer platform free and welcoming.",
}

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const params = await searchParams
  const stats = await getPlatformStats()
  const stripeConfigured = isStripeConfigured()

  const showSuccess = params.success === "1"
  const showCanceled = params.canceled === "1"

  return (
    <InnerPageLayout activePath="/donate">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to feed
      </Link>

      {showSuccess ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-[1.5rem] border border-primary/25 bg-primary/10 px-4 py-4"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="font-semibold text-primary">Thank you for your support</p>
            <p className="mt-1 text-sm leading-6 text-accent-foreground">
              Your donation helps keep DuaPrayer available for the Ummah. May Allah accept your sadaqah.
            </p>
          </div>
        </div>
      ) : null}

      {showCanceled ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-[1.5rem] border border-border/70 bg-white/90 px-4 py-4"
        >
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="font-semibold">Checkout canceled</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              No charge was made. You can choose another amount below whenever you are ready.
            </p>
          </div>
        </div>
      ) : null}

      <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-primary/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,hsl(var(--accent))_54%,rgba(20,120,78,0.14)_100%)] p-6 shadow-[0_22px_80px_rgba(20,120,78,0.16)] sm:p-8">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
            Voluntary sadaqah
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Support DuaPrayer</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-accent-foreground sm:text-base">
            DuaPrayer is a nonprofit community platform for sharing duas and responding with ameen. Donations are
            optional and help cover hosting, moderation tools, and ongoing development so the service stays free for
            everyone.
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold tracking-tight">Where your gift goes</h2>
          <ul className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
            <li className="flex gap-3">
              <Server className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-foreground">Platform uptime</strong> — servers, databases, and
                security that keep prayer requests available around the clock.
              </span>
            </li>
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-foreground">Trust & safety</strong> — moderation, abuse
                prevention, and privacy-minded tooling for a respectful community space.
              </span>
            </li>
            <li className="flex gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-foreground">Community features</strong> — improvements to
                channels, categories, and accessibility so more people can participate with ease.
              </span>
            </li>
          </ul>
          <p className="mt-5 rounded-2xl border border-border/70 bg-muted/45 px-4 py-3 text-xs leading-5 text-muted-foreground">
            DuaPrayer is not a religious authority and does not provide fatwa or counseling. Donations support the
            neutral technology platform only.
          </p>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-white/95 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold tracking-tight">Make a donation</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick a preset amount below. Checkout is handled securely by Stripe.
          </p>
          <div className="mt-5">
            <DonateForm stripeConfigured={stripeConfigured} />
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Platform insights</h2>
          <LayoutGrid className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Live community signals from the public feed. These numbers reflect shared duas and ameen activity, not
          religious guidance.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Users, label: "Duas shared", value: stats.totalDuasLabel },
            { icon: MessageCircle, label: "Ameens recorded", value: stats.totalAmeensLabel },
            { icon: HeartHandshake, label: "Topics", value: stats.totalCategoriesLabel },
            { icon: ShieldCheck, label: "Moderated", value: "Yes" },
          ].map((signal) => {
            const SignalIcon = signal.icon
            return (
              <div key={signal.label} className="rounded-3xl bg-muted/60 p-4">
                <SignalIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="mt-3 text-xl font-semibold tracking-tight">{signal.value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{signal.label}</p>
              </div>
            )
          })}
        </div>
      </section>
    </InnerPageLayout>
  )
}
