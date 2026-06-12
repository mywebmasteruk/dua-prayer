"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  createAdminDuaBot,
  pauseAdminDuaBot,
  resumeAdminDuaBot,
  runAdminDuaBotNow,
  updateAdminDuaBot,
} from "@/app/actions/admin-bots"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminTableShell } from "@/components/admin/admin-table-shell"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getBotLanguageOptions } from "@/lib/bot-language-options"
import type { BotRuntimeStatus, DuaEventBot, DuaBotRun } from "@/lib/dua-bots"
import type { Category } from "@/lib/types/dua"

type DuaBotControlPanelProps = {
  initialBots: DuaEventBot[]
  recentRuns: DuaBotRun[]
  categories: Category[]
  runtimeStatus: BotRuntimeStatus
}

type BotDraft = {
  id?: number
  name: string
  description: string
  status: "active" | "paused"
  sourceUrls: string
  keywords: string
  eventCategories: string
  frequencyMinutes: number
  tone: string
  language: string
  targetCategoryId: string
  publishMode: "pending" | "published"
}

const blankDraft: BotDraft = {
  name: "",
  description: "",
  status: "paused",
  sourceUrls: "https://www.un.org/press/en/rss.xml",
  keywords: "earthquake, flood, wildfire, conflict, refugees, disaster",
  eventCategories: "disaster, humanitarian",
  frequencyMinutes: 360,
  tone: "compassionate",
  language: "English",
  targetCategoryId: "none",
  publishMode: "pending",
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function listPreview(values: string[], fallback: string): string {
  if (values.length === 0) return fallback
  return values.slice(0, 3).join(", ") + (values.length > 3 ? "…" : "")
}

function draftFromBot(bot: DuaEventBot): BotDraft {
  return {
    id: bot.id,
    name: bot.name,
    description: bot.description,
    status: bot.status,
    sourceUrls: bot.source_urls.join("\n"),
    keywords: bot.keywords.join(", "),
    eventCategories: bot.event_categories.join(", "),
    frequencyMinutes: bot.frequency_minutes,
    tone: bot.tone,
    language: bot.language,
    targetCategoryId: bot.target_category_id?.toString() ?? "none",
    publishMode: bot.publish_mode,
  }
}

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "active" || status === "success") return "success"
  if (status === "error") return "danger"
  if (status === "paused" || status === "skipped") return "warning"
  return "neutral"
}

export function DuaBotControlPanel({ initialBots, recentRuns, categories, runtimeStatus }: DuaBotControlPanelProps) {
  const [bots, setBots] = useState(initialBots)
  const [draft, setDraft] = useState<BotDraft>(blankDraft)
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [runningId, setRunningId] = useState<number | null>(null)

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories])
  const languageOptions = useMemo(() => getBotLanguageOptions(draft.language), [draft.language])

  const openCreate = () => {
    setDraft(blankDraft)
    setOpen(true)
  }

  const openEdit = (bot: DuaEventBot) => {
    setDraft(draftFromBot(bot))
    setOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    const payload = {
      ...draft,
      targetCategoryId: draft.targetCategoryId === "none" ? null : Number.parseInt(draft.targetCategoryId, 10),
    }
    const result = draft.id ? await updateAdminDuaBot({ ...payload, id: draft.id }) : await createAdminDuaBot(payload)

    if ("error" in result && result.error) {
      toast({ title: "Could not save bot", description: result.error, variant: "destructive" })
    } else {
      toast({ title: draft.id ? "Bot updated" : "Bot created" })
      setOpen(false)
      window.location.reload()
    }
    setIsSaving(false)
  }

  const handleStatus = async (bot: DuaEventBot) => {
    const nextStatus = bot.status === "active" ? "paused" : "active"
    const result = nextStatus === "active" ? await resumeAdminDuaBot(bot.id) : await pauseAdminDuaBot(bot.id)
    if ("error" in result && result.error) {
      toast({ title: "Could not update bot", description: result.error, variant: "destructive" })
      return
    }
    setBots((current) => current.map((item) => (item.id === bot.id ? { ...item, status: nextStatus } : item)))
    toast({ title: nextStatus === "active" ? "Bot resumed" : "Bot paused" })
  }

  const handleRunNow = async (bot: DuaEventBot) => {
    setRunningId(bot.id)
    const result = await runAdminDuaBotNow(bot.id)
    if ("error" in result && result.error) {
      toast({ title: "Bot run failed", description: result.error, variant: "destructive" })
    } else if ("result" in result && result.result) {
      toast({
        title: "Bot run complete",
        description: `${result.result.duasCreated} dua(s) created. ${result.result.errors.length} error(s).`,
      })
      window.location.reload()
    }
    setRunningId(null)
  }

  return (
    <div className="space-y-6">
      <AdminSection
        title="How bots run"
        description="Bots read configured RSS/news feeds, filter events by keyword/category, generate duas with the AI Provider, and save them for review by default."
        action={
          <AdminStatusBadge
            label={runtimeStatus.canGenerateDuas ? "Ready" : "Needs AI Provider"}
            tone={runtimeStatus.canGenerateDuas ? "success" : "warning"}
          />
        }
      >
        <p className="mb-4 text-sm text-muted-foreground">{runtimeStatus.helperText}</p>
        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="font-medium text-foreground">Sources</p>
            <p className="mt-1">Use RSS/news URLs first. Social monitoring needs approved APIs and credentials before adding adapters.</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="font-medium text-foreground">AI Provider</p>
            <p className="mt-1">Configure a supported provider under Admin → Integration → AI Provider for both moderation and bot generation.</p>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <p className="font-medium text-foreground">Cron</p>
            <p className="mt-1">Trigger <span className="font-mono">/api/bots/run</span> with <span className="font-mono">BOT_RUNNER_SECRET</span>.</p>
          </div>
        </div>
      </AdminSection>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Configured bots</h2>
          <p className="text-sm text-muted-foreground">{bots.length} bot{bots.length === 1 ? "" : "s"}</p>
        </div>
        <Button type="button" onClick={openCreate}>Create bot</Button>
      </div>

      {bots.length === 0 ? (
        <AdminEmptyState
          title="No bots yet"
          description="Create a bot with RSS sources and humanitarian keywords to generate event-relevant duas."
          action={<Button type="button" onClick={openCreate}>Create bot</Button>}
        />
      ) : (
        <AdminTableShell>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Bot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Filters</TableHead>
                <TableHead className="hidden lg:table-cell">Schedule</TableHead>
                <TableHead className="hidden xl:table-cell">Last run</TableHead>
                <TableHead className="w-10 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bots.map((bot) => (
                <TableRow key={bot.id}>
                  <TableCell className="max-w-[280px]">
                    <p className="font-medium text-foreground">{bot.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{bot.description || listPreview(bot.source_urls, "No description")}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <AdminStatusBadge label={bot.status} tone={statusTone(bot.status)} />
                      <AdminStatusBadge label={bot.last_status.replace("_", " ")} tone={statusTone(bot.last_status)} />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm">{listPreview(bot.keywords, "All keywords")}</p>
                    <p className="text-xs text-muted-foreground">{listPreview(bot.event_categories, "All categories")}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    <p>Every {bot.frequency_minutes} min</p>
                    <p className="text-xs text-muted-foreground">Next: {formatDate(bot.next_run_at)}</p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm">
                    <p>{formatDate(bot.last_run_at)}</p>
                    {bot.last_error ? <p className="max-w-xs truncate text-xs text-destructive">{bot.last_error}</p> : null}
                    {bot.target_category_id ? <p className="text-xs text-muted-foreground">Posts to {categoryMap.get(bot.target_category_id)}</p> : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminRowActionsMenu
                      disabled={runningId === bot.id}
                      actions={[
                        { label: "Edit", onClick: () => openEdit(bot) },
                        { label: bot.status === "active" ? "Pause" : "Resume", onClick: () => handleStatus(bot) },
                        {
                          label: runningId === bot.id ? "Running…" : "Run now",
                          onClick: () => handleRunNow(bot),
                          disabled: !runtimeStatus.canGenerateDuas,
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableShell>
      )}

      <AdminSection title="Recent runs" description="Latest bot runner outcomes for debugging source, AI, and dedupe behavior.">
        {recentRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bot runs recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">Bot #{run.bot_id} · {formatDate(run.started_at)}</p>
                  <p className="text-muted-foreground">{run.events_found} event(s), {run.duas_created} dua(s)</p>
                  {run.message ? <p className="text-xs text-muted-foreground">{run.message}</p> : null}
                </div>
                <AdminStatusBadge label={run.status} tone={statusTone(run.status)} />
              </div>
            ))}
          </div>
        )}
      </AdminSection>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit dua bot" : "Create dua bot"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bot-name">Name</Label>
              <Input id="bot-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bot-description">Description</Label>
              <Textarea id="bot-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bot-sources">RSS/news source URLs</Label>
              <Textarea id="bot-sources" className="font-mono text-xs" value={draft.sourceUrls} onChange={(event) => setDraft({ ...draft, sourceUrls: event.target.value })} />
              <p className="text-xs text-muted-foreground">One URL per line. Credentialed news/social adapters can be added later.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-keywords">Keywords</Label>
              <Textarea id="bot-keywords" value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-event-categories">Event categories</Label>
              <Textarea id="bot-event-categories" value={draft.eventCategories} onChange={(event) => setDraft({ ...draft, eventCategories: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-frequency">Frequency minutes</Label>
              <Input id="bot-frequency" type="number" min={15} max={10080} value={draft.frequencyMinutes} onChange={(event) => setDraft({ ...draft, frequencyMinutes: Number.parseInt(event.target.value, 10) || 360 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-status">Status</Label>
              <Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as "active" | "paused" })}>
                <SelectTrigger id="bot-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-tone">Tone</Label>
              <Input id="bot-tone" value={draft.tone} onChange={(event) => setDraft({ ...draft, tone: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-language">Language</Label>
              <Select value={draft.language} onValueChange={(value) => setDraft({ ...draft, language: value })}>
                <SelectTrigger id="bot-language"><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  {languageOptions.map((language) => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-target-category">Post category</Label>
              <Select value={draft.targetCategoryId} onValueChange={(value) => setDraft({ ...draft, targetCategoryId: value })}>
                <SelectTrigger id="bot-target-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-publish-mode">Publish mode</Label>
              <Select value={draft.publishMode} onValueChange={(value) => setDraft({ ...draft, publishMode: value as "pending" | "published" })}>
                <SelectTrigger id="bot-publish-mode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending review</SelectItem>
                  <SelectItem value="published">Publish if moderation passes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Save bot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
