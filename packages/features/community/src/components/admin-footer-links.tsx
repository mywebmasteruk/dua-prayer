'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

import type { FooterLink } from '../footer-links';
import { updateFooterLinksAction } from '../server/advanced-actions';

function emptyLink(): FooterLink {
  return { label: '', href: '', openInNewTab: false };
}

export function AdminFooterLinks({ links: initial }: { links: FooterLink[] }) {
  const [links, setLinks] = useState<FooterLink[]>(
    initial.length > 0 ? initial : [emptyLink()],
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateFooterLinksAction({ links });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success('Footer links saved');
        });
      }}
    >
      <ul className="space-y-3">
        {links.map((link, index) => (
          <li key={index} className="space-y-2 rounded-xl border p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`footer-label-${index}`}>Label</Label>
                <Input
                  id={`footer-label-${index}`}
                  value={link.label}
                  onChange={(event) =>
                    setLinks((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, label: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`footer-href-${index}`}>URL</Label>
                <Input
                  id={`footer-href-${index}`}
                  value={link.href}
                  onChange={(event) =>
                    setLinks((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, href: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-muted-foreground flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={link.openInNewTab}
                  onChange={(event) =>
                    setLinks((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, openInNewTab: event.target.checked }
                          : item,
                      ),
                    )
                  }
                />
                Open in new tab
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setLinks((current) =>
                    current.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLinks((current) => [...current, emptyLink()])}
        >
          Add link
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save footer links'}
        </Button>
      </div>
    </form>
  );
}
