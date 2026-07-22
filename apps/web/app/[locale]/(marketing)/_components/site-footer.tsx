import { getFooterLinks } from '@kit/community/server/advanced-actions';
import { getSiteCopy } from '@kit/community/server/actions';
import { Footer } from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import { AppLogo } from '~/components/app-logo';
import appConfig from '~/config/app.config';

export async function SiteFooter() {
  const [links, copy] = await Promise.all([getFooterLinks(), getSiteCopy()]);

  const productLinks = links.map((link) => ({
    href: link.href,
    label: link.label,
  }));

  return (
    <Footer
      logo={<AppLogo className="w-[85px] md:w-[95px]" />}
      description={copy.footerTagline}
      copyright={
        <Trans
          i18nKey="marketing.copyright"
          values={{
            product: appConfig.name,
            year: new Date().getFullYear(),
          }}
        />
      }
      sections={[
        {
          heading: <Trans i18nKey="marketing.product" />,
          links: productLinks,
        },
        {
          heading: <Trans i18nKey="marketing.legal" />,
          links: [
            {
              href: '/terms-of-service',
              label: <Trans i18nKey="marketing.termsOfService" />,
            },
            {
              href: '/privacy-policy',
              label: <Trans i18nKey="marketing.privacyPolicy" />,
            },
            {
              href: '/cookie-policy',
              label: <Trans i18nKey="marketing.cookiePolicy" />,
            },
          ],
        },
      ]}
    />
  );
}
