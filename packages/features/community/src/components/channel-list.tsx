'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { UserCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@kit/ui/button';

import {
  followChannelAction,
  unfollowChannelAction,
} from '../server/server-actions';
import type { ChannelItem } from '../types';
import { VerifiedChannelBadge } from './verified-channel-badge';

interface ChannelListProps {
  channels: ChannelItem[];
  followedIds: number[];
}

export function ChannelList({
  channels,
  followedIds: initialFollowedIds,
}: ChannelListProps) {
  const router = useRouter();
  const [followedIds, setFollowedIds] = useState(new Set(initialFollowedIds));
  const [isPending, startTransition] = useTransition();

  if (channels.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <h2 className="text-lg font-medium">No channels yet</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Community channels will appear here as spaces open for shared duas.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border">
      {channels.map((channel) => {
        const following = followedIds.has(channel.id);

        return (
          <li
            key={channel.id}
            className="flex items-start justify-between gap-3 p-4"
          >
            <Link href={`/channels/${channel.handle}`} className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">{channel.name}</h3>
                {channel.isVerified ? <VerifiedChannelBadge /> : null}
              </div>
              <p className="text-muted-foreground text-sm">@{channel.handle}</p>
              {channel.description ? (
                <p className="mt-1 line-clamp-2 text-sm">{channel.description}</p>
              ) : null}
              <p className="text-muted-foreground mt-2 text-xs">
                {channel.duaCount} duas · {channel.ameenCount} ameens
              </p>
            </Link>

            <Button
              type="button"
              size="sm"
              variant={following ? 'outline' : 'default'}
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  try {
                    if (following) {
                      const result = await unfollowChannelAction({
                        id: channel.id,
                      });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        router.push('/auth/sign-in');
                        return;
                      }

                      setFollowedIds((current) => {
                        const next = new Set(current);
                        next.delete(channel.id);
                        return next;
                      });
                    } else {
                      const result = await followChannelAction({
                        id: channel.id,
                      });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        router.push('/auth/sign-in');
                        return;
                      }

                      setFollowedIds((current) => new Set(current).add(channel.id));
                    }
                  } catch {
                    router.push('/auth/sign-in');
                  }
                });
              }}
            >
              {following ? (
                <>
                  <UserCheck className="mr-1 h-4 w-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="mr-1 h-4 w-4" />
                  Follow
                </>
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
