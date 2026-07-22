'use client';

import { useAction } from 'next-safe-action/hooks';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';
import { useAsyncDialog } from '@kit/ui/hooks/use-async-dialog';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { removeMemberFromAccountAction } from '../../server/actions/team-members-server-actions';

export function RemoveMemberDialog({
  open,
  onOpenChange,
  teamAccountId,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamAccountId: string;
  userId: string;
}) {
  const { dialogProps, isPending, setIsPending, setOpen } = useAsyncDialog({
    open,
    onOpenChange,
  });

  return (
    <AlertDialog
      open={dialogProps.open}
      onOpenChange={dialogProps.onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans i18nKey="teams.removeMemberModalHeading" />
          </AlertDialogTitle>

          <AlertDialogDescription>
            <Trans i18nKey={'teams.removeMemberModalDescription'} />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RemoveMemberForm
          accountId={teamAccountId}
          userId={userId}
          isPending={isPending}
          setIsPending={setIsPending}
          onSuccess={() => {
            setIsPending(false);
            setOpen(false);
          }}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RemoveMemberForm({
  accountId,
  userId,
  isPending,
  setIsPending,
  onSuccess,
}: {
  accountId: string;
  userId: string;
  isPending: boolean;
  setIsPending: (pending: boolean) => void;
  onSuccess: () => void;
}) {
  const { execute, hasErrored } = useAction(removeMemberFromAccountAction, {
    onExecute: () => setIsPending(true),
    onSuccess: () => onSuccess(),
    onSettled: () => setIsPending(false),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute({ accountId, userId });
      }}
    >
      <div className={'flex flex-col space-y-6'}>
        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={'common.modalConfirmationQuestion'} />
        </p>

        <If condition={hasErrored}>
          <RemoveMemberErrorAlert />
        </If>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            <Trans i18nKey={'common.cancel'} />
          </AlertDialogCancel>

          <Button
            type={'submit'}
            data-test={'confirm-remove-member'}
            variant={'destructive'}
            disabled={isPending}
          >
            <Trans i18nKey={'teams.removeMemberSubmitLabel'} />
          </Button>
        </AlertDialogFooter>
      </div>
    </form>
  );
}

function RemoveMemberErrorAlert() {
  return (
    <Alert variant={'destructive'}>
      <AlertTitle>
        <Trans i18nKey={'teams.removeMemberErrorHeading'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'teams.removeMemberErrorMessage'} />
      </AlertDescription>
    </Alert>
  );
}
