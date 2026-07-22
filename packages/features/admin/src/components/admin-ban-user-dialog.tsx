'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { useAsyncDialog } from '@kit/ui/hooks/use-async-dialog';
import { If } from '@kit/ui/if';
import { Input } from '@kit/ui/input';

import { banUserAction } from '../lib/server/admin-server-actions';
import { BanUserSchema } from '../lib/server/schema/admin-actions.schema';

export function AdminBanUserDialog(
  props: React.PropsWithChildren<{
    userId: string;
  }>,
) {
  const { dialogProps, isPending, setIsPending, setOpen } = useAsyncDialog();

  return (
    <AlertDialog
      open={dialogProps.open}
      onOpenChange={dialogProps.onOpenChange}
    >
      <AlertDialogTrigger render={props.children as React.ReactElement} />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ban User</AlertDialogTitle>

          <AlertDialogDescription>
            Are you sure you want to ban this user? Please note that the user
            will stay logged in until their session expires.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <BanUserForm
          userId={props.userId}
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

function BanUserForm(props: {
  userId: string;
  isPending: boolean;
  setIsPending: (pending: boolean) => void;
  onSuccess: () => void;
}) {
  const { execute, hasErrored } = useAction(banUserAction, {
    onExecute: () => props.setIsPending(true),
    onSuccess: () => props.onSuccess(),
    onSettled: () => props.setIsPending(false),
  });

  const form = useForm({
    resolver: zodResolver(BanUserSchema),
    defaultValues: {
      userId: props.userId,
      confirmation: '',
    },
  });

  return (
    <Form {...form}>
      <form
        data-test={'admin-ban-user-form'}
        className={'flex flex-col space-y-8'}
        onSubmit={form.handleSubmit((data) => execute(data))}
      >
        <If condition={hasErrored}>
          <Alert variant={'destructive'}>
            <AlertTitle>Error</AlertTitle>

            <AlertDescription>
              There was an error banning the user. Please check the server logs
              to see what went wrong.
            </AlertDescription>
          </Alert>
        </If>

        <FormField
          name={'confirmation'}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Type <b>CONFIRM</b> to confirm
              </FormLabel>

              <FormControl>
                <Input
                  required
                  pattern={'CONFIRM'}
                  placeholder={'Type CONFIRM to confirm'}
                  {...field}
                />
              </FormControl>

              <FormDescription>
                Are you sure you want to do this?
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.isPending}>
            Cancel
          </AlertDialogCancel>

          <Button
            disabled={props.isPending}
            type={'submit'}
            variant={'destructive'}
          >
            {props.isPending ? 'Banning...' : 'Ban User'}
          </Button>
        </AlertDialogFooter>
      </form>
    </Form>
  );
}
