'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';

import {
  FEED_LANGUAGE_OPTIONS,
  parseFeedLanguages,
} from '../feed-languages';
import { updateMyFeedLanguagesAction } from '../server/server-actions';

export function FeedLanguagePreferences({
  initialLanguages,
}: {
  initialLanguages: string[];
}) {
  const [selected, setSelected] = useState(() =>
    new Set(parseFeedLanguages(initialLanguages)),
  );
  const [isPending, startTransition] = useTransition();

  const toggle = (code: string) => {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(code)) next.delete(code);
      else next.add(code);

      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-medium">Feed languages</h2>
        <p className="text-muted-foreground text-sm">
          Choose which languages to show in your community feed. Leave all
          unchecked to see every language.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {FEED_LANGUAGE_OPTIONS.map((option) => {
          const checked = selected.has(option.code);
          const id = `feed-lang-${option.code}`;

          return (
            <label
              key={option.code}
              htmlFor={id}
              className="border-border flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option.code)}
                className="size-4"
              />
              <Label htmlFor={id} className="cursor-pointer font-normal">
                {option.label}
              </Label>
            </label>
          );
        })}
      </div>

      <Button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await updateMyFeedLanguagesAction({
              languages: [...selected],
            });

            if (result?.serverError) {
              toast.error(result.serverError);
              return;
            }

            toast.success('Feed languages saved');
          });
        }}
      >
        {isPending ? 'Saving…' : 'Save feed languages'}
      </Button>
    </div>
  );
}
