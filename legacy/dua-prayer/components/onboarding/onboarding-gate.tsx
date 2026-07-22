"use client"

import { useState, useTransition } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { updateMyPreferences } from "@/app/actions/preferences"
import { useFollowedChannels } from "@/components/followed-channels-provider"
import { useNavigationRouter } from "@/hooks/use-navigation-router"
import { FEED_LANGUAGE_OPTIONS } from "@/lib/feed-languages"
import type { Category } from "@/lib/types/dua"

interface OnboardingGateProps {
  /** Topic categories to choose interests from (channel_type === "category"). */
  topicCategories: Category[]
  /** Channels/topics suggested to follow in the final step. */
  followSuggestions: Category[]
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-transparent bg-primary/15 text-primary"
          : "border-border/70 bg-transparent text-muted-foreground hover:bg-muted",
      )}
    >
      {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {label}
    </button>
  )
}

const STEPS = ["languages", "topics", "follow"] as const

export function OnboardingGate({ topicCategories, followSuggestions }: OnboardingGateProps) {
  const [open, setOpen] = useState(true)
  const [step, setStep] = useState(0)
  const [languages, setLanguages] = useState<Set<string>>(() => new Set())
  const [topics, setTopics] = useState<Set<number>>(() => new Set())
  const [isPending, startTransition] = useTransition()
  const { followedIds, toggleFollow } = useFollowedChannels()
  const router = useNavigationRouter()

  if (!open) return null

  const finish = (markPrefs: boolean) => {
    startTransition(async () => {
      const result = await updateMyPreferences({
        ...(markPrefs ? { languages: [...languages], topics: [...topics] } : {}),
        onboardedAt: new Date().toISOString(),
      })
      if (result && "error" in result && result.error) {
        toast({ title: "Could not finish setup", description: result.error, variant: "destructive" })
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  const isLast = step === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/40 px-0 py-0 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="scrollbar-hide flex max-h-[calc(100svh-1rem)] w-full max-w-lg flex-col overflow-y-auto rounded-t-[2rem] border border-border bg-white p-5 shadow-[0_35px_120px_rgba(15,23,42,0.24)] sm:max-h-[calc(100svh-5rem)] sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Welcome to DuaPrayer</p>
            <h2 id="onboarding-title" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {step === 0 ? "Which languages do you read?" : step === 1 ? "What would you like duas about?" : "Follow to build your feed"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={isPending}
            className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Skip
          </button>
        </div>

        <div className="mt-5 min-h-[140px]">
          {step === 0 ? (
            <div className="flex flex-wrap gap-2">
              {FEED_LANGUAGE_OPTIONS.map((option) => (
                <Pill
                  key={option.code}
                  label={option.label}
                  active={languages.has(option.code)}
                  onClick={() => setLanguages((c) => toggle(c, option.code))}
                />
              ))}
            </div>
          ) : step === 1 ? (
            <div className="flex flex-wrap gap-2">
              {topicCategories.map((topic) => (
                <Pill
                  key={topic.id}
                  label={topic.name}
                  active={topics.has(topic.id)}
                  onClick={() => setTopics((c) => toggle(c, topic.id))}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {followSuggestions.map((channel) => (
                <Pill
                  key={channel.id}
                  label={channel.name}
                  active={followedIds.has(channel.id)}
                  onClick={() => toggleFollow(channel.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s} className={cn("h-1.5 w-6 rounded-full", i === step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button type="button" variant="ghost" className="rounded-full" onClick={() => setStep((s) => s - 1)} disabled={isPending}>
                Back
              </Button>
            ) : null}
            {isLast ? (
              <Button type="button" className="rounded-full px-6" onClick={() => finish(true)} disabled={isPending}>
                {isPending ? "Finishing…" : "Done"}
              </Button>
            ) : (
              <Button type="button" className="rounded-full px-6" onClick={() => setStep((s) => s + 1)} disabled={isPending}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
