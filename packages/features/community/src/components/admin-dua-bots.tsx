'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

import type { DuaBotRow } from '../dua-bot-types';
import {
  createDuaBotAction,
  runDuaBotsStubAction,
  setDuaBotStatusAction,
} from '../server/advanced-actions';

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
              const result = await runDuaBotsStubAction({});

              if (result?.serverError) {
                toast.error(result.serverError);
                return;
              }

              toast.success(
                `Stub run finished (${result?.data?.ran ?? 0} bots)`,
              );
            });
          }}
        >
          Run due bots (stub)
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
                      const result = await runDuaBotsStubAction({
                        botId: bot.id,
                      });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        return;
                      }

                      toast.success('Stub run recorded');
                    });
                  }}
                >
                  Run stub
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
