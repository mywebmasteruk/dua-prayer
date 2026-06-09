import Link from "next/link"
import { BrandLogo } from "./brand-logo"
import { signInHref } from "@/lib/auth-modal"

const footerLinkClassName =
  "text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"

type FooterLayout = "page" | "column"

export function Footer({
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
          </nav>
        </div>

        <p className="mt-6 border-t border-border/60 pt-6 text-xs leading-5 text-muted-foreground">
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
