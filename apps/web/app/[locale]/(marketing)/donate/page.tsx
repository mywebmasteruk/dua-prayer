import { DonateForm } from './_components/donate-form';

export const generateMetadata = async () => {
  return {
    title: 'Support DuaPrayer',
    description: 'Optional donations help keep this community space running.',
  };
};

async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  const appUrlReady = Boolean(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim(),
  );

  return (
    <div className="container mx-auto max-w-xl space-y-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
        <p className="text-muted-foreground text-sm">
          Optional donations help keep DuaPrayer online for the community.
        </p>
      </header>

      {params.success ? (
        <p className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm">
          Thank you for your support.
        </p>
      ) : null}

      {params.canceled ? (
        <p className="text-muted-foreground rounded-xl border p-4 text-sm">
          Checkout was canceled. You can try again anytime.
        </p>
      ) : null}

      {stripeReady && appUrlReady ? (
        <DonateForm />
      ) : (
        <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
          Donations are temporarily unavailable.
        </p>
      )}
    </div>
  );
}

export default DonatePage;
