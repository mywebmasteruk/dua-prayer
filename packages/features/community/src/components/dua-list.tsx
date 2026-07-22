'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import {
  Bookmark,
  Flag,
  HandHeart,
  Sparkles,
  Tag,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { getTextDirection } from '../detect-language';
import { getTopHashtags } from '../hashtags';
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
  onSelectTag?: (tag: string) => void;
  variant?: 'default' | 'shell';
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
  onSelectTag,
  variant = 'default',
}: DuaListProps) {
  const router = useRouter();
  const [duas, setDuas] = useState(initialDuas);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const isShell = variant === 'shell';

  useEffect(() => {
    setDuas(initialDuas);
  }, [initialDuas]);

  if (duas.length === 0) {
    return (
      <div
        className={
          isShell
            ? 'flex flex-col items-center justify-center px-6 py-16 text-center'
            : 'rounded-xl border border-dashed p-8 text-center'
        }
      >
        {isShell ? (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
        ) : null}
        <h3 className="text-lg font-medium">{emptyTitle}</h3>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
          {emptyDescription}
        </p>
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
    <ul className={isShell ? 'space-y-3 bg-white py-3' : 'space-y-4'}>
      {duas.map((dua) => {
        const textDirection = getTextDirection(dua.text);
        const isRtl = textDirection === 'rtl';
        const sourceLabel = dua.user_id ? 'Community member' : 'Anonymous';
        const channelName = dua.channel_name?.trim();
        const channelHandle = dua.channel_handle;
        const headerName = channelName || sourceLabel;

        return (
          <li
            key={dua.id}
            id={`dua-${dua.id}`}
            className={
              isShell
                ? 'group overflow-hidden bg-slate-50/55 px-4 pt-4 shadow-[0_10px_28px_rgba(15,23,42,0.045)] transition hover:bg-slate-50/75 hover:shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:px-5'
                : 'bg-background/80 scroll-mt-24 rounded-xl border p-4 shadow-sm'
            }
          >
            <div
              dir={textDirection}
              className={cn(
                isShell
                  ? 'flex min-w-0 items-center gap-x-2 text-xs text-muted-foreground'
                  : 'text-muted-foreground mb-2 flex flex-wrap items-center gap-2 text-xs',
                isShell && isRtl && 'flex-row-reverse text-right',
              )}
            >
              {isShell ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/15">
                  {channelName ? (
                    channelName.charAt(0).toUpperCase()
                  ) : (
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
              ) : null}

              {channelName && channelHandle ? (
                <Link
                  href={`/channels/${channelHandle}`}
                  className={
                    isShell
                      ? 'truncate text-[13px] font-semibold text-foreground/85 transition hover:text-primary hover:underline'
                      : 'hover:text-foreground underline-offset-2 hover:underline'
                  }
                >
                  {isShell ? headerName : `@${channelHandle}`}
                  {dua.channel_is_verified ? ' ✓' : ''}
                </Link>
              ) : isShell ? (
                <span className="truncate text-[13px] font-semibold text-foreground/80">
                  {headerName}
                </span>
              ) : null}

              {!isShell && dua.category_name ? (
                <span className="bg-muted rounded-full px-2 py-0.5">
                  {dua.category_name}
                </span>
              ) : null}

              {isShell ? (
                <span className="text-muted-foreground/45" aria-hidden="true">
                  ·
                </span>
              ) : null}

              <time
                dateTime={dua.created_at}
                className={
                  isShell
                    ? 'shrink-0 text-[12px] text-muted-foreground'
                    : undefined
                }
                dir="ltr"
              >
                {formatDateTime(dua.created_at)}
              </time>
            </div>

            <p
              className={cn(
                'whitespace-pre-wrap break-words text-foreground',
                isShell
                  ? isRtl
                    ? 'mt-2.5 text-right text-[19px] font-medium leading-8 sm:text-[15px]'
                    : 'mt-2.5 text-[19px] font-medium leading-7 sm:text-[17px] sm:leading-[24.5px]'
                  : 'text-base leading-relaxed',
              )}
              dir={textDirection}
              lang={dua.language ?? undefined}
            >
              {dua.text}
            </p>

            {(() => {
              const tags = getTopHashtags(dua.text, 3);
              if (tags.length === 0 || isShell) return null;

              return (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((hashtag) =>
                    onSelectTag ? (
                      <button
                        key={hashtag.tag}
                        type="button"
                        onClick={() => onSelectTag(hashtag.tag)}
                        className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                      >
                        {hashtag.label}
                      </button>
                    ) : (
                      <Link
                        key={hashtag.tag}
                        href={`?tag=${encodeURIComponent(hashtag.tag)}`}
                        className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                      >
                        {hashtag.label}
                      </Link>
                    ),
                  )}
                </div>
              );
            })()}

            <div
              className={cn(
                isShell
                  ? '-mx-4 mt-4 flex items-center justify-between gap-2 bg-slate-50/65 px-4 py-2.5 opacity-70 transition-opacity duration-150 group-hover:opacity-100 sm:-mx-5 sm:px-5'
                  : 'mt-4 flex flex-wrap items-center gap-1',
                isShell && isRtl && 'flex-row-reverse',
              )}
            >
              {isShell ? (
                <div className="flex shrink-0 items-center">
                  {dua.category_name ? (
                    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary sm:px-2.5 sm:py-0.5">
                      <Tag className="h-4 w-4 shrink-0 sm:hidden" aria-hidden="true" />
                      <span className="hidden sm:inline">{dua.category_name}</span>
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div
                className={
                  isShell
                    ? 'flex flex-1 items-center justify-between sm:flex-none sm:justify-end sm:gap-1'
                    : 'contents'
                }
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending && pendingId === dua.id}
                  className={cn(
                    'text-muted-foreground gap-1.5 rounded-full',
                    isShell &&
                      'h-10 px-2.5 text-primary hover:bg-muted hover:text-primary sm:h-8',
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
                  {isShell ? (
                    <Image
                      src="/logo-icon.png"
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain"
                      aria-hidden="true"
                    />
                  ) : (
                    <HandHeart className="h-4 w-4" />
                  )}
                  {!isShell ? <span>Ameen</span> : null}
                  <span className="text-xs font-semibold tabular-nums">
                    {dua.likes}
                  </span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-muted-foreground gap-1.5 rounded-full',
                    isShell && 'h-10 px-2.5 hover:bg-muted hover:text-primary sm:h-8',
                    dua.user_has_bookmarked && 'text-primary',
                  )}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        const result = await toggleBookmarkAction({
                          id: dua.id,
                        });

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
                  {!isShell ? <span>Save</span> : null}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-muted-foreground gap-1.5 rounded-full',
                    isShell && 'h-10 px-2.5 hover:bg-muted hover:text-primary sm:h-8',
                    dua.user_has_flagged && 'text-destructive',
                  )}
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        if (dua.user_has_flagged) {
                          const result = await unflagMyFlagAction({
                            id: dua.id,
                          });

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
                  {!isShell ? <span>Flag</span> : null}
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
