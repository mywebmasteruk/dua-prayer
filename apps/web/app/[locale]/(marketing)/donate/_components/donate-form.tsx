'use client';

import { useState, useTransition } from 'react';

import { toast } from '@kit/ui/sonner';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';

const PACKAGES = [
  {
    id: 'hosting',
    title: 'Keep DuaPrayer online',
    suggested: 25,
  },
  {
    id: 'development',
    title: "Build what's next",
    suggested: 50,
  },
  {
    id: 'operations',
    title: 'Run the mission',
    suggested: 15,
  },
] as const;

export function DonateForm() {
  const [packageId, setPackageId] = useState<(typeof PACKAGES)[number]['id']>(
    'hosting',
  );
  const [amount, setAmount] = useState(25);
  const [donationType, setDonationType] = useState<'monthly' | 'once'>(
    'monthly',
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            const response = await fetch('/api/donate/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount, packageId, donationType }),
            });
            const payload = (await response.json()) as {
              url?: string;
              error?: string;
            };

            if (!response.ok || !payload.url) {
              toast.error(payload.error || 'Could not start checkout');
              return;
            }

            window.location.href = payload.url;
          } catch {
            toast.error('Could not start checkout');
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label>Impact area</Label>
        <div className="grid gap-2">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                packageId === pkg.id ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                setPackageId(pkg.id);
                setAmount(pkg.suggested);
              }}
            >
              <div className="font-medium">{pkg.title}</div>
              <div className="text-muted-foreground text-xs">
                Suggested ${pkg.suggested}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          max={10000}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          required
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={donationType === 'monthly' ? 'default' : 'outline'}
          onClick={() => setDonationType('monthly')}
        >
          Monthly
        </Button>
        <Button
          type="button"
          size="sm"
          variant={donationType === 'once' ? 'default' : 'outline'}
          onClick={() => setDonationType('once')}
        >
          One-time
        </Button>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Redirecting…' : 'Continue to checkout'}
      </Button>
    </form>
  );
}
