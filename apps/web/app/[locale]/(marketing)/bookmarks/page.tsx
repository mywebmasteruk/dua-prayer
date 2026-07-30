import Link from 'next/link';

import { DuaList } from '@kit/community/components';
import { listMyBookmarks } from '@kit/community/server/actions';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export const generateMetadata = async () => {
  return {
    title: 'Bookmarks',
    description: 'Duas you have saved.',
  };
};

async function BookmarksPage() {
  await requireUserInServerComponent();
  const result = await listMyBookmarks();

  if ('error' in result) {
    return (
      <div className="px-4 py-6 sm:px-5 lg:px-8">
        <p className="text-muted-foreground text-sm">
          <Link href="/auth/sign-in" className="underline">
            Sign in
          </Link>{' '}
          to view bookmarks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-5 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Bookmarks</h1>
        <p className="text-muted-foreground text-sm">
          Duas you saved for later.
        </p>
      </header>
      <DuaList
        duas={result.duas}
        emptyTitle="No bookmarks yet"
        emptyDescription="Save a dua from the feed to find it here."
      />
    </div>
  );
}

export default BookmarksPage;
