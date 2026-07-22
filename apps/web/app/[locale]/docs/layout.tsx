import { getLocale } from 'next-intl/server';

import { SidebarInset, SidebarProvider } from '@kit/ui/sidebar';

import { DocsHeader } from './_components/docs-header';
// local imports
import { DocsNavigation } from './_components/docs-navigation';
import { getDocs } from './_lib/server/docs.loader';
import { buildDocumentationTree } from './_lib/utils';

type DocsLayoutProps = React.PropsWithChildren<{
  params: Promise<{ locale?: string }>;
}>;

async function DocsLayout({ children, params }: DocsLayoutProps) {
  let { locale } = await params;

  if (!locale) {
    locale = await getLocale();
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          '--sidebar-width': '300px',
        } as React.CSSProperties
      }
    >
      <DocsSidebar locale={locale} />

      <SidebarInset className="h-screen overflow-y-auto overscroll-y-none">
        <DocsHeader />

        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

async function DocsSidebar({ locale }: { locale: string }) {
  const pages = await getDocs(locale);
  const tree = buildDocumentationTree(pages);

  return <DocsNavigation pages={tree} />;
}

export default DocsLayout;
