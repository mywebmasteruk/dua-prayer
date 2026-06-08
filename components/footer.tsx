import Link from "next/link"
import { BrandLogo } from "./brand-logo"

const footerLinkClassName =
  "text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto max-w-[1250px] px-4 py-8 lg:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="DuaPrayer home"
            >
              <BrandLogo variant="icon" href={undefined} className="h-8 w-8" />
              <span className="text-base font-semibold tracking-tight text-foreground">DuaPrayer</span>
            </Link>
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
            <Link href="/auth" className={footerLinkClassName}>
              Sign in
            </Link>
          </nav>
        </div>

        <p className="mt-6 border-t border-border/60 pt-6 text-xs leading-5 text-muted-foreground">
          © {year} DuaPrayer. Not a religious authority — community support only.
        </p>
      </div>
    </footer>
  )
}
