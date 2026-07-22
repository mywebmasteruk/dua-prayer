'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';

import { updateSiteCopyAction } from '../server/advanced-actions';
import type { SiteCopyKey } from '../site-copy';

type CopyRow = {
  key: SiteCopyKey;
  value: string;
  defaultValue: string;
};

export function AdminSiteCopy({ rows }: { rows: CopyRow[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((row) => [row.key, row.value])),
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateSiteCopyAction({ values });

          if (result?.serverError) {
            toast.error(result.serverError);
            return;
          }

          toast.success('Site copy saved');
        });
      }}
    >
      {rows.map((row) => (
        <div key={row.key} className="space-y-2">
          <Label htmlFor={row.key}>{row.key}</Label>
          <Textarea
            id={row.key}
            value={values[row.key] ?? ''}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [row.key]: event.target.value,
              }))
            }
            rows={2}
            placeholder={row.defaultValue}
          />
        </div>
      ))}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save copy'}
      </Button>
    </form>
  );
}
