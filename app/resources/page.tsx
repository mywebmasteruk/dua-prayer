import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  HandCoins,
  HandHeart,
  HelpCircle,
  MessageSquareQuote,
  ScrollText,
  Users,
} from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"

export const metadata: Metadata = {
  title: "Resources — DuaPrayer",
  description:
    "Community guidelines, tips for sharing duas, and quick answers for getting the most from DuaPrayer.",
}

const guidelines = [
  "Share duas with sincerity — keep requests respectful and free of hate or harassment.",
  "Avoid posting private identifying details (full names, phone numbers, addresses).",
  "Use channels and categories so others can find and support related requests.",
  "Respond with ameen to uplift others; do not use replies to debate or criticize faith.",
  "Report content that feels unsafe or off-topic so volunteers can review it.",
] as const

const faqItems = [
  {
    question: "Do I need an account to post a dua?",
    answer:
      "You can browse the feed without signing in. Creating an account helps you manage your requests and participate more fully.",
  },
  {
    question: "What does ameen mean here?",
    answer:
      "Ameen is a simple way to say you are joining someone in their dua — like adding your voice to their prayer.",
  },
  {
    question: "Is DuaPrayer religious guidance?",
    answer:
      "No. DuaPrayer is a community technology platform. It does not provide fatwa, counseling, or scholarly rulings.",
  },
] as const

export default function ResourcesPage() {
  return (
    <InnerPageLayout activePath="/resources">
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
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Help & guides
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Resources</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-accent-foreground sm:text-base">
            Quick guides for sharing duas respectfully, staying safe in public posts, and getting involved with the
            DuaPrayer community.
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold tracking-tight">Community guidelines</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            {guidelines.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            For moderation details and privacy practices, see our{" "}
            <Link href="/safety" className="font-medium text-primary underline-offset-2 hover:underline">
              Safety
            </Link>{" "}
            page.
          </p>
        </section>

        <section className="rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold tracking-tight">How to share a dua</h2>
          </div>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
            <li>
              <strong className="font-semibold text-foreground">Write from the heart</strong> — share what you are
              asking for in clear, sincere language.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Pick a channel</strong> — choose a category so others
              with similar intentions can find your request.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Keep it public-safe</strong> — omit sensitive personal
              details you would not share in a community gathering.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Welcome ameen</strong> — each ameen is someone joining
              you in prayer, not a comment thread.
            </li>
          </ol>
        </section>
      </div>

      <section className="mt-6 rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight">Quick FAQ</h2>
        </div>
        <dl className="mt-4 space-y-4">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-border/60 bg-muted/35 px-4 py-3">
              <dt className="text-sm font-semibold text-foreground">{item.question}</dt>
              <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight">Get involved</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          DuaPrayer stays free because of community care and optional support.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/volunteer"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HandHeart className="h-4 w-4 text-primary" aria-hidden="true" />
            Volunteer
          </Link>
          <Link
            href="/donate"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HandCoins className="h-4 w-4 text-primary" aria-hidden="true" />
            Donate
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-4 py-2.5 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            About DuaPrayer
          </Link>
        </div>
      </section>
    </InnerPageLayout>
  )
}
