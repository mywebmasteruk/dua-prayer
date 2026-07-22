'use client';

import { useState, useTransition } from 'react';

import { toast } from '@kit/ui/sonner';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';
import { updateAiModerationSettingsAction } from '@kit/community/server/advanced-actions';

export function AiModerationSettingsForm({
  enabled: initialEnabled,
  model: initialModel,
  baseUrl: initialBaseUrl,
  hasApiKey,
}: {
  enabled: boolean;
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [model, setModel] = useState(initialModel);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [apiKey, setApiKey] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateAiModerationSettingsAction({
            enabled,
            model,
            baseUrl,
            ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
          });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          setApiKey('');
          toast.success('AI moderation settings saved');
        });
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="ai-enabled">Enable AI moderation</Label>
        <Switch
          id="ai-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Local keyword blocking always runs. AI checks run when enabled
        {hasApiKey ? ' (API key configured)' : ' (no API key yet)'}.
      </p>
      <div className="space-y-2">
        <Label htmlFor="ai-model">Model</Label>
        <Input
          id="ai-model"
          value={model}
          onChange={(event) => setModel(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ai-base">Base URL</Label>
        <Input
          id="ai-base"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ai-key">API key</Label>
        <Input
          id="ai-key"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={hasApiKey ? 'Leave blank to keep current key' : 'sk-...'}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save AI settings'}
      </Button>
    </form>
  );
}
