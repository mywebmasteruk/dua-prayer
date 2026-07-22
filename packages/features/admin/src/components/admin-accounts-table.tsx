'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ColumnDef } from '@tanstack/react-table';
import { EllipsisVertical } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { DataTable } from '@kit/ui/enhanced-data-table';
import { Form, FormControl, FormField, FormItem } from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { AdminDeleteAccountDialog } from './admin-delete-account-dialog';
import { AdminDeleteUserDialog } from './admin-delete-user-dialog';
import { AdminImpersonateUserDialog } from './admin-impersonate-user-dialog';
import { AdminResetPasswordDialog } from './admin-reset-password-dialog';

type Account = Tables<'accounts'>;

const FiltersSchema = z.object({
  type: z.enum(['all', 'team', 'personal']),
  query: z.string().optional(),
});

export function AdminAccountsTable(
  props: React.PropsWithChildren<{
    data: Account[];
    pageCount: number;
    pageSize: number;
    page: number;
    filters: {
      type: 'all' | 'team' | 'personal';
      query: string;
    };
  }>,
) {
  return (
    <div className={'flex flex-col space-y-4'}>
      <div className={'flex justify-end'}>
        <AccountsTableFilters filters={props.filters} />
      </div>

      <div className={'rounded-lg border p-2'}>
        <DataTable
          pageSize={props.pageSize}
          pageIndex={props.page - 1}
          pageCount={props.pageCount}
          data={props.data}
          columns={getColumns()}
        />
      </div>
    </div>
  );
}

function AccountsTableFilters(props: {
  filters: z.output<typeof FiltersSchema>;
}) {
  const form = useForm({
    resolver: zodResolver(FiltersSchema),
    defaultValues: {
      type: props.filters?.type ?? 'all',
      query: props.filters?.query ?? '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const router = useRouter();
  const pathName = usePathname();

  const onSubmit = ({ type, query }: z.output<typeof FiltersSchema>) => {
    const params = new URLSearchParams({
      account_type: type,
      query: query ?? '',
    });

    const url = `${pathName}?${params.toString()}`;

    router.push(url);
  };

  const type = useWatch({ control: form.control, name: 'type' });

  const options = {
    all: 'All Accounts',
    team: 'Team',
    personal: 'Personal',
  };

  return (
    <Form {...form}>
      <form
        className={'flex gap-2.5'}
        onSubmit={form.handleSubmit((data) => onSubmit(data))}
      >
        <Select
          value={type}
          onValueChange={(value) => {
            form.setValue(
              'type',
              value as z.output<typeof FiltersSchema>['type'],
              {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              },
            );

            return onSubmit(form.getValues());
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={'Account Type'}>
              {(value: keyof typeof options) => options[value]}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectGroup>
              <SelectLabel>Account Type</SelectLabel>

              {Object.entries(options).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <FormField
          name={'query'}
          render={({ field }) => (
            <FormItem>
              <FormControl className={'w-full min-w-36 md:min-w-80'}>
                <Input
                  data-test={'admin-accounts-table-filter-input'}
                  className={'w-full'}
                  placeholder={`Search account...`}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <button type="submit" hidden />
      </form>
    </Form>
  );
}

function getColumns(): ColumnDef<Account>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => {
        return (
          <Link
            prefetch={false}
            className={'hover:underline'}
            href={`/admin/accounts/${row.original.id}`}
          >
            {row.original.name}
          </Link>
        );
      },
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => {
        return row.original.is_personal_account ? 'Personal' : 'Team';
      },
    },
    {
      id: 'created_at',
      header: 'Created At',
      cell: ({ row }) => {
        return new Date(row.original.created_at!).toLocaleDateString(
          undefined,
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          },
        );
      },
    },
    {
      id: 'updated_at',
      header: 'Updated At',
      cell: ({ row }) => {
        return row.original.updated_at
          ? new Date(row.original.updated_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-';
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ActionsCell account={row.original} />,
    },
  ];
}

type ActiveDialog =
  | 'reset-password'
  | 'impersonate'
  | 'delete-user'
  | 'delete-account'
  | null;

function ActionsCell({ account }: { account: Account }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const isPersonalAccount = account.is_personal_account;

  return (
    <div className={'flex justify-end'}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant={'outline'} size={'icon'}>
              <EllipsisVertical className={'h-4'} />
            </Button>
          }
        />

        <DropdownMenuContent className="min-w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem
              render={
                <Link
                  className={'h-full w-full'}
                  href={`/admin/accounts/${account.id}`}
                >
                  View
                </Link>
              }
            />

            {isPersonalAccount && (
              <>
                <DropdownMenuItem
                  onClick={() => setActiveDialog('reset-password')}
                >
                  Send Reset Password link
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setActiveDialog('impersonate')}
                >
                  Impersonate User
                </DropdownMenuItem>

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setActiveDialog('delete-user')}
                >
                  Delete Personal Account
                </DropdownMenuItem>
              </>
            )}

            {!isPersonalAccount && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setActiveDialog('delete-account')}
              >
                Delete Team Account
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {isPersonalAccount && (
        <>
          <AdminResetPasswordDialog
            userId={account.id}
            open={activeDialog === 'reset-password'}
            onOpenChange={(open) => !open && setActiveDialog(null)}
          />

          <AdminImpersonateUserDialog
            userId={account.id}
            open={activeDialog === 'impersonate'}
            onOpenChange={(open) => !open && setActiveDialog(null)}
          />

          <AdminDeleteUserDialog
            userId={account.id}
            open={activeDialog === 'delete-user'}
            onOpenChange={(open) => !open && setActiveDialog(null)}
          />
        </>
      )}

      {!isPersonalAccount && (
        <AdminDeleteAccountDialog
          accountId={account.id}
          open={activeDialog === 'delete-account'}
          onOpenChange={(open) => !open && setActiveDialog(null)}
        />
      )}
    </div>
  );
}
