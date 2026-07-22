'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { ArrowLeftIcon } from 'lucide-react';

import { getSafeRedirectPath } from '@kit/shared/utils';
import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import appConfig from '~/config/app.config';

export function DocsBackButton() {
  const searchParams = useSearchParams();
  const returnPath = searchParams.get('returnPath');
  const parsedPath = getSafeRedirectPath(returnPath, '/');

  return (
    <Button
      nativeButton={false}
      variant="link"
      render={
        <Link href={parsedPath || '/'}>
          <ArrowLeftIcon className="size-4" />{' '}
          <span className={'hidden sm:block'}>
            <Trans i18nKey="common.back" values={{ product: appConfig.name }} />
          </span>
        </Link>
      }
    />
  );
}
