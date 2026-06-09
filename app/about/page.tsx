import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, HeartHandshake, Info, Sparkles } from "lucide-react"
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
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Our mission
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">About DuaPrayer</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-accent-foreground sm:text-base">{siteCopy.aboutMission}</p>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
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
