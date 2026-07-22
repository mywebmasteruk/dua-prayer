'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';
import { Textarea } from '@kit/ui/textarea';

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
  const [title, setTitle] = useState(settings.title);
  const [description, setDescription] = useState(settings.description);
  const [author, setAuthor] = useState(settings.author);
  const [copyright, setCopyright] = useState(settings.copyright);
  const [language, setLanguage] = useState(settings.language);
  const [ttlMinutes, setTtlMinutes] = useState(settings.ttlMinutes);
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
            title,
            description,
            author,
            copyright,
            language,
            ttlMinutes,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="rss-title">Feed title</Label>
          <Input
            id="rss-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="rss-description">Feed description</Label>
          <Textarea
            id="rss-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rss-author">Managing editor</Label>
          <Input
            id="rss-author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            maxLength={160}
            placeholder="optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rss-copyright">Copyright</Label>
          <Input
            id="rss-copyright"
            value={copyright}
            onChange={(event) => setCopyright(event.target.value)}
            maxLength={160}
            placeholder="optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rss-language">Language</Label>
          <Input
            id="rss-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            maxLength={16}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rss-ttl">TTL (minutes)</Label>
          <Input
            id="rss-ttl"
            type="number"
            min={1}
            max={1440}
            value={ttlMinutes}
            onChange={(event) => setTtlMinutes(Number(event.target.value))}
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
