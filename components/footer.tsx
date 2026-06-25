import Link from "next/link"
import { Rss } from "lucide-react"
import { BrandLogo } from "./brand-logo"
import { signInHref } from "@/lib/auth-modal"
import { getRssSettings } from "@/lib/rss-settings-server"

const footerLinkClassName =
  "rounded-sm text-muted-foreground/75 transition hover:text-primary hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

type FooterLayout = "page" | "column"

export async function Footer({
  footerTagline = "A nonprofit community platform for sharing duas and responding with ameen — free for the Ummah.",
  layout = "page",
}: {
  footerTagline?: string
  /** page: full-width site-container (auth). column: grid content padding (sidebar layouts). */
  layout?: FooterLayout
}) {
  const year = new Date().getFullYear()
  const innerClassName =
    layout === "column" ? "w-full px-4 py-8 lg:px-6" : "site-container py-8"
  const rss = await getRssSettings()

  return (
    <footer className="site-shell-footer">
      <div className={innerClassName}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <BrandLogo
              variant="icon"
              href="/"
              showWordmark
              wordmarkClassName="text-base font-semibold leading-none tracking-tight text-foreground"
              className="h-8 w-8 shrink-0"
            />
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">{footerTagline}</p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <Link href="/" className={footerLinkClassName}>
              Home
            </Link>
            <Link href="/donate" className={footerLinkClassName}>
              Donate
            </Link>
            <Link href="/volunteer" className={footerLinkClassName}>
              Volunteer
            </Link>
            <Link href={signInHref()} className={footerLinkClassName}>
              Sign in
            </Link>
            {rss.enabled ? (
              <Link
                href="/feed.xml"
                className={`${footerLinkClassName} inline-flex items-center gap-1`}
                aria-label="RSS feed"
                title="RSS feed"
              >
                <Rss className="h-3.5 w-3.5" aria-hidden="true" />
                RSS
              </Link>
            ) : null}
          </nav>
        </div>

        <p className="mt-5 border-t border-border/25 pt-5 text-xs leading-5 text-muted-foreground/65">
          © {year} DuaPrayer. DuaPrayer is part of{" "}
          <Link href="https://masjidweb.com" className={footerLinkClassName}>
            Masjidweb.com
          </Link>
          .
        </p>
      </div>
    </footer>
  )
}
