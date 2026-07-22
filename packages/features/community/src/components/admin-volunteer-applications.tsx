'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';

import { reviewVolunteerApplicationAction } from '../server/advanced-actions';
import { ApplicationFileLinks } from './application-file-links';

type Application = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
  payload?: unknown;
};

function payloadAnswers(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  return record.answers ?? payload;
}

export function AdminVolunteerApplications({
  applications: initial,
}: {
  applications: Application[];
}) {
  const [applications, setApplications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="space-y-3">
      {applications.length === 0 ? (
        <p className="text-muted-foreground text-sm">No volunteer applications.</p>
      ) : (
        applications.map((app) => (
          <li key={app.id} className="rounded-xl border p-4">
            <div className="font-medium">{app.name}</div>
            <div className="text-muted-foreground text-sm">
              {app.email} · {app.status}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{app.message}</p>
            <ApplicationFileLinks answers={payloadAnswers(app.payload)} />
            {app.status === 'pending' ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await reviewVolunteerApplicationAction({
                        applicationId: app.id,
                        decision: 'approved',
                      });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        return;
                      }

                      setApplications((current) =>
                        current.map((item) =>
                          item.id === app.id
                            ? { ...item, status: 'approved' }
                            : item,
                        ),
                      );
                    });
                  }}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await reviewVolunteerApplicationAction({
                        applicationId: app.id,
                        decision: 'rejected',
                      });

                      if (result?.serverError) {
                        toast.error(result.serverError);
                        return;
                      }

                      setApplications((current) =>
                        current.map((item) =>
                          item.id === app.id
                            ? { ...item, status: 'rejected' }
                            : item,
                        ),
                      );
                    });
                  }}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </li>
        ))
      )}
    </ul>
  );
}
