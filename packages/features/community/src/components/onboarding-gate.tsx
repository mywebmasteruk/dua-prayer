'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Check } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { FEED_LANGUAGE_OPTIONS } from '../feed-languages';
import {
  completeOnboardingAction,
  followChannelAction,
  unfollowChannelAction,
} from '../server/server-actions';
import type { Category, ChannelItem } from '../types';

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-transparent bg-primary/15 text-primary'
          : 'text-muted-foreground border-border hover:bg-muted',
      )}
    >
      {active ? <Check className="size-3.5" aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

const STEPS = ['languages', 'topics', 'follow'] as const;

export function OnboardingGate({
  topicCategories,
  followSuggestions,
  initialFollowedIds = [],
}: {
  topicCategories: Category[];
  followSuggestions: ChannelItem[];
  initialFollowedIds?: number[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [languages, setLanguages] = useState(() => new Set<string>());
  const [topics, setTopics] = useState(() => new Set<number>());
  const [followedIds, setFollowedIds] = useState(
    () => new Set(initialFollowedIds),
  );
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  const finish = (savePrefs: boolean) => {
    startTransition(async () => {
      const result = await completeOnboardingAction({
        languages: savePrefs ? [...languages] : undefined,
        topics: savePrefs ? [...topics] : undefined,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  };

  const toggleFollow = (channelId: number) => {
    startTransition(async () => {
      const currentlyFollowed = followedIds.has(channelId);
      const result = currentlyFollowed
        ? await unfollowChannelAction({ id: channelId })
        : await followChannelAction({ id: channelId });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      setFollowedIds((current) => toggle(current, channelId));
    });
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 px-0 py-0 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-background flex max-h-[calc(100svh-1rem)] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl border p-5 shadow-xl sm:max-h-[calc(100svh-5rem)] sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-primary text-sm font-medium">Welcome to DuaPrayer</p>
            <h2
              id="onboarding-title"
              className="mt-1 text-xl font-semibold tracking-tight"
            >
              {step === 0
                ? 'Which languages do you read?'
                : step === 1
                  ? 'What would you like duas about?'
                  : 'Follow channels to build your feed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={isPending}
            className="text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-full px-3 py-1 text-sm font-medium"
          >
            Skip
          </button>
        </div>

        <div className="mt-5 min-h-[140px]">
          {step === 0 ? (
            <div className="flex flex-wrap gap-2">
              {FEED_LANGUAGE_OPTIONS.map((option) => (
                <Pill
                  key={option.code}
                  label={option.label}
                  active={languages.has(option.code)}
                  onClick={() => setLanguages((current) => toggle(current, option.code))}
                />
              ))}
            </div>
          ) : step === 1 ? (
            <div className="flex flex-wrap gap-2">
              {topicCategories.map((topic) => (
                <Pill
                  key={topic.id}
                  label={topic.name}
                  active={topics.has(topic.id)}
                  onClick={() => setTopics((current) => toggle(current, topic.id))}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {followSuggestions.map((channel) => (
                <Pill
                  key={channel.id}
                  label={channel.name}
                  active={followedIds.has(channel.id)}
                  onClick={() => toggleFollow(channel.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((item, index) => (
              <span
                key={item}
                className={cn(
                  'h-1.5 w-6 rounded-full',
                  index === step ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((current) => current - 1)}
                disabled={isPending}
              >
                Back
              </Button>
            ) : null}
            {isLast ? (
              <Button
                type="button"
                onClick={() => finish(true)}
                disabled={isPending}
              >
                {isPending ? 'Finishing…' : 'Done'}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep((current) => current + 1)}
                disabled={isPending}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
