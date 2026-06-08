import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Code2, HandHeart, Palette, ShieldCheck } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VolunteerApplySection } from "@/components/volunteer/volunteer-apply-section"
import { getVolunteerFilloutEmbedSrc } from "@/app/actions/settings"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Volunteer — DuaPrayer",
  description:
    "Help keep DuaPrayer welcoming and available — moderation, engineering, design, and platform care for the community.",
}

const waysToHelp = [
  {
    icon: ShieldCheck,
    title: "Content moderation",
    description:
      "Review flagged posts, help keep channels respectful, and support a safe space where people can share duas and respond with ameen.",
  },
  {
    icon: Code2,
    title: "Engineering & infrastructure",
    description:
      "Fix bugs, improve reliability, and help maintain hosting, databases, and security so the platform stays available for the Ummah.",
  },
  {
    icon: Palette,
    title: "Design & experience",
    description:
      "Shape clearer layouts, accessibility, and visual polish so more people can participate comfortably across devices.",
  },
] as const

export default async function VolunteerPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { isAdmin } = user ? await requireAdmin() : { isAdmin: false }
  const filloutSrc = await getVolunteerFilloutEmbedSrc()

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,hsl(var(--muted))_48%,#ffffff_100%)] text-foreground">
      <Header user={user} isAdmin={isAdmin} />

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 lg:px-6 lg:py-12">
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
              <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
              Community care
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Volunteer with DuaPrayer</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-accent-foreground sm:text-base">
              DuaPrayer is a nonprofit community platform for sharing duas and responding with ameen. Volunteers help
              keep the space welcoming, reliable, and free for everyone — no religious authority role, just thoughtful
              platform stewardship.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold tracking-tight">Ways you can help</h2>
          <ul className="mt-4 space-y-4">
            {waysToHelp.map((item) => {
              const ItemIcon = item.icon
              return (
                <li key={item.title} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold text-foreground">{item.title}</strong>
                    {" — "}
                    {item.description}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-5 rounded-2xl border border-border/70 bg-muted/45 px-4 py-3 text-xs leading-5 text-muted-foreground">
            DuaPrayer does not provide fatwa, counseling, or religious guidance. Volunteer work supports the neutral
            technology platform and community standards only.
          </p>
        </section>

        <VolunteerApplySection filloutSrc={filloutSrc} />
      </div>

      <Footer />
    </div>
  )
}
