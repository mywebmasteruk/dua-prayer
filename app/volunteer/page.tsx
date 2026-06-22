import type { Metadata } from "next"
import { Code2, HandHeart, Palette, ShieldCheck } from "lucide-react"
import { InnerPageLayout } from "@/components/inner-page-layout"
import { VolunteerApplySection } from "@/components/volunteer/volunteer-apply-section"
import { getVolunteerFormRegistry } from "@/lib/site-settings-server"
import { getServerUser } from "@/lib/server-user"
import { getProfileAccessState } from "@/lib/account-status"

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

async function VolunteerApplyLoader() {
  const user = await getServerUser()
  const [registry, profile] = await Promise.all([
    getVolunteerFormRegistry(),
    user ? getProfileAccessState(user.id) : Promise.resolve(null),
  ])

  const metaName =
    (user?.user_metadata?.full_name as string | undefined) ?? (user?.user_metadata?.name as string | undefined) ?? null

  return (
    <VolunteerApplySection
      registry={registry}
      isSignedIn={Boolean(user)}
      userEmail={user?.email ?? null}
      userName={profile?.displayName ?? metaName}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
    />
  )
}

export default function VolunteerPage() {
  return (
    <InnerPageLayout activePath="/volunteer">
      <header className="border-b border-border/50 pb-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
          <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
          Community care
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Volunteer with DuaPrayer</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          DuaPrayer is a nonprofit community platform for sharing duas and responding with ameen. Volunteers help
          keep the space welcoming, reliable, and free for everyone — no religious authority role, just thoughtful
          platform stewardship.
        </p>
      </header>

      <section className="border-b border-border/50 py-8">
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
        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          DuaPrayer does not provide fatwa, counseling, or religious guidance. Volunteer work supports the neutral
          technology platform and community standards only.
        </p>
      </section>

      <VolunteerApplyLoader />
    </InnerPageLayout>
  )
}
