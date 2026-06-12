import Link from "next/link"

const fontOptions = [
  {
    name: "Georgia Serif",
    stack: 'Georgia, Cambria, "Times New Roman", Times, serif',
    tone: "Warm, reflective, and book-like",
    category: "Healing",
    author: "Anonymous caregiver",
    time: "4 min ago",
    dua:
      "Please make du'a that Allah grants my mother complete shifa, eases her pain after surgery, and fills our home with sabr and calm while she recovers.",
    arabic: "اللهم اشفها شفاءً لا يغادر سقماً",
    ameens: "482 Ameens",
  },
  {
    name: "Trebuchet Humanist",
    stack: '"Trebuchet MS", Tahoma, Arial, sans-serif',
    tone: "Soft, friendly, and less formal than the site UI",
    category: "Ease",
    author: "Anonymous student",
    time: "18 min ago",
    dua:
      "Exam tomorrow. Please make du'a that Allah opens my mind, steadies my heart, and helps me remember what I studied without panic.",
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي",
    ameens: "318 Ameens",
  },
  {
    name: "Verdana Readable",
    stack: "Verdana, Geneva, sans-serif",
    tone: "Clear, spacious, and highly legible on small screens",
    category: "Rizq",
    author: "Anonymous job seeker",
    time: "41 min ago",
    dua:
      "Please make du'a that Allah guides me to work that is halal, stable, and good for my deen, and that I do not lose hope while waiting for the right door to open.",
    arabic: "اللهم افتح لي أبواب رزقك",
    ameens: "276 Ameens",
  },
]

export default function DuaFontPreviewPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,hsl(var(--muted))_54%,#ffffff_100%)] text-foreground">
      <section className="site-container py-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Dua text font preview</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
            Three web-safe ways to make dua text feel distinct
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Temporary local preview for comparing post body typography only. The surrounding labels use the current site UI style so the dua text contrast is easier to judge.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <Link
              href="/design-prototype"
              className="rounded-full border border-border bg-white px-4 py-2 text-foreground shadow-sm transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Back to prototype
            </Link>
            <Link
              href="/"
              className="rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Home
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {fontOptions.map((option) => (
            <article
              key={option.name}
              className="group overflow-hidden rounded-[2rem] border border-border/70 bg-white/95 shadow-[0_18px_70px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_90px_rgba(20,120,78,0.13)]"
            >
              <div className="border-b border-border/70 bg-muted/45 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{option.name}</p>
                    <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{option.stack}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    Web-safe
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.tone}</p>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-xs font-semibold text-primary">{option.category}</span>
                  <span className="text-muted-foreground/45" aria-hidden="true">·</span>
                  <span className="text-xs font-medium text-muted-foreground">{option.time}</span>
                </div>
                <h3 className="mt-1.5 text-base font-semibold tracking-tight text-foreground">{option.author}</h3>

                <p
                  className="mt-4 text-[15px] font-medium leading-[1.55] text-slate-800 sm:text-base sm:leading-[1.55]"
                  style={{ fontFamily: option.stack }}
                >
                  {option.dua}
                </p>
                <p
                  className="mt-4 rounded-2xl border border-primary/10 bg-primary/[0.04] px-4 py-3 text-right text-lg font-medium leading-8 text-slate-800"
                  dir="rtl"
                  lang="ar"
                >
                  {option.arabic}
                </p>

                <div className="-mx-5 mt-5 flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                  <span className="text-xs font-semibold text-primary">{option.ameens}</span>
                  <span className="text-xs font-medium text-muted-foreground">Sample post card</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mx-auto mt-8 max-w-3xl rounded-[1.5rem] border border-primary/15 bg-primary/10 p-5">
          <h2 className="text-lg font-semibold tracking-tight text-primary">Recommendation</h2>
          <p className="mt-2 text-sm leading-6 text-accent-foreground">
            Start with Georgia for dua post body text: it is the most visibly distinct from the Inter-based UI, feels reflective, and keeps long Latin duas readable with a medium weight and tighter line-height. Trebuchet is the safer sans-serif alternative if serif feels too editorial; Verdana is best for maximum readability but has wider spacing that can make long posts feel heavier.
          </p>
        </section>
      </section>
    </main>
  )
}
