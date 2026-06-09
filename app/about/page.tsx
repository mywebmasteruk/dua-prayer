import type { Metadata } from "next"
import Link from "next/link"
import { HeartHandshake, Info, Sparkles } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { getSiteCopy } from "@/lib/site-copy-server"

export const metadata: Metadata = {
  title: "About — DuaPrayer",
  description:
    "Learn about DuaPrayer — a nonprofit community platform for sharing duas and responding with ameen.",
}

export default async function AboutPage() {
  const siteCopy = await getSiteCopy()

  return (
    <InnerPageLayout activePath="/about">
      <header className="border-b border-border/50 pb-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Our mission
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">About DuaPrayer</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {siteCopy.aboutMission} DuaPrayer is part of{" "}
          <Link href="https://masjidweb.com" className="font-medium text-primary underline-offset-2 hover:underline">
            Masjidweb.com
          </Link>
          .
        </p>
      </header>

      <section className="py-8">
        <h2 className="text-lg font-semibold tracking-tight">What we believe</h2>
        <ul className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
          <li className="flex gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-foreground">Community first</strong> — the feed belongs to people
              who show up with sincerity, not algorithms chasing engagement.
            </span>
          </li>
          <li className="flex gap-3">
            <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-foreground">Free for the Ummah</strong> — optional donations and
              volunteers help cover hosting and moderation; access stays open.
            </span>
          </li>
          <li className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-foreground">Neutral platform</strong> — we provide tools for sharing
              and support, not religious rulings or personal advice.
            </span>
          </li>
        </ul>
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          New here? Browse the{" "}
          <Link href="/resources" className="font-medium text-primary underline-offset-2 hover:underline">
            Resources
          </Link>{" "}
          page for guidelines and tips, or learn how we handle{" "}
          <Link href="/safety" className="font-medium text-primary underline-offset-2 hover:underline">
            safety and privacy
          </Link>
          .
        </p>
      </section>
    </InnerPageLayout>
  )
}
