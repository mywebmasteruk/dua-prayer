'use client';

import { useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';

import { isFileAnswer, type FormFileAnswer } from '../form-fields';
import { getApplicationFileUrlAction } from '../server/advanced-actions';

function collectFileAnswers(value: unknown): FormFileAnswer[] {
  if (isFileAnswer(value)) return [value];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectFileAnswers(item));
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      collectFileAnswers(item),
    );
  }

  return [];
}

export function ApplicationFileLinks({
  answers,
}: {
  answers: unknown;
}) {
  const [isPending, startTransition] = useTransition();
  const files = collectFileAnswers(answers);

  if (files.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {files.map((file) => (
        <Button
          key={file.path}
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await getApplicationFileUrlAction({
                path: file.path,
              });

              if (result?.serverError) {
                toast.error(result.serverError);
                return;
              }

              const url = result?.data?.url;
              if (!url) {
                toast.error('Could not open file.');
                return;
              }

              window.open(url, '_blank', 'noopener,noreferrer');
            });
          }}
        >
          Open {file.name || 'file'}
        </Button>
      ))}
    </div>
  );
}
