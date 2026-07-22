import Link from 'next/link';

export const generateMetadata = async () => {
  return {
    title: 'Safety and privacy',
    description:
      'Practices that help keep DuaPrayer respectful, privacy-minded, and clear about what the platform is.',
  };
};

function SafetyPage() {
  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-10">
      <header className="space-y-3 border-b pb-8">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Trust & safety
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Safety and privacy
        </h1>
        <p className="text-muted-foreground text-sm leading-7 sm:text-base">
          Public duas should feel safe to share. These practices help keep
          DuaPrayer respectful, privacy-minded, and clear about what the
          platform is — and is not.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Sharing responsibly
        </h2>
        <ul className="text-muted-foreground space-y-4 text-sm leading-6">
          <li>
            <strong className="text-foreground font-semibold">
              Protect private details
            </strong>{' '}
            — avoid full names, contact info, or anything you would not say in a
            public gathering.
          </li>
          <li>
            <strong className="text-foreground font-semibold">Moderation</strong>{' '}
            — volunteers and automated tools review flagged content to reduce
            abuse, spam, and harassment.
          </li>
          <li>
            <strong className="text-foreground font-semibold">
              Account data
            </strong>{' '}
            — sign-in is handled through secure providers; we collect only what
            is needed to run the service.
          </li>
        </ul>
        <p className="text-muted-foreground text-xs leading-5">
          DuaPrayer is not a substitute for crisis services, medical care, legal
          advice, or religious scholarship. Community activity is a support
          signal, not fatwa or counseling.
        </p>
        <p className="text-muted-foreground text-sm leading-6">
          Read the{' '}
          <Link
            href="/resources"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            community guidelines
          </Link>{' '}
          on the Resources page.
        </p>
      </section>
    </div>
  );
}

export default SafetyPage;
