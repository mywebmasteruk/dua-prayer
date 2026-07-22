'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Bot,
  ClipboardList,
  FileText,
  HandHeart,
  LayoutDashboard,
  Radio,
  Settings2,
  Users,
  UserRoundPlus,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
} from '@kit/ui/sidebar';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/accounts', label: 'Accounts', icon: Users },
  { href: '/admin/duas', label: 'Duas', icon: HandHeart },
  { href: '/admin/channels', label: 'Channels', icon: Radio },
  { href: '/admin/volunteers', label: 'Volunteers', icon: UserRoundPlus },
  { href: '/admin/forms', label: 'Forms', icon: ClipboardList },
  { href: '/admin/bots', label: 'Bots', icon: Bot },
  { href: '/admin/copy', label: 'Site copy', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings2 },
];

export function AdminSidebar() {
  const path = usePathname();

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className={'m-2'}>
        <AppLogo href={'/admin'} className="max-w-full" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Super Admin</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => {
                const active = link.exact
                  ? path === '/admin' || path.endsWith('/admin')
                  : path.includes(link.href);

                return (
                  <SidebarMenuButton
                    key={link.href}
                    isActive={active}
                    render={
                      <Link
                        className={'flex size-full gap-2.5'}
                        href={link.href}
                      >
                        <link.icon className={'h-4'} />
                        <span>{link.label}</span>
                      </Link>
                    }
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ProfileAccountDropdownContainer />
      </SidebarFooter>
    </Sidebar>
  );
}
