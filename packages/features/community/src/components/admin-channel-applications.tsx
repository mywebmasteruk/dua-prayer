'use client';

import { useState, useTransition } from 'react';

import { toast } from 'sonner';

import { Button } from '@kit/ui/button';

import { reviewChannelApplicationAction } from '../server/advanced-actions';

type Application = {
  id: number;
  name: string;
  handle: string | null;
  description: string;
  status: string;
  created_at: string;
};

export function AdminChannelApplications({
  applications: initial,
}: {
  applications: Application[];
}) {
  const [applications, setApplications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="space-y-3">
      {applications.length === 0 ? (
        <p className="text-muted-foreground text-sm">No channel applications.</p>
      ) : (
        applications.map((app) => (
          <li key={app.id} className="rounded-xl border p-4">
            <div className="font-medium">{app.name}</div>
            <div className="text-muted-foreground text-sm">
              @{app.handle} · {app.status}
            </div>
            {app.description ? (
              <p className="mt-2 text-sm">{app.description}</p>
            ) : null}
            {app.status === 'pending_review' ? (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await reviewChannelApplicationAction({
                        channelId: app.id,
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
                      const result = await reviewChannelApplicationAction({
                        channelId: app.id,
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
