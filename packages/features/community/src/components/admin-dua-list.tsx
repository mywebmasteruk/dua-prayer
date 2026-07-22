'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import type { PostingMode } from '../posting-settings';
import {
  deleteDuaAction,
  updateDuaStatusAction,
  updatePostingModeAction,
} from '../server/server-actions';
import type { Dua } from '../types';

interface AdminDuaListProps {
  duas: Dua[];
  postingMode: PostingMode;
}

export function AdminDuaList({
  duas: initialDuas,
  postingMode: initialMode,
}: AdminDuaListProps) {
  const [duas, setDuas] = useState(initialDuas);
  const [mode, setMode] = useState<PostingMode>(initialMode);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-xl border p-4">
        <h2 className="font-medium">Posting access</h2>
        <Select
          value={mode}
          onValueChange={(value) => {
            if (!value) return;

            const next = value as PostingMode;
            setMode(next);
            startTransition(async () => {
              const result = await updatePostingModeAction({ mode: next });

              if (result?.serverError) {
                toast.error(result.serverError);
                return;
              }

              toast.success('Posting mode updated');
            });
          }}
        >
          <SelectTrigger className="w-full max-w-md">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Anyone can post</SelectItem>
            <SelectItem value="registered_only">Registered only</SelectItem>
            <SelectItem value="visitor_moderated">
              Visitors held for review
            </SelectItem>
            <SelectItem value="closed">Posting closed</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Moderate duas</h2>
        {duas.length === 0 ? (
          <p className="text-muted-foreground text-sm">No duas yet.</p>
        ) : (
          <ul className="space-y-3">
            {duas.map((dua) => (
              <li key={dua.id} className="rounded-xl border p-4">
                <div className="text-muted-foreground mb-2 flex flex-wrap gap-2 text-xs">
                  <span>{dua.published ? 'Published' : 'Held'}</span>
                  {dua.flagged ? <span>Flagged</span> : null}
                  {dua.category_name ? <span>{dua.category_name}</span> : null}
                </div>
                <p className="whitespace-pre-wrap text-sm">{dua.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await updateDuaStatusAction({
                          duaId: dua.id,
                          published: !dua.published,
                        });

                        if (result?.serverError) {
                          toast.error(result.serverError);
                          return;
                        }

                        setDuas((current) =>
                          current.map((item) =>
                            item.id === dua.id
                              ? {
                                  ...item,
                                  published: !item.published,
                                  flagged: !item.published
                                    ? item.flagged
                                    : false,
                                }
                              : item,
                          ),
                        );
                      });
                    }}
                  >
                    {dua.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await deleteDuaAction({ duaId: dua.id });

                        if (result?.serverError) {
                          toast.error(result.serverError);
                          return;
                        }

                        setDuas((current) =>
                          current.filter((item) => item.id !== dua.id),
                        );
                        toast.success('Dua deleted');
                      });
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
