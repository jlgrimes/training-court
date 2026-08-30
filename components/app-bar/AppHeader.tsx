'use client';

import Image from 'next/image';
import Link from 'next/link';
import HeaderBreadcrumbs from '@/components/app-bar/HeaderBreadcrumbs';
import { DarkModeToggle } from '@/components/theme/DarkModeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useUiRefresh } from '@/hooks/useUiRefresh';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const { enabled: uiRefresh } = useUiRefresh();

  return (
    <header
      className={cn(
        'fixed w-full z-50 flex flex-col gap-2',
        uiRefresh ? 'bg-background border-b border-border' : 'bg-white dark:bg-zinc-900'
      )}
    >
      {uiRefresh ? (
        <>
          <div className="grid grid-cols-3 items-center px-3 py-2 md:hidden">
            <div className="justify-self-start">
              <SidebarTrigger />
            </div>
            <Link href="/home" className="justify-self-center">
              <Image
                src="/logo.png"
                alt="Training Court"
                width={150}
                height={20}
                className="dark:invert"
              />
            </Link>
            <div className="justify-self-end">
              <DarkModeToggle />
            </div>
          </div>
          <div className="hidden md:flex px-4 py-4 gap-4 items-center">
            <HeaderBreadcrumbs />
          </div>
        </>
      ) : (
        <div className="flex px-4 py-4 gap-4 items-center">
          <SidebarTrigger />
          <HeaderBreadcrumbs />
        </div>
      )}
    </header>
  );
}
