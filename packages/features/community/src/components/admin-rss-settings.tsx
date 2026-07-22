'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';

import type { RssSettings } from '../rss-settings';
import { updateRssSettingsAction } from '../server/advanced-actions';
import type { ChannelItem } from '../types';

export function AdminRssSettings({
  settings,
  channels,
}: {
  settings: RssSettings;
  channels: ChannelItem[];
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [itemCount, setItemCount] = useState(settings.itemCount);
  const [includeChannelPosts, setIncludeChannelPosts] = useState(
    settings.includeChannelPosts,
  );
  const [includeFreeformDuas, setIncludeFreeformDuas] = useState(
    settings.includeFreeformDuas,
  );
  const [onlyVerifiedChannels, setOnlyVerifiedChannels] = useState(
    settings.onlyVerifiedChannels,
  );
  const [excludedChannelIds, setExcludedChannelIds] = useState(
    () => new Set(settings.excludedChannelIds),
  );
  const [isPending, startTransition] = useTransition();

  const toggleExcluded = (channelId: number) => {
    setExcludedChannelIds((current) => {
      const next = new Set(current);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });
  };

  return (
    <form
      className="space-y-5 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateRssSettingsAction({
            enabled,
            itemCount,
            includeChannelPosts,
            includeFreeformDuas,
            onlyVerifiedChannels,
            excludedChannelIds: [...excludedChannelIds],
          });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success('RSS settings saved');
        });
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="rss-enabled">Enable /feed.xml and /feed-tags.xml</Label>
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

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Sources</p>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rss-freeform">Include community duas (no channel)</Label>
          <Switch
            id="rss-freeform"
            checked={includeFreeformDuas}
            onCheckedChange={setIncludeFreeformDuas}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rss-channels">Include channel posts</Label>
          <Switch
            id="rss-channels"
            checked={includeChannelPosts}
            onCheckedChange={setIncludeChannelPosts}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="rss-verified">Only verified channels</Label>
          <Switch
            id="rss-verified"
            checked={onlyVerifiedChannels}
            onCheckedChange={setOnlyVerifiedChannels}
            disabled={!includeChannelPosts}
          />
        </div>
      </div>

      {includeChannelPosts && channels.length > 0 ? (
        <div className="space-y-3 border-t pt-4">
          <div>
            <p className="text-sm font-medium">Exclude channels</p>
            <p className="text-muted-foreground text-xs">
              Checked channels are omitted from the public RSS feeds.
            </p>
          </div>
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {channels.map((channel) => {
              const id = `rss-exclude-${channel.id}`;
              const checked = excludedChannelIds.has(channel.id);

              return (
                <li key={channel.id}>
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExcluded(channel.id)}
                      className="size-4"
                    />
                    <span>
                      {channel.name}
                      <span className="text-muted-foreground">
                        {' '}
                        @{channel.handle}
                        {channel.isVerified ? ' ✓' : ''}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save RSS settings'}
      </Button>
    </form>
  );
}
