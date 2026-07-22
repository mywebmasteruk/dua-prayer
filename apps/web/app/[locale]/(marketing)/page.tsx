import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, HeartHandshake } from 'lucide-react';

import {
  CtaButton,
  EcosystemShowcase,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill,
  PillActionButton,
  SecondaryHero,
} from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <div className={'container mx-auto'}>
        <Hero
          pill={
            <Pill label={'Community'}>
              <span>Share duas and support one another</span>
              <PillActionButton
                render={
                  <Link href={'/auth/sign-up'}>
                    <ArrowRightIcon className={'h-4 w-4'} />
                  </Link>
                }
              />
            </Pill>
          }
          title={
            <span className="text-secondary-foreground">
              <span>DuaPrayer</span>
            </span>
          }
          subtitle={
            <span>
              A community space to share prayers and duas, make ameen, and
              support requests from others.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <Image
              priority
              className={
                'dark:border-primary/10 w-full rounded-lg border border-gray-200'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`DuaPrayer`}
            />
          }
        />
      </div>

      <div className={'container mx-auto'}>
        <div className={'py-4 xl:py-8'}>
          <FeatureShowcase
            heading={
              <>
                <b className="font-medium tracking-tight dark:text-white">
                  Built for community activity
                </b>
                .{' '}
                <span className="text-secondary-foreground/70 block font-normal tracking-tight">
                  Share a dua, browse the latest posts, and follow channels you
                  care about.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <HeartHandshake className="h-4 w-4" />
                <span>Community space</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Share a dua'}
                description={`Post a prayer request for the community to see and support.`}
              ></FeatureCard>

              <FeatureCard
                className={'relative col-span-1 w-full overflow-hidden'}
                label={'Make ameen'}
                description={`Respond to others with ameen and keep activity flowing.`}
              ></FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Channels'}
                description={`Follow community channels and browse latest duas by topic.`}
              />

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Accounts'}
                description={`Sign in to manage your profile, bookmarks, and notifications.`}
              />

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Privacy reminder'}
                description={`Choose what you share publicly and keep personal details private.`}
              />

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Support'}
                description={`Optional donations help keep the community space running.`}
              />
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      <div className={'container mx-auto'}>
        <EcosystemShowcase
          heading="About this space"
          description="DuaPrayer is a platform for sharing duas and supporting community requests — not a religious advisor or guidance provider."
        >
          <Image
            className="rounded-md"
            src={'/images/sign-in.webp'}
            alt="Sign in"
            width={1000}
            height={1000}
          />
        </EcosystemShowcase>
      </div>

      <div className={'container mx-auto'}>
        <div
          className={
            'flex flex-col items-center justify-center space-y-12 py-4 xl:py-8'
          }
        >
          <SecondaryHero
            pill={<Pill label="Join">Create a free account</Pill>}
            heading="Ready to join the community?"
            subheading="Sign up to share duas, make ameen, and follow channels."
          />

          <CtaButton className="h-10 text-sm">
            <Link href={pathsConfig.auth.signUp}>
              <span className={'flex items-center space-x-0.5'}>
                <span>
                  <Trans i18nKey={'common.getStarted'} />
                </span>
                <ArrowRightIcon className={'h-4 w-4'} />
              </span>
            </Link>
          </CtaButton>
        </div>
      </div>
    </div>
  );
}

export default Home;

function MainCallToActionButton() {
  return (
    <div className={'flex space-x-2.5'}>
      <CtaButton className="h-10 text-sm">
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>
              <Trans i18nKey={'common.getStarted'} />
            </span>

            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4' +
                ' zoom-in fill-mode-both delay-1000 duration-1000'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'link'} className="h-10 text-sm">
        <Link href={'/auth/sign-in'}>
          <Trans i18nKey={'auth.signIn'} defaults="Sign in" />
        </Link>
      </CtaButton>
    </div>
  );
}
