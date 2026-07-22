"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { updateMyPreferences } from "@/app/actions/preferences"
import { useFollowedChannels } from "@/components/followed-channels-provider"
import { FEED_LANGUAGE_OPTIONS } from "@/lib/feed-languages"
import type { Category } from "@/lib/types/dua"

interface PreferencesFormProps {
  initialLanguages: string[]
  initialTopics: number[]
  /** Topic categories (channel_type === "category") the user can pick interests from. */
  topicCategories: Category[]
  /** All categories/channels, for resolving followed-channel names. */
  allChannels: Category[]
}

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function PreferencesForm({
  initialLanguages,
  initialTopics,
  topicCategories,
  allChannels,
}: PreferencesFormProps) {
  const [languages, setLanguages] = useState<Set<string>>(() => new Set(initialLanguages))
  const [topics, setTopics] = useState<Set<number>>(() => new Set(initialTopics))
  const [isPending, startTransition] = useTransition()
  const { followedIds, toggleFollow } = useFollowedChannels()

  const channelById = useMemo(() => new Map(allChannels.map((c) => [c.id, c])), [allChannels])
  const followedChannels = useMemo(
    () => [...followedIds].map((id) => channelById.get(id)).filter((c): c is Category => Boolean(c)),
    [channelById, followedIds],
  )

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateMyPreferences({
        languages: [...languages],
        topics: [...topics],
      })
      if (result && "error" in result && result.error) {
        toast({ title: "Could not save", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Preferences saved" })
      }
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Languages</h2>
          <p className="text-sm text-muted-foreground">
            Choose the languages you want to see in your feed. Leave all unchecked to see every language.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FEED_LANGUAGE_OPTIONS.map((option) => {
            const active = languages.has(option.code)
            return (
              <button
                key={option.code}
                type="button"
                aria-pressed={active}
                onClick={() => setLanguages((current) => toggle(current, option.code))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-transparent bg-primary/15 text-primary"
                    : "border-border/70 bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {option.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Topics</h2>
          <p className="text-sm text-muted-foreground">Topics you care about, used to personalise your experience.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {topicCategories.map((topic) => {
            const active = topics.has(topic.id)
            return (
              <button
                key={topic.id}
                type="button"
                aria-pressed={active}
                onClick={() => setTopics((current) => toggle(current, topic.id))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-transparent bg-primary/15 text-primary"
                    : "border-border/70 bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                {topic.name}
              </button>
            )
          })}
        </div>
      </section>

      <div>
        <Button type="button" onClick={handleSave} disabled={isPending} className="rounded-full px-6">
          {isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>

      <section className="space-y-3 border-t border-border/60 pt-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">Channels you follow</h2>
          <p className="text-sm text-muted-foreground">Unfollow any channel here, or discover more on the Channels page.</p>
        </div>
        {followedChannels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You&apos;re not following any channels yet.{" "}
            <Link href="/channels" className="font-semibold text-primary hover:underline">
              Browse channels
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {followedChannels.map((channel) => (
              <li key={channel.id}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 py-1 pl-3 pr-1.5 text-sm font-medium text-foreground">
                  {channel.name}
                  <button
                    type="button"
                    onClick={() => toggleFollow(channel.id)}
                    aria-label={`Unfollow ${channel.name}`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
