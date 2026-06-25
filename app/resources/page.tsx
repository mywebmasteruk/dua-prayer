import type { Metadata } from "next"
import Link from "next/link"
import {
  BookOpen,
  HandCoins,
  HandHeart,
  HelpCircle,
  MessageSquareQuote,
  ScrollText,
  Users,
} from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { getPageSeo } from "@/lib/page-seo-server"

export async function generateMetadata(): Promise<Metadata> {
  return getPageSeo("resources")
}

const guidelines = [
  "Share duas with sincerity — keep requests respectful and free of hate or harassment.",
  "Avoid posting private identifying details (full names, phone numbers, addresses).",
  "Use channels and topics so others can find and support related requests.",
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
      <header className="border-b border-border/50 pb-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Help & guides
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Resources</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Quick guides for sharing duas respectfully, staying safe in public posts, and getting involved with the
          DuaPrayer community.
        </p>
      </header>

      <section className="border-b border-border/50 py-8">
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

      <section className="border-b border-border/50 py-8">
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

      <section className="border-b border-border/50 py-8">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight">Quick FAQ</h2>
        </div>
        <dl className="mt-4 divide-y divide-border/50">
          {faqItems.map((item) => (
            <div key={item.question} className="py-4 first:pt-0 last:pb-0">
              <dt className="text-sm font-semibold text-foreground">{item.question}</dt>
              <dd className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="py-8">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight">Get involved</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          DuaPrayer stays free because of community care and optional support.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/volunteer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HandHeart className="h-4 w-4" aria-hidden="true" />
            Volunteer
          </Link>
          <Link
            href="/donate"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HandCoins className="h-4 w-4" aria-hidden="true" />
            Donate
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            About DuaPrayer
          </Link>
        </div>
      </section>
    </InnerPageLayout>
  )
}
