'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';

import { updateRssSettingsAction } from '../server/advanced-actions';

export function AdminRssSettings({
  enabled: initialEnabled,
  itemCount: initialCount,
}: {
  enabled: boolean;
  itemCount: number;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [itemCount, setItemCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateRssSettingsAction({ enabled, itemCount });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success('RSS settings saved');
        });
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="rss-enabled">Enable /feed.xml</Label>
        <Switch
          id="rss-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rss-count">Item count</Label>
        <Input
          id="rss-count"
          type="number"
          min={5}
          max={50}
          value={itemCount}
          onChange={(event) => setItemCount(Number(event.target.value))}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save RSS settings'}
      </Button>
    </form>
  );
}
