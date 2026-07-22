'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { Bookmark, Flag, HandHeart } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { getTextDirection } from '../detect-language';
import {
  flagDuaAction,
  prayForDuaAction,
  toggleBookmarkAction,
  unflagMyFlagAction,
} from '../server/server-actions';
import type { Dua } from '../types';

interface DuaListProps {
  duas: Dua[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCtaHref?: string;
  emptyCtaLabel?: string;
}

function formatDateTime(value: string) {
  const created = new Date(value);

  if (Number.isNaN(created.getTime())) return '';

  const sameYear = created.getFullYear() === new Date().getFullYear();

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  }).format(created);
}

export function DuaList({
  duas: initialDuas,
  emptyTitle = 'No duas yet',
  emptyDescription = 'Be the first to share a dua with the community.',
  emptyCtaHref,
  emptyCtaLabel,
}: DuaListProps) {
  const router = useRouter();
  const [duas, setDuas] = useState(initialDuas);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDuas(initialDuas);
  }, [initialDuas]);

  if (duas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <h3 className="text-lg font-medium">{emptyTitle}</h3>
        <p className="text-muted-foreground mt-2 text-sm">{emptyDescription}</p>
        {emptyCtaHref && emptyCtaLabel ? (
          <p className="mt-4">
            <Link
              href={emptyCtaHref}
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              {emptyCtaLabel}
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {duas.map((dua) => (
        <li
          key={dua.id}
          id={`dua-${dua.id}`}
          className="bg-background/80 scroll-mt-24 rounded-xl border p-4 shadow-sm"
        >
          <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-xs">
            {dua.category_name ? (
              <span className="bg-muted rounded-full px-2 py-0.5">
                {dua.category_name}
              </span>
            ) : null}
            {dua.channel_handle ? (
              <Link
                href={`/channels/${dua.channel_handle}`}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                @{dua.channel_handle}
                {dua.channel_is_verified ? ' ✓' : ''}
              </Link>
            ) : null}
            <time dateTime={dua.created_at}>{formatDateTime(dua.created_at)}</time>
          </div>

          <p
            className="whitespace-pre-wrap text-base leading-relaxed"
            dir={getTextDirection(dua.text)}
            lang={dua.language ?? undefined}
          >
            {dua.text}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending && pendingId === dua.id}
              className={cn(
                'text-muted-foreground gap-1.5 rounded-full',
                dua.user_has_prayed && 'text-primary',
              )}
              onClick={() => {
                setPendingId(dua.id);
                startTransition(async () => {
                  try {
                    const result = await prayForDuaAction({ duaId: dua.id });

                    if (result?.serverError) {
                      toast.error(result.serverError);
                      return;
                    }

                    const data = result?.data;

                    if (!data) {
                      toast.error('Could not make ameen');
                      return;
                    }

                    setDuas((current) =>
                      current.map((item) =>
                        item.id === dua.id
                          ? {
                              ...item,
                              likes: data.likes,
                              user_has_prayed: true,
                            }
                          : item,
                      ),
                    );

                    if (data.counted) toast.success('Ameen recorded');
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : 'Could not make ameen',
                    );
                  } finally {
                    setPendingId(null);
                  }
                });
              }}
            >
              <HandHeart className="h-4 w-4" />
              <span>Ameen</span>
              <span className="tabular-nums">{dua.likes}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'text-muted-foreground gap-1.5 rounded-full',
                dua.user_has_bookmarked && 'text-primary',
              )}
              onClick={() => {
                startTransition(async () => {
                  try {
                    const result = await toggleBookmarkAction({ id: dua.id });

                    if (result?.serverError) {
                      toast.error(result.serverError);
                      router.push('/auth/sign-in');
                      return;
                    }

                    const bookmarked = result?.data?.bookmarked;

                    if (typeof bookmarked !== 'boolean') return;

                    setDuas((current) =>
                      current.map((item) =>
                        item.id === dua.id
                          ? { ...item, user_has_bookmarked: bookmarked }
                          : item,
                      ),
                    );
                  } catch {
                    router.push('/auth/sign-in');
                  }
                });
              }}
            >
              <Bookmark className="h-4 w-4" />
              <span>Save</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'text-muted-foreground gap-1.5 rounded-full',
                dua.user_has_flagged && 'text-destructive',
              )}
              onClick={() => {
                startTransition(async () => {
                  try {
                    if (dua.user_has_flagged) {
                      const result = await unflagMyFlagAction({ id: dua.id });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        return;
                      }

                      setDuas((current) =>
                        current.map((item) =>
                          item.id === dua.id
                            ? { ...item, user_has_flagged: false }
                            : item,
                        ),
                      );
                      return;
                    }

                    const result = await flagDuaAction({ id: dua.id });

                    if (result?.serverError) {
                      toast.error(result.serverError);
                      router.push('/auth/sign-in');
                      return;
                    }

                    setDuas((current) =>
                      current.map((item) =>
                        item.id === dua.id
                          ? { ...item, user_has_flagged: true }
                          : item,
                      ),
                    );
                    toast.success('Flagged for review');
                  } catch {
                    router.push('/auth/sign-in');
                  }
                });
              }}
            >
              <Flag className="h-4 w-4" />
              <span>Flag</span>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
