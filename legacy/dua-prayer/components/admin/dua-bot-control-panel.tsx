"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import {
  createAdminDuaBot,
  deleteAdminDuaBot,
  pauseAdminDuaBot,
  resumeAdminDuaBot,
  runAdminDuaBotNow,
  updateAdminDuaBot,
} from "@/app/actions/admin-bots"
import { AdminEmptyState } from "@/components/admin/admin-empty-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AdminRowActionsMenu } from "@/components/admin/admin-row-actions-menu"
import { AdminSection } from "@/components/admin/admin-section"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminTableShell } from "@/components/admin/admin-table-shell"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { getBotLanguageOptions } from "@/lib/bot-language-options"
import { defaultRetrieveSystemPrompt } from "@/lib/dua-bot-prompt"
import { buildDuplicateDuaBotDraft } from "@/lib/dua-bot-duplicates"
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
  systemPrompt: string
  status: "active" | "paused"
  sourceUrls: string
  keywords: string
  frequencyMinutes: number
  maxDuasPerRun: number
  tone: string
  language: string
  targetCategoryId: string
  webSearchEnabled: boolean
  publishMode: "pending" | "published"
}

const blankDraft: BotDraft = {
  name: "",
  description: "",
  // A starting template the admin can keep or edit. Nothing is hardcoded at
  // runtime — the engine sends exactly what's in this field (+ the JSON contract).
  systemPrompt: defaultRetrieveSystemPrompt({ language: "English" }),
  status: "paused",
  sourceUrls: "https://www.aljazeera.com/xml/rss/all.xml",
  keywords: "earthquake, flood, wildfire, conflict, refugees, disaster",
  frequencyMinutes: 360,
  maxDuasPerRun: 3,
  tone: "compassionate",
  language: "English",
  targetCategoryId: "none",
  webSearchEnabled: false,
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
    systemPrompt: bot.system_prompt ?? "",
    status: bot.status,
    sourceUrls: bot.source_urls.join("\n"),
    keywords: bot.keywords.join(", "),
    frequencyMinutes: bot.frequency_minutes,
    maxDuasPerRun: bot.max_duas_per_run,
    tone: bot.tone,
    language: bot.language,
    targetCategoryId: bot.auto_categorize ? "auto" : bot.target_category_id?.toString() ?? "none",
    webSearchEnabled: bot.web_search_enabled,
    publishMode: bot.publish_mode,
  }
}

function duplicateDraftFromBot(bot: DuaEventBot): BotDraft {
  const draft = buildDuplicateDuaBotDraft(bot)

  return {
    name: draft.name,
    description: draft.description ?? "",
    systemPrompt: draft.systemPrompt ?? "",
    status: "paused",
    sourceUrls: Array.isArray(draft.rssUrls) ? draft.rssUrls.join("\n") : (draft.rssUrls ?? ""),
    keywords: Array.isArray(draft.keywords) ? draft.keywords.join(", ") : (draft.keywords ?? ""),
    frequencyMinutes: draft.frequencyMinutes ?? 360,
    maxDuasPerRun: draft.maxDuasPerRun ?? 3,
    tone: draft.tone ?? "compassionate",
    language: draft.language ?? "English",
    targetCategoryId: draft.autoCategorize ? "auto" : draft.targetCategoryId?.toString() ?? "none",
    webSearchEnabled: draft.webSearchEnabled ?? false,
    publishMode: draft.publishMode ?? "pending",
  }
}

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "active" || status === "success") return "success"
  if (status === "error") return "danger"
  if (status === "paused" || status === "skipped") return "warning"
  return "neutral"
}

// Render a run message, turning any http(s) URL it contains into a clickable link
// (e.g. the web-search source a fallback dua was found at).
function renderRunMessage(message: string) {
  return message.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="break-all underline underline-offset-2 hover:text-foreground"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

export function DuaBotControlPanel({ initialBots, recentRuns, categories, runtimeStatus }: DuaBotControlPanelProps) {
  const router = useRouter()
  const [bots, setBots] = useState(initialBots)
  const [draft, setDraft] = useState<BotDraft>(blankDraft)
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [runningId, setRunningId] = useState<number | null>(null)
  const [deletingBot, setDeletingBot] = useState<DuaEventBot | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories])
  const languageOptions = useMemo(() => getBotLanguageOptions(draft.language), [draft.language])

  useEffect(() => {
    setBots(initialBots)
  }, [initialBots])

  const openCreate = () => {
    setDraft(blankDraft)
    setOpen(true)
  }

  const openEdit = (bot: DuaEventBot) => {
    setDraft(draftFromBot(bot))
    setOpen(true)
  }

  const handleSave = async () => {
    if (!draft.systemPrompt.trim()) {
      toast({ title: "System prompt is required", description: "Add a prompt or click “Load default template”.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    const autoCategorize = draft.targetCategoryId === "auto"
    const payload = {
      ...draft,
      autoCategorize,
      targetCategoryId:
        autoCategorize || draft.targetCategoryId === "none" ? null : Number.parseInt(draft.targetCategoryId, 10),
    }
    const result = draft.id ? await updateAdminDuaBot({ ...payload, id: draft.id }) : await createAdminDuaBot(payload)

    if ("error" in result && result.error) {
      toast({ title: "Could not save bot", description: result.error, variant: "destructive" })
    } else {
      toast({ title: draft.id ? "Bot updated" : "Bot created" })
      setOpen(false)
      router.refresh()
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
      router.refresh()
    }
    setRunningId(null)
  }

  const openDuplicate = (bot: DuaEventBot) => {
    setDraft(duplicateDraftFromBot(bot))
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBot) return

    setDeletingId(deletingBot.id)
    const result = await deleteAdminDuaBot(deletingBot.id)
    setDeletingId(null)

    if ("error" in result && result.error) {
      toast({ title: "Could not delete bot", description: result.error, variant: "destructive" })
      return
    }

    setBots((current) => current.filter((bot) => bot.id !== deletingBot.id))
    setDeletingBot(null)
    toast({ title: "Bot deleted", description: "Bot configuration and run logs were removed. Generated duas were kept." })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <AdminSection
        title="How bots run"
        description="Bots read configured sources (RSS/Atom feeds or website pages), filter events by keyword/category, generate duas with the AI Provider, and save them for review by default."
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
            <p className="mt-1">Add RSS/Atom feed URLs or website page URLs. Feeds are read item-by-item; web pages are read as a single headline.</p>
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
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    <p>Every {bot.frequency_minutes} min</p>
                    <p className="text-xs text-muted-foreground">Next: {formatDate(bot.next_run_at)}</p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm">
                    <p>{formatDate(bot.last_run_at)}</p>
                    {bot.last_error ? <p className="max-w-xs truncate text-xs text-destructive">{bot.last_error}</p> : null}
                    {bot.auto_categorize ? <p className="text-xs text-muted-foreground">Auto-categorised by AI</p> : bot.target_category_id ? <p className="text-xs text-muted-foreground">Posts to {categoryMap.get(bot.target_category_id)}</p> : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminRowActionsMenu
                      disabled={runningId === bot.id}
                      actions={[
                        { label: "Edit", onClick: () => openEdit(bot) },
                        { label: "Duplicate", onClick: () => openDuplicate(bot) },
                        { label: bot.status === "active" ? "Pause" : "Resume", onClick: () => handleStatus(bot) },
                        {
                          label: runningId === bot.id ? "Running…" : "Run now",
                          onClick: () => handleRunNow(bot),
                          disabled: !runtimeStatus.canGenerateDuas,
                        },
                        {
                          label: "Delete",
                          onClick: () => setDeletingBot(bot),
                          destructive: true,
                          separatorBefore: true,
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
            {recentRuns.map((run) => {
              const runBotName = bots.find((b) => b.id === run.bot_id)?.name ?? `Bot #${run.bot_id}`
              return (
              <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{runBotName} · {formatDate(run.started_at)}</p>
                  <p className="text-muted-foreground">{run.events_found} event(s), {run.duas_created} dua(s)</p>
                  {run.message ? <p className="text-xs text-muted-foreground">{renderRunMessage(run.message)}</p> : null}
                </div>
                <AdminStatusBadge label={run.status} tone={statusTone(run.status)} />
              </div>
              )
            })}
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
              <Label htmlFor="bot-description">User prompt / instructions</Label>
              <Textarea id="bot-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              <p className="text-xs text-muted-foreground">Guides the dua content this bot generates, such as who to focus on and what kind of support to encourage.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="bot-system-prompt">System prompt *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      systemPrompt: defaultRetrieveSystemPrompt({
                        language: draft.language,
                        keywords: draft.keywords.split(/[\n,]/).map((k) => k.trim()).filter(Boolean),
                      }),
                    })
                  }
                >
                  Load default template
                </Button>
              </div>
              <Textarea
                id="bot-system-prompt"
                rows={10}
                value={draft.systemPrompt}
                onChange={(event) => setDraft({ ...draft, systemPrompt: event.target.value })}
                placeholder="Describe what dua to pick, the output language, tone, hashtag style, and what to avoid."
              />
              <p className="text-xs text-muted-foreground">
                This is the entire system prompt sent to the AI — exactly as written, nothing hardcoded or overridden.
                The app only appends one hidden technical line for the JSON output format. Use “Load default template”
                for a recommended starting point for the selected language.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bot-sources">Sources</Label>
              <Textarea id="bot-sources" className="font-mono text-xs" value={draft.sourceUrls} onChange={(event) => setDraft({ ...draft, sourceUrls: event.target.value })} />
              <p className="text-xs text-muted-foreground">One URL per line. Each can be an RSS/Atom feed or a website page — feeds are read item-by-item, web pages are read as a single headline.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-keywords">Keywords</Label>
              <Textarea id="bot-keywords" value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-frequency">Frequency minutes</Label>
              <Input id="bot-frequency" type="number" min={15} max={10080} value={draft.frequencyMinutes} onChange={(event) => setDraft({ ...draft, frequencyMinutes: Number.parseInt(event.target.value, 10) || 360 })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bot-max-duas">Max duas per run</Label>
              <Input id="bot-max-duas" type="number" min={1} max={10} value={draft.maxDuasPerRun} onChange={(event) => setDraft({ ...draft, maxDuasPerRun: Number.parseInt(event.target.value, 10) || 3 })} />
              <p className="text-xs text-muted-foreground">How many new duas the bot may create in a single run (1–10). Defaults to 3.</p>
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
              <Label htmlFor="bot-target-category">Post topic</Label>
              <Select value={draft.targetCategoryId} onValueChange={(value) => setDraft({ ...draft, targetCategoryId: value })}>
                <SelectTrigger id="bot-target-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No topic</SelectItem>
                  <SelectItem value="auto">Automatic (AI chooses)</SelectItem>
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
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="bot-web-search"
                  checked={draft.webSearchEnabled}
                  onCheckedChange={(checked) => setDraft({ ...draft, webSearchEnabled: checked === true })}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="bot-web-search">Allow web search (Tavily)</Label>
                  <p className="text-xs text-muted-foreground">
                    Search the sources first; if they have nothing new, search the web for an authentic
                    dua so the bot still posts. When off, the bot uses the sources only and skips when
                    they are exhausted.
                  </p>
                </div>
              </div>
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

      <AlertDialog open={!!deletingBot} onOpenChange={(open) => !open && setDeletingBot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bot?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-medium text-foreground">{deletingBot?.name}</span>? This removes the bot
              configuration, run history, and event links. Generated dua posts will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId === deletingBot?.id}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingId === deletingBot?.id}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deletingId === deletingBot?.id ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
