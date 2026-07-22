import Link from 'next/link';

export const generateMetadata = async () => {
  return {
    title: 'Resources',
    description:
      'Guidelines for sharing duas respectfully, staying safe in public posts, and getting involved.',
  };
};

const guidelines = [
  'Share duas with sincerity — keep requests respectful and free of hate or harassment.',
  'Avoid posting private identifying details (full names, phone numbers, addresses).',
  'Use channels and topics so others can find and support related requests.',
  'Respond with ameen to uplift others; do not use replies to debate or criticize faith.',
  'Flag content that feels unsafe or off-topic so it can be reviewed.',
] as const;

const faqItems = [
  {
    question: 'Do I need an account to post a dua?',
    answer:
      'You can browse the feed without signing in. Creating an account helps you manage your requests and participate more fully.',
  },
  {
    question: 'What does ameen mean here?',
    answer:
      'Ameen is a simple way to say you are joining someone in their dua — like adding your voice to their prayer.',
  },
  {
    question: 'Is DuaPrayer religious guidance?',
    answer:
      'No. DuaPrayer is a community technology platform. It does not provide fatwa, counseling, or scholarly rulings.',
  },
] as const;

function ResourcesPage() {
  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-10">
      <header className="space-y-3 border-b pb-8">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Help & guides
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
        <p className="text-muted-foreground text-sm leading-7 sm:text-base">
          Quick guides for sharing duas respectfully, staying safe in public
          posts, and getting involved with the DuaPrayer community.
        </p>
      </header>

      <section className="space-y-4 border-b pb-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Community guidelines
        </h2>
        <ul className="text-muted-foreground space-y-3 text-sm leading-6">
          {guidelines.map((item) => (
            <li key={item} className="flex gap-2">
              <span
                className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-sm leading-6">
          For moderation details and privacy practices, see{' '}
          <Link
            href="/safety"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            Safety
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4 border-b pb-8">
        <h2 className="text-lg font-semibold tracking-tight">
          How to share a dua
        </h2>
        <ol className="text-muted-foreground list-decimal space-y-3 pl-5 text-sm leading-6">
          <li>
            <strong className="text-foreground font-semibold">
              Write from the heart
            </strong>{' '}
            — share what you are asking for in clear, sincere language.
          </li>
          <li>
            <strong className="text-foreground font-semibold">
              Pick a topic or channel
            </strong>{' '}
            — so others with similar intentions can find your request.
          </li>
          <li>
            <strong className="text-foreground font-semibold">
              Keep it public-safe
            </strong>{' '}
            — omit sensitive personal details you would not share in a community
            gathering.
          </li>
          <li>
            <strong className="text-foreground font-semibold">
              Welcome ameen
            </strong>{' '}
            — each ameen is someone joining you in prayer, not a comment thread.
          </li>
        </ol>
      </section>

      <section className="space-y-4 border-b pb-8">
        <h2 className="text-lg font-semibold tracking-tight">Quick FAQ</h2>
        <dl className="divide-border divide-y">
          {faqItems.map((item) => (
            <div key={item.question} className="py-4 first:pt-0 last:pb-0">
              <dt className="text-sm font-semibold">{item.question}</dt>
              <dd className="text-muted-foreground mt-1.5 text-sm leading-6">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Get involved</h2>
        <p className="text-muted-foreground text-sm leading-6">
          DuaPrayer stays available because of community care and optional
          support.
        </p>
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <Link
            href="/volunteer"
            className="underline-offset-2 hover:underline"
          >
            Volunteer
          </Link>
          <Link href="/donate" className="underline-offset-2 hover:underline">
            Support
          </Link>
          <Link href="/about" className="underline-offset-2 hover:underline">
            About DuaPrayer
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ResourcesPage;
