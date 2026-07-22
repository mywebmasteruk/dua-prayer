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

import { renewInvitationAction } from '../../server/actions/team-invitations-server-actions';

export function RenewInvitationDialog({
  isOpen,
  setIsOpen,
  invitationId,
  email,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  invitationId: number;
  email: string;
}) {
  const { dialogProps, isPending, setIsPending, setOpen } = useAsyncDialog({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  return (
    <AlertDialog
      open={dialogProps.open}
      onOpenChange={dialogProps.onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans i18nKey="team.renewInvitation" />
          </AlertDialogTitle>

          <AlertDialogDescription>
            <Trans
              i18nKey="team.renewInvitationDialogDescription"
              values={{ email }}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <RenewInvitationForm
          invitationId={invitationId}
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

function RenewInvitationForm({
  invitationId,
  isPending,
  setIsPending,
  onSuccess,
}: {
  invitationId: number;
  isPending: boolean;
  setIsPending: (pending: boolean) => void;
  onSuccess: () => void;
}) {
  const { execute, hasErrored } = useAction(renewInvitationAction, {
    onExecute: () => setIsPending(true),
    onSuccess: () => onSuccess(),
    onSettled: () => setIsPending(false),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        execute({ invitationId });
      }}
    >
      <div className={'flex flex-col space-y-6'}>
        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={'common.modalConfirmationQuestion'} />
        </p>

        <If condition={hasErrored}>
          <RenewInvitationErrorAlert />
        </If>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            <Trans i18nKey={'common.cancel'} />
          </AlertDialogCancel>

          <Button
            type={'submit'}
            data-test={'confirm-renew-invitation'}
            disabled={isPending}
          >
            <Trans i18nKey={'teams.renewInvitation'} />
          </Button>
        </AlertDialogFooter>
      </div>
    </form>
  );
}

function RenewInvitationErrorAlert() {
  return (
    <Alert variant={'destructive'}>
      <AlertTitle>
        <Trans i18nKey={'teams.renewInvitationErrorTitle'} />
      </AlertTitle>

      <AlertDescription>
        <Trans i18nKey={'teams.renewInvitationErrorDescription'} />
      </AlertDescription>
    </Alert>
  );
}
