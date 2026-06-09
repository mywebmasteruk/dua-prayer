import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, EyeOff, LockKeyhole, Shield, ShieldCheck } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"

export const metadata: Metadata = {
  title: "Safety — DuaPrayer",
  description: "Trust, safety, and privacy practices for sharing duas on DuaPrayer.",
}

export default function SafetyPage() {
  return (
    <InnerPageLayout activePath="/safety">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to feed
      </Link>

      <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-primary/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,hsl(var(--accent))_54%,rgba(20,120,78,0.14)_100%)] p-6 shadow-[0_22px_80px_rgba(20,120,78,0.16)] sm:p-8">
        <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Trust & safety
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Safety and privacy</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-accent-foreground sm:text-base">
            Public duas should feel safe to share. These practices help keep DuaPrayer respectful, privacy-minded, and
            clear about what the platform is — and is not.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <h2 className="text-lg font-semibold tracking-tight">Sharing responsibly</h2>
        <ul className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
          <li className="flex gap-3">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-foreground">Protect private details</strong> — avoid full names,
              contact info, or anything you would not say in a public gathering.
            </span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-foreground">Moderation</strong> — volunteers and automated tools
              review flagged content to reduce abuse, spam, and harassment.
            </span>
          </li>
          <li className="flex gap-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-foreground">Account data</strong> — sign-in is handled through
              secure providers; we collect only what is needed to run the service.
            </span>
          </li>
        </ul>
        <p className="mt-5 rounded-2xl border border-border/70 bg-muted/45 px-4 py-3 text-xs leading-5 text-muted-foreground">
          DuaPrayer is not a substitute for crisis services, medical care, legal advice, or religious scholarship.
          Community stats and trends are support signals, not fatwa or counseling.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Read the full{" "}
          <Link href="/resources" className="font-medium text-primary underline-offset-2 hover:underline">
            community guidelines
          </Link>{" "}
          on the Resources page.
        </p>
      </section>
    </InnerPageLayout>
  )
}
