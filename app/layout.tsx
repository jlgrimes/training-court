import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { RecoilToaster } from '@/components/ui/recoil-toaster';
import './globals.css';
import HeaderBreadcrumbs from '@/components/app-bar/HeaderBreadcrumbs';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebarClient } from '@/components/app-sidebar-client';
import { RecoilProvider } from './recoil/recoil-provider';
import { DarkModeProvider } from '@/components/theme/DarkModeProvider';
import { DarkModeHydrationGuard } from '@/components/theme/DarkModeHydrationGuard';
import { RealtimeProvider } from './recoil/providers/RealtimeProvider';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    template: '%s | Training Court',
    default: 'Training Court',
  },
  description: 'Your favorite PTCG testing companion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={GeistSans.className}>
      <body className='bg-background text-foreground'>
        <RecoilProvider>
          <DarkModeHydrationGuard>
            <DarkModeProvider />
            <RealtimeProvider>
              <SidebarProvider>
                <AppSidebarClient />
                <SidebarInset>
                  <header className='sticky top-0 z-50 flex flex-col gap-2 bg-white dark:bg-zinc-900'>
                    <div className='flex px-4 py-4 gap-4 items-center'>
                      <SidebarTrigger />
                      <HeaderBreadcrumbs />
                    </div>
                  </header>
                  <div className='flex flex-col items-center h-full'>
                    <div className='flex flex-col p-4 gap-6 w-full h-full'>
                      {children}
                    </div>
                  </div>
                  <RecoilToaster />
                  <Analytics />
                </SidebarInset>
              </SidebarProvider>
            </RealtimeProvider>
          </DarkModeHydrationGuard>
        </RecoilProvider>
      </body>
    </html>
  );
}
