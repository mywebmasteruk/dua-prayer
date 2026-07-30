'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition, type ReactNode } from 'react';

import {
  Bookmark,
  Flag,
  HandHeart,
  Heart,
  Share2,
  Sparkles,
  Tag,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { cn } from '@kit/ui/utils';

import {
  arabicFontClassName,
  arabicTextSegmentPattern,
  getArabicOnlyFontClassName,
  getTextDirection,
  hasArabicText,
  isLatinScriptLanguage,
} from '../detect-language';
import {
  buildDuaShareUrl,
  type DuaSharePlatform,
} from '../dua-share';
import { getTopHashtags } from '../hashtags';
import {
  flagDuaAction,
  prayForDuaAction,
  toggleBookmarkAction,
  unflagMyFlagAction,
} from '../server/server-actions';
import type { Dua } from '../types';
import { VerifiedChannelBadge } from './verified-channel-badge';

interface DuaListProps {
  duas: Dua[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCtaHref?: string;
  emptyCtaLabel?: string;
  onSelectTag?: (tag: string) => void;
  variant?: 'default' | 'shell';
}

const sharePlatforms = [
  { id: 'whatsapp' as const, label: 'WhatsApp', className: 'text-[#25D366]' },
  { id: 'telegram' as const, label: 'Telegram', className: 'text-[#26A5E4]' },
  { id: 'twitter' as const, label: 'X', className: 'text-foreground' },
  { id: 'facebook' as const, label: 'Facebook', className: 'text-[#1877F2]' },
];

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

function renderWithArabicFont(text: string): ReactNode[] {
  return text.split(arabicTextSegmentPattern).map((segment, index) =>
    hasArabicText(segment) ? (
      <span key={`${segment}-${index}`} className={arabicFontClassName}>
        {segment}
      </span>
    ) : (
      segment
    ),
  );
}

function SharePlatformIcon({ platform }: { platform: DuaSharePlatform }) {
  const iconClass = 'h-4 w-4';

  switch (platform) {
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default: {
      const exhaustive: never = platform;
      return exhaustive;
    }
  }
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
  const [lovedDuas, setLovedDuas] = useState<Record<number, boolean>>({});
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
        const isLatinScript = isLatinScriptLanguage(dua.language, dua.text);
        const sourceLabel = dua.user_id ? 'Community member' : 'Anonymous';
        const channelName = dua.channel_name?.trim();
        const channelHandle = dua.channel_handle;
        const headerName = channelName || sourceLabel;
        const isLoved = Boolean(lovedDuas[dua.id]);

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
                <>
                  <Link
                    href={`/channels/${channelHandle}`}
                    className={
                      isShell
                        ? 'truncate text-[13px] font-semibold text-foreground/85 transition hover:text-primary hover:underline'
                        : 'hover:text-foreground underline-offset-2 hover:underline'
                    }
                  >
                    {isShell ? headerName : `@${channelHandle}`}
                  </Link>
                  {dua.channel_is_verified ? <VerifiedChannelBadge /> : null}
                </>
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
                isLatinScript && isShell && 'font-[Georgia,Cambria,"Times_New_Roman",Times,serif]',
                getArabicOnlyFontClassName(dua.text),
              )}
              dir={textDirection}
              lang={dua.language ?? undefined}
            >
              {renderWithArabicFont(dua.text)}
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
                      <Tag
                        className="h-4 w-4 shrink-0 sm:hidden"
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">
                        {dua.category_name}
                      </span>
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
                  aria-label={
                    dua.user_has_prayed
                      ? `Prayed ${dua.likes} times`
                      : `Make ameen for this dua, ${dua.likes} ameens so far`
                  }
                  onClick={() => {
                    setPendingId(dua.id);
                    startTransition(async () => {
                      try {
                        const result = await prayForDuaAction({
                          duaId: dua.id,
                        });

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

                {isShell ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-10 gap-1.5 rounded-full px-2.5 text-muted-foreground hover:bg-muted hover:text-primary sm:h-8',
                      isLoved && 'text-primary',
                    )}
                    aria-pressed={isLoved}
                    aria-label={isLoved ? 'Remove love from this dua' : 'Love this dua'}
                    onClick={() =>
                      setLovedDuas((previous) => ({
                        ...previous,
                        [dua.id]: !previous[dua.id],
                      }))
                    }
                  >
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    <span className="text-xs font-semibold tabular-nums">
                      {isLoved ? 1 : 0}
                    </span>
                  </Button>
                ) : null}

                {isShell ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 gap-1.5 rounded-full px-2.5 text-muted-foreground hover:bg-muted hover:text-primary sm:h-8"
                          aria-label="Share dua"
                        >
                          <Share2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="min-w-0 p-2">
                      <div className="flex items-center gap-1">
                        {sharePlatforms.map((platform) => (
                          <DropdownMenuItem
                            key={platform.id}
                            className={cn(
                              'size-9 justify-center p-0',
                              platform.className,
                            )}
                            aria-label={platform.label}
                            onClick={() => {
                              window.open(
                                buildDuaShareUrl(platform.id, dua),
                                '_blank',
                                'noopener,noreferrer',
                              );
                            }}
                          >
                            <SharePlatformIcon platform={platform.id} />
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-muted-foreground gap-1.5 rounded-full',
                    isShell &&
                      'h-10 px-2.5 hover:bg-muted hover:text-primary sm:h-8',
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
                    isShell &&
                      'h-10 px-2.5 hover:bg-muted hover:text-primary sm:h-8',
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
