'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';

import { parseFeedTopics } from '../feed-languages';
import { updateMyFeedTopicsAction } from '../server/server-actions';
import type { Category } from '../types';

export function FeedTopicPreferences({
  initialTopics,
  topics,
}: {
  initialTopics: number[];
  topics: Category[];
}) {
  const [selected, setSelected] = useState(
    () => new Set(parseFeedTopics(initialTopics)),
  );
  const [isPending, startTransition] = useTransition();

  const toggle = (topicId: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  if (topics.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No topics are available yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-medium">Feed topics</h2>
        <p className="text-muted-foreground text-sm">
          Choose topics you want to see in your community feed. Leave all
          unchecked to see every topic.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {topics.map((topic) => {
          const checked = selected.has(topic.id);
          const id = `feed-topic-${topic.id}`;

          return (
            <label
              key={topic.id}
              htmlFor={id}
              className="border-border flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(topic.id)}
                className="size-4"
              />
              <Label htmlFor={id} className="cursor-pointer font-normal">
                {topic.name}
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
            const result = await updateMyFeedTopicsAction({
              topics: [...selected],
            });

            if (result?.serverError) {
              toast.error(result.serverError);
              return;
            }

            toast.success('Feed topics saved');
          });
        }}
      >
        {isPending ? 'Saving…' : 'Save feed topics'}
      </Button>
    </div>
  );
}
