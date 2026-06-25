import type { Metadata } from "next"
import Link from "next/link"
import { EyeOff, LockKeyhole, Shield, ShieldCheck } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { getPageSeo } from "@/lib/page-seo-server"

export async function generateMetadata(): Promise<Metadata> {
  return getPageSeo("safety")
}

export default function SafetyPage() {
  return (
    <InnerPageLayout activePath="/safety">
      <header className="border-b border-border/50 pb-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          Trust & safety
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Safety and privacy</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Public duas should feel safe to share. These practices help keep DuaPrayer respectful, privacy-minded, and
          clear about what the platform is — and is not.
        </p>
      </header>

      <section className="py-8">
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
        <p className="mt-5 text-xs leading-5 text-muted-foreground">
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
