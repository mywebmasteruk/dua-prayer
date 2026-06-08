import Link from "next/link"
import { BrandLogo } from "./brand-logo"

const footerLinkClassName =
  "text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-shell-footer">
      <div className="site-container py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <BrandLogo
              variant="icon"
              href="/"
              showWordmark
              wordmarkClassName="text-base font-semibold leading-none tracking-tight text-foreground"
              className="h-8 w-8 shrink-0"
            />
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              A nonprofit community platform for sharing duas and responding with ameen — free for the Ummah.
            </p>
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
            <Link href="/auth" className={footerLinkClassName}>
              Sign in
            </Link>
          </nav>
        </div>

        <p className="mt-6 border-t border-border/60 pt-6 text-xs leading-5 text-muted-foreground">
          © {year} DuaPrayer.
        </p>
      </div>
    </footer>
  )
}
