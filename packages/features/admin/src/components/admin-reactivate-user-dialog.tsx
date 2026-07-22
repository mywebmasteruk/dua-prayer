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

import { reactivateUserAction } from '../lib/server/admin-server-actions';
import { ReactivateUserSchema } from '../lib/server/schema/admin-actions.schema';

export function AdminReactivateUserDialog(
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
          <AlertDialogTitle>Reactivate User</AlertDialogTitle>

          <AlertDialogDescription>
            Are you sure you want to reactivate this user?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ReactivateUserForm
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

function ReactivateUserForm(props: {
  userId: string;
  isPending: boolean;
  setIsPending: (pending: boolean) => void;
  onSuccess: () => void;
}) {
  const { execute, hasErrored } = useAction(reactivateUserAction, {
    onExecute: () => props.setIsPending(true),
    onSuccess: () => props.onSuccess(),
    onSettled: () => props.setIsPending(false),
  });

  const form = useForm({
    resolver: zodResolver(ReactivateUserSchema),
    defaultValues: {
      userId: props.userId,
      confirmation: '',
    },
  });

  return (
    <Form {...form}>
      <form
        data-test={'admin-reactivate-user-form'}
        className={'flex flex-col space-y-8'}
        onSubmit={form.handleSubmit((data) => execute(data))}
      >
        <If condition={hasErrored}>
          <Alert variant={'destructive'}>
            <AlertTitle>Error</AlertTitle>

            <AlertDescription>
              There was an error reactivating the user. Please check the server
              logs to see what went wrong.
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

          <Button disabled={props.isPending} type={'submit'}>
            {props.isPending ? 'Reactivating...' : 'Reactivate User'}
          </Button>
        </AlertDialogFooter>
      </form>
    </Form>
  );
}
