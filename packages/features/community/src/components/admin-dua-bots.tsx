'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import type { DuaBotRow } from '../dua-bot-types';
import {
  createDuaBotAction,
  runDuaBotsAction,
  setDuaBotStatusAction,
  updateDuaBotAction,
} from '../server/advanced-actions';

function BotEditForm({
  bot,
  disabled,
  onSaved,
  startTransition,
}: {
  bot: DuaBotRow;
  disabled: boolean;
  onSaved: (bot: DuaBotRow) => void;
  startTransition: (callback: () => Promise<void> | void) => void;
}) {
  const [name, setName] = useState(bot.name);
  const [description, setDescription] = useState(bot.description ?? '');
  const [rssUrlsText, setRssUrlsText] = useState(
    (bot.rss_urls ?? []).join('\n'),
  );
  const [systemPrompt, setSystemPrompt] = useState(bot.system_prompt ?? '');
  const [maxDuasPerRun, setMaxDuasPerRun] = useState(
    String(bot.max_duas_per_run ?? 3),
  );
  const [publishMode, setPublishMode] = useState(
    bot.publish_mode === 'published' ? 'published' : 'pending',
  );
  const [frequencyMinutes, setFrequencyMinutes] = useState(
    String(bot.frequency_minutes ?? 360),
  );

  return (
    <form
      className="mt-3 space-y-3 border-t pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateDuaBotAction({
            botId: bot.id,
            name,
            description,
            rssUrlsText,
            systemPrompt,
            maxDuasPerRun: Number.parseInt(maxDuasPerRun, 10) || 3,
            publishMode: publishMode as 'pending' | 'published',
            frequencyMinutes: Number.parseInt(frequencyMinutes, 10) || 360,
          });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          if (result?.data?.bot) onSaved(result.data.bot);
          toast.success('Bot updated');
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`bot-name-${bot.id}`}>Name</Label>
          <Input
            id={`bot-name-${bot.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={disabled}
            required
            minLength={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`bot-freq-${bot.id}`}>Frequency (minutes)</Label>
          <Input
            id={`bot-freq-${bot.id}`}
            type="number"
            min={15}
            max={10080}
            value={frequencyMinutes}
            onChange={(event) => setFrequencyMinutes(event.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`bot-desc-${bot.id}`}>Description</Label>
        <Input
          id={`bot-desc-${bot.id}`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`bot-rss-${bot.id}`}>RSS URLs (one per line)</Label>
        <Textarea
          id={`bot-rss-${bot.id}`}
          value={rssUrlsText}
          onChange={(event) => setRssUrlsText(event.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="https://example.com/feed.xml"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`bot-prompt-${bot.id}`}>System prompt</Label>
        <Textarea
          id={`bot-prompt-${bot.id}`}
          value={systemPrompt}
          onChange={(event) => setSystemPrompt(event.target.value)}
          disabled={disabled}
          rows={4}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`bot-max-${bot.id}`}>Max duas per run</Label>
          <Input
            id={`bot-max-${bot.id}`}
            type="number"
            min={1}
            max={10}
            value={maxDuasPerRun}
            onChange={(event) => setMaxDuasPerRun(event.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`bot-publish-${bot.id}`}>Publish mode</Label>
          <select
            id={`bot-publish-${bot.id}`}
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            value={publishMode}
            onChange={(event) => setPublishMode(event.target.value)}
            disabled={disabled}
          >
            <option value="pending">Pending review</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <Button type="submit" size="sm" disabled={disabled}>
        Save settings
      </Button>
    </form>
  );
}

export function AdminDuaBots({ bots: initial }: { bots: DuaBotRow[] }) {
  const [bots, setBots] = useState(initial);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <form
        className="space-y-3 rounded-xl border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await createDuaBotAction({
              name,
              description: description || undefined,
            });

            if (result?.serverError) {
              toast.error(result.serverError);
              return;
            }

            const bot = result?.data?.bot;
            if (bot) setBots((current) => [bot, ...current]);
            setName('');
            setDescription('');
            toast.success('Bot created (paused)');
          });
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="bot-name">Name</Label>
          <Input
            id="bot-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bot-description">Description</Label>
          <Input
            id="bot-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating…' : 'Create bot'}
        </Button>
      </form>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await runDuaBotsAction({});

              if (result?.serverError) {
                toast.error(result.serverError);
                return;
              }

              toast.success(
                `Run finished (${result?.data?.botsRun ?? 0} bots, ${result?.data?.duasCreated ?? 0} duas)`,
              );
            });
          }}
        >
          Run due bots
        </Button>
      </div>

      <ul className="space-y-3">
        {bots.length === 0 ? (
          <p className="text-muted-foreground text-sm">No bots yet.</p>
        ) : (
          bots.map((bot) => (
            <li key={bot.id} className="rounded-xl border p-4">
              <div className="font-medium">{bot.name}</div>
              <div className="text-muted-foreground text-sm">
                {bot.status} · every {bot.frequency_minutes}m · last:{' '}
                {bot.last_status}
              </div>
              {bot.description ? (
                <p className="mt-2 text-sm">{bot.description}</p>
              ) : null}
              {bot.last_error ? (
                <p className="text-destructive mt-2 text-sm">{bot.last_error}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    const next =
                      bot.status === 'active' ? 'paused' : 'active';

                    startTransition(async () => {
                      const result = await setDuaBotStatusAction({
                        botId: bot.id,
                        status: next,
                      });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        return;
                      }

                      setBots((current) =>
                        current.map((item) =>
                          item.id === bot.id
                            ? { ...item, status: next }
                            : item,
                        ),
                      );
                    });
                  }}
                >
                  {bot.status === 'active' ? 'Pause' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await runDuaBotsAction({
                        botId: bot.id,
                      });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        return;
                      }

                      const err = result?.data?.errors?.[0]?.message;
                      if (err) {
                        toast.error(err);
                      } else {
                        toast.success(
                          `Created ${result?.data?.duasCreated ?? 0} dua(s)`,
                        );
                      }
                    });
                  }}
                >
                  Run now
                </Button>
              </div>

              <BotEditForm
                bot={bot}
                disabled={isPending}
                startTransition={startTransition}
                onSaved={(updated) => {
                  setBots((current) =>
                    current.map((item) =>
                      item.id === updated.id ? updated : item,
                    ),
                  );
                }}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
