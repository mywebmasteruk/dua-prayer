"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  ChevronRight,
  Clock3,
  Flag,
  Flame,
  HandCoins,
  Heart,
  HeartHandshake,
  LayoutGrid,
  LockKeyhole,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { PrayerHandsIcon } from "@/components/icons/prayer-hands"

type PrayerCard = {
  name: string
  category: string
  text: string
  prayers: number
  loves: number
  time: string
  state: string
  source: { type: "anonymous" | "channel"; name: string }
}

const arabicCharacterPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g
const arabicTextSegmentPattern = /([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g
const latinCharacterPattern = /[A-Za-z]/
const arabicFontClassName = "font-arabic-dua"

function getTextDirection(text: string): "ltr" | "rtl" {
  const arabicCharacters = text.match(arabicCharacterPattern)?.length ?? 0

  return arabicCharacters >= 2 ? "rtl" : "ltr"
}

function hasArabicText(text: string) {
  return Boolean(text.match(arabicCharacterPattern))
}

function getArabicOnlyFontClassName(text: string) {
  return hasArabicText(text) && !latinCharacterPattern.test(text) ? arabicFontClassName : ""
}

function renderWithArabicFont(text: string) {
  return text.split(arabicTextSegmentPattern).map((segment, index) =>
    hasArabicText(segment) ? (
      <span key={`${segment}-${index}`} className={arabicFontClassName}>
        {segment}
      </span>
    ) : (
      segment
    ),
  )
}

const prayerCards: PrayerCard[] = [
  {
    name: "Anonymous request",
    category: "Healing",
    text: "Please make du'a that Allah grants my mother strength after surgery, eases her pain, and fills our home with sabr.",
    prayers: 482,
    loves: 38,
    time: "4 min ago",
    state: "Rising",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous student",
    category: "Exams",
    text: "Exam tomorrow. Please make du'a.",
    prayers: 318,
    loves: 24,
    time: "18 min ago",
    state: "Near you",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous family",
    category: "Provision",
    text: "May Allah open doors of rizq and protect families carrying quiet financial stress.",
    prayers: 276,
    loves: 19,
    time: "41 min ago",
    state: "Community",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "طلب مجهول",
    category: "Family",
    text: "اللهم احفظ أهلي.",
    prayers: 241,
    loves: 31,
    time: "56 min ago",
    state: "Arabic",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous neighbor",
    category: "Ease",
    text: "Please keep our neighbors in your du'a: اللهم يسّر لهم أمورهم وافتح لهم أبواب الخير.",
    prayers: 219,
    loves: 22,
    time: "1 hr ago",
    state: "Mixed",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous parent",
    category: "Family",
    text: "Please make du'a for rest, patience, and gentle support for parents caring for a newborn through long nights.",
    prayers: 186,
    loves: 17,
    time: "2 hr ago",
    state: "New",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous traveler",
    category: "Protection",
    text: "اللهم احفظ المسافرين وردهم إلى أهلهم سالمين. Please remember everyone traveling this week.",
    prayers: 164,
    loves: 14,
    time: "3 hr ago",
    state: "Shared",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous caregiver",
    category: "Healing",
    text: "Please make du'a for my father as he begins treatment this week. We are trying to stay hopeful, but the appointments, paperwork, and uncertainty are weighing on everyone. May Allah grant him shifa, give the doctors wisdom, keep our family gentle with each other, and replace our fear with tawakkul.",
    prayers: 139,
    loves: 11,
    time: "4 hr ago",
    state: "Long",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous heart",
    category: "Forgiveness",
    text: "Make du'a for me.",
    prayers: 112,
    loves: 9,
    time: "5 hr ago",
    state: "Short",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "دعاء مجهول",
    category: "سكينة",
    text: "اللهم اشرح صدري ويسر أمري واهد قلبي لما تحب وترضى، واجعل لي من كل ضيق مخرجا ومن كل هم فرجا، وارزقني الصبر والطمأنينة وحسن الظن بك في كل حال.",
    prayers: 96,
    loves: 18,
    time: "6 hr ago",
    state: "Arabic",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous job seeker",
    category: "Rizq",
    text: "Please make du'a that Allah guides me to work that is halal, stable, and good for my deen, and that I do not lose hope while waiting for the right door to open.",
    prayers: 84,
    loves: 7,
    time: "7 hr ago",
    state: "Steady",
    source: { type: "anonymous", name: "Anonymous" },
  },
  {
    name: "Anonymous mixed request",
    category: "Ease",
    text: "Feeling overwhelmed today. اللهم اجعل بعد العسر يسرا and help me answer people with patience.",
    prayers: 73,
    loves: 12,
    time: "8 hr ago",
    state: "Mixed",
    source: { type: "anonymous", name: "Anonymous" },
  },
]

const categoryLeaderboard = [
  { label: "Healing", duas: "128", ameens: "1.2k", delta: "+18%", active: true },
  { label: "Family", duas: "96", ameens: "860", delta: "+12%" },
  { label: "Ease", duas: "82", ameens: "744", delta: "+9%" },
  { label: "Provision", duas: "74", ameens: "603", delta: "+7%" },
  { label: "Students", duas: "58", ameens: "512", delta: "+5%" },
]

const sessionActions = [
  { icon: MessageCircle, label: "Drafts", helper: "My duas", value: "3" },
  { icon: Bookmark, label: "Saved requests", helper: "Saved", value: "18" },
  { icon: HeartHandshake, label: "Ameens", helper: "Support history", value: "42" },
  { icon: Bell, label: "Daily digest", helper: "Notifications", value: "On" },
]

const platformStats = [
  { icon: Users, label: "Active now", value: "314" },
  { icon: MessageCircle, label: "Ameens sent", value: "2.4k" },
  { icon: ShieldCheck, label: "Moderated queue", value: "100%" },
  { icon: HeartHandshake, label: "Open requests", value: "128" },
]

const supportedRequests = [
  { label: "Surgery recovery", value: "482 ameens" },
  { label: "Exam week support", value: "318 ameens" },
  { label: "Family provision", value: "276 ameens" },
]

export default function DesignPrototypePage() {
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [reportedCards, setReportedCards] = useState<Record<string, boolean>>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isAnonymous = true
  const maxCharacters = 300
  const composerTitleId = "prototype-composer-title"
  const openComposer = () => setIsComposerOpen(true)

  useEffect(() => {
    if (!isComposerOpen) {
      return
    }

    textareaRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsComposerOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isComposerOpen])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--accent))_0,transparent_34%),linear-gradient(180deg,#ffffff_0%,hsl(var(--muted))_48%,#ffffff_100%)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 max-w-[1250px] items-center justify-between gap-4 px-4 lg:px-6">
          <Link
            href="/"
            className="relative z-10 flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="DuaPrayer home"
          >
            <BrandLogo variant="icon" href="" priority className="h-9 w-9" />
            <span className="text-[17px] font-semibold tracking-tight text-foreground">DuaPrayer</span>
          </Link>

          <nav aria-label="Prototype sections" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-border/70 bg-white/80 p-1 shadow-sm md:flex">
            {["About", "Activity", "Requests"].map((item, index) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  index === 0 ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-2">
            <button
              type="button"
              className="hidden rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              Preview mode
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm transition hover:border-primary/35 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Donate"
              title="Donate"
            >
              <HandCoins className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open notifications"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1250px] gap-5 px-4 py-5 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-6 lg:py-8">
        <section className="min-w-0 lg:col-start-2 lg:row-start-1" aria-label="Prayer request composer and feed">
          <section
            id="requests"
            className="overflow-hidden border-x border-border/60 bg-white/95 shadow-[0_18px_60px_rgba(15,23,42,0.05)] backdrop-blur-xl"
          >
            <div
              className="group flex w-full cursor-pointer items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/25 sm:px-5"
              onClick={openComposer}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10">
                <BrandLogo variant="icon" href="" className="h-6 w-6" />
              </span>
              <button
                type="button"
                onClick={openComposer}
                className="flex min-w-0 flex-1 items-center rounded-full border border-border/70 bg-muted/35 px-4 py-2.5 text-[15px] font-medium text-muted-foreground shadow-inner transition hover:border-primary/25 hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-base"
                aria-haspopup="dialog"
                aria-expanded={isComposerOpen}
                aria-label="Open composer to make a dua"
              >
                <span className="truncate">What dua would you like to make?</span>
              </button>
              <button
                type="button"
                onClick={openComposer}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-haspopup="dialog"
                aria-expanded={isComposerOpen}
                aria-label="Open composer to make a dua"
              >
                <Plus className="h-5 w-5 transition motion-reduce:transition-none" aria-hidden="true" />
              </button>
            </div>

            <div>
              <div>
                {prayerCards.map((card) => {
                  const isReported = Boolean(reportedCards[card.name])
                  const textDirection = getTextDirection(card.text)
                  const isRtl = textDirection === "rtl"
                  const textClassName = isRtl
                    ? `text-right leading-8 sm:leading-8 font-medium ${getArabicOnlyFontClassName(card.text)}`
                    : `leading-7 sm:leading-7 ${getArabicOnlyFontClassName(card.text)}`

                  return (
                    <article
                      key={card.name}
                      className="group border-b border-border/60 px-4 pt-3.5 transition hover:bg-muted/20 focus-within:bg-muted/20 last:border-b-0 sm:px-5"
                    >
                      <div className={`flex items-start justify-between gap-3 ${isRtl ? "flex-row-reverse text-right" : ""}`}>
                        <div dir={textDirection} className="min-w-0 flex-1">
                          <div
                            className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
                              isRtl ? "justify-end text-right" : ""
                            }`}
                          >
                            <span className={`text-xs font-semibold text-primary ${getArabicOnlyFontClassName(card.category)}`}>
                              {renderWithArabicFont(card.category)}
                            </span>
                            <span className="text-muted-foreground/45" aria-hidden="true">·</span>
                            <span className="text-xs font-medium text-muted-foreground">{card.time}</span>
                          </div>
                          <h3
                            className={`mt-1.5 text-base font-semibold text-foreground ${
                              isRtl ? "leading-7 tracking-normal" : "tracking-tight"
                            } ${getArabicOnlyFontClassName(card.name)}`}
                          >
                            {renderWithArabicFont(card.name)}
                          </h3>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-muted-foreground">
                          {card.state}
                        </span>
                      </div>
                      <p
                        dir={textDirection}
                        className={`mt-2.5 text-[15px] text-slate-800 sm:text-base ${textClassName}`}
                      >
                        {renderWithArabicFont(card.text)}
                      </p>
                      <div className={`-mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100/80 bg-slate-50/60 px-4 py-2.5 transition group-hover:bg-slate-50/80 sm:-mx-5 sm:px-5 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <div
                          dir={textDirection}
                          className={`flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground ${
                            isRtl ? "text-right" : ""
                          }`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                            {card.source.type === "anonymous" ? (
                              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </span>
                          <span className={`truncate ${getArabicOnlyFontClassName(card.source.name)}`}>
                            {renderWithArabicFont(card.source.name)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            aria-label={`Make ameen for ${card.name}. ${card.prayers} ameens so far.`}
                            className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <PrayerHandsIcon className="h-4 w-4" aria-hidden="true" />
                            <span>{card.prayers} Ameens</span>
                          </button>
                          <button
                            type="button"
                            aria-label={`Love ${card.name}. ${card.loves} loves so far.`}
                            className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <Heart className="h-4 w-4" aria-hidden="true" />
                            <span>{card.loves}</span>
                          </button>
                          <button
                            type="button"
                            aria-label={`Share ${card.name}`}
                            className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <Share2 className="h-4 w-4" aria-hidden="true" />
                            <span>Share</span>
                          </button>
                          <button
                            type="button"
                            aria-label={`${isReported ? "Unreport" : "Report"} ${card.name}`}
                            aria-pressed={isReported}
                            onClick={() =>
                              setReportedCards((previous) => ({
                                ...previous,
                                [card.name]: !previous[card.name],
                              }))
                            }
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              isReported
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-red-600"
                            }`}
                          >
                            <Flag className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>
        </section>

        <aside
          className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 lg:sticky lg:top-24 lg:col-start-1 lg:row-start-1 lg:block lg:space-y-5 lg:self-start"
          aria-label="Your session and account shortcuts"
        >
          <section
            id="about"
            className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-white p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] md:col-span-2 lg:col-span-1"
          >
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {isAnonymous ? (
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isAnonymous ? "Anonymous session" : "Signed in session"}
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                {isAnonymous ? "Your quiet corner." : "Session saved."}
              </h2>
              {isAnonymous ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    DuaPrayer is a community space to share dua requests and support others with ameen. Sign in to save drafts, follow channels, and keep your activity across devices.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Sign in to save
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <div className="mt-3 rounded-[1.25rem] border border-border/70 bg-muted/45 p-3">
                  <p className="text-sm font-semibold tracking-tight text-foreground">Personal session synced</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Drafts, followed channels, saved requests, and recent support activity are kept across devices.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                My activity
              </h2>
              <Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-border/70 bg-white/80">
              {sessionActions.map((action) => {
                const ActionIcon = action.icon
                const isDigest = action.label === "Daily digest"

                return (
                  <button
                    key={action.label}
                    type="button"
                    className="group flex w-full items-center gap-3 border-b border-border/60 px-3.5 py-3 text-left transition last:border-b-0 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-label={`${action.label}: ${action.value}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/10 transition group-hover:bg-primary/15">
                      <ActionIcon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold tracking-tight text-foreground">{action.label}</span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">{action.helper}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={
                          isDigest
                            ? "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                            : "min-w-6 text-right text-sm font-semibold tracking-tight text-foreground"
                        }
                      >
                        {action.value}
                      </span>
                      {!isDigest ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground/70 transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-primary/20 bg-primary/10 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                <Settings2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-primary">Preferences</h2>
                <p className="mt-2 text-sm leading-6 text-accent-foreground">
                  Mock controls for digest timing, saved topics, and privacy reminders. No real account data is used in this local prototype.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <aside
          className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 lg:sticky lg:top-24 lg:col-start-3 lg:row-start-1 lg:block lg:space-y-5 lg:self-start"
          aria-label="Community trends and platform context"
        >
          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 id="activity" className="text-lg font-semibold tracking-tight">Trending</h2>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">Live sample</span>
            </div>
            <div className="mt-4 rounded-2xl border border-border/80 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Ranked by recent requests and community ameen activity in this prototype feed.
            </div>
            <div className="mt-4 space-y-2">
              {categoryLeaderboard.map((category, index) => (
                <a
                  key={category.label}
                  href="#requests"
                  aria-label={`${category.label}: ${category.duas} duas and ${category.ameens} ameens, trending ${category.delta}`}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    category.active
                      ? "border-primary/25 bg-primary/10 shadow-[0_12px_32px_rgba(20,120,78,0.10)]"
                      : "border-transparent bg-muted/55 hover:border-border/70 hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      category.active ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{category.label}</span>
                    <span className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-primary" aria-hidden="true" />
                        <span className="text-foreground/80">{category.duas}</span>
                        <span>Duas</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground/60" aria-hidden="true">·</span>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <HeartHandshake className="h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
                        <span className="shrink-0 text-foreground/80">{category.ameens}</span>
                        <span className="truncate">Ameens</span>
                      </span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      category.active ? "bg-white text-primary" : "bg-white/80 text-muted-foreground"
                    }`}
                  >
                    {category.delta}
                  </span>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium leading-5 text-muted-foreground">
              Counts are sample community signals, not advice or ranking by authority.
            </p>
          </section>

          <section className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,hsl(var(--accent))_54%,rgba(20,120,78,0.14)_100%)] p-5 shadow-[0_22px_80px_rgba(20,120,78,0.16)] md:col-span-2 lg:col-span-1">
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute bottom-4 right-5 h-16 w-16 rounded-full border border-primary/20" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/75 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                For imams & communities
              </p>
              <div className="mt-5 flex items-start gap-3">
                <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-[0_12px_28px_rgba(20,120,78,0.22)]">
                  <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Start a dua channel</h2>
                  <p className="mt-3 text-sm leading-7 text-accent-foreground">
                    Imams and community teams can open a shared space for requests, updates, and collective ameen. Members can follow activity from a local or online community.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Create a channel
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
                Mock signup card for this local prototype.
              </p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Platform activity</h2>
              <LayoutGrid className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {platformStats.map((signal) => {
                const SignalIcon = signal.icon

                return (
                  <div key={signal.label} className="rounded-3xl bg-muted/60 p-4">
                    <SignalIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="mt-3 text-xl font-semibold tracking-tight">{signal.value}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{signal.label}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight">Top supported</h2>
            </div>
            <div className="mt-4 space-y-2">
              {supportedRequests.map((request, index) => (
                <a
                  key={request.label}
                  href="#requests"
                  className="flex items-center justify-between gap-3 rounded-2xl bg-muted/55 px-3 py-3 text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                      {index + 1}
                    </span>
                    <span className="truncate">{request.label}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{request.value}</span>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-primary/20 bg-primary/10 p-5 md:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary p-3 text-primary-foreground">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-primary">Safety and privacy</h2>
                <p className="mt-2 text-sm leading-6 text-accent-foreground">
                  Public requests should avoid private identifying details. Community stats here are sample signals, not guidance or advice.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-white/90 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Prototype note</h2>
              <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Local preview only. This design explores layout and sample copy before any production homepage changes.
            </p>
          </section>
        </aside>
      </div>

      {isComposerOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/35 px-0 py-0 backdrop-blur-[2px] sm:px-4 sm:py-20 lg:px-6 lg:py-24"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsComposerOpen(false)
            }
          }}
        >
          <div
            className="mx-auto flex min-h-full w-full max-w-[1250px] items-end sm:items-start lg:grid lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:gap-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsComposerOpen(false)
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby={composerTitleId}
              className="w-full rounded-t-[2rem] border border-primary/15 bg-white p-4 shadow-[0_35px_120px_rgba(15,23,42,0.24)] sm:rounded-[2rem] sm:p-5 lg:col-start-2"
            >
            <div className="rounded-[1.7rem] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-white to-muted/50 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id={composerTitleId} className="text-xl font-semibold tracking-tight text-foreground">
                    Share a dua request
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Ask for support from the community. Avoid private details and share only what helps others respond with care.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close composer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <label htmlFor="prototype-dua" className="mt-5 block text-sm font-semibold text-foreground">
                Dua request
              </label>
              <textarea
                ref={textareaRef}
                id="prototype-dua"
                value={draft}
                maxLength={maxCharacters}
                onChange={(event) => setDraft(event.target.value)}
                className="mt-2 min-h-40 w-full resize-none rounded-[1.35rem] border border-transparent bg-muted/45 p-4 text-base leading-7 shadow-inner outline-none transition placeholder:text-muted-foreground/75 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
                placeholder="Share a dua for yourself, your family, or someone who needs support..."
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2" aria-label="Composer options">
                  {["Anyone can make ameen", "Family", "Ease"].map((tag, index) => (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={index === 0}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        index === 0
                          ? "border-primary/25 bg-primary/10 text-primary"
                          : "border-border/80 bg-white text-muted-foreground hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <span
                  className={`text-sm font-semibold ${draft.length > maxCharacters - 25 ? "text-primary" : "text-muted-foreground"}`}
                  aria-live="polite"
                >
                  {maxCharacters - draft.length}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Moderated community prototype
                </div>
                <button
                  type="button"
                  disabled={draft.trim().length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-foreground/30"
                >
                  Preview request
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            </section>
          </div>
        </div>
      ) : null}

    </main>
  )
}
