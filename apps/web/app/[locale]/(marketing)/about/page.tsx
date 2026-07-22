import Link from 'next/link';

import { getSiteCopy } from '@kit/community/server/actions';

export const generateMetadata = async () => {
  return {
    title: 'About DuaPrayer',
    description:
      'A community space to share prayers and duas, make ameen, and support one another.',
  };
};

async function AboutPage() {
  const copy = await getSiteCopy();

  return (
    <div className="container mx-auto max-w-2xl space-y-8 py-10">
      <header className="space-y-3 border-b pb-8">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          About this space
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">About DuaPrayer</h1>
        <p className="text-muted-foreground text-sm leading-7 sm:text-base">
          {copy.aboutMission} DuaPrayer is part of{' '}
          <Link
            href="https://masjidweb.com"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            Masjidweb.com
          </Link>
          .
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">What we believe</h2>
        <ul className="text-muted-foreground space-y-4 text-sm leading-6">
          <li>
            <strong className="text-foreground font-semibold">
              Community first
            </strong>{' '}
            — the feed belongs to people who show up with sincerity, not
            algorithms chasing engagement.
          </li>
          <li>
            <strong className="text-foreground font-semibold">
              Free for everyone
            </strong>{' '}
            — optional donations and volunteers help cover hosting and
            moderation; access stays open.
          </li>
          <li>
            <strong className="text-foreground font-semibold">
              Neutral platform
            </strong>{' '}
            — we provide tools for sharing and support, not religious rulings or
            personal advice.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm leading-6">
          New here? Browse{' '}
          <Link
            href="/resources"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            Resources
          </Link>{' '}
          for guidelines, or learn how we handle{' '}
          <Link
            href="/safety"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            safety and privacy
          </Link>
          .
        </p>
        <p className="text-muted-foreground text-sm leading-6">
          Want to support DuaPrayer?{' '}
          <Link
            href="/donate"
            className="text-foreground font-medium underline-offset-2 hover:underline"
          >
            Optional donations
          </Link>{' '}
          help keep this community space available.
        </p>
      </section>
    </div>
  );
}

export default AboutPage;
