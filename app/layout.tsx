import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AppHeader } from '@/components/app-bar/AppHeader';
import {
  SidebarProvider,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { RecoilProvider } from './recoil/recoil-provider';
import { RealtimeProvider } from './recoil/providers/RealtimeProvider';
import { ClientAuthProvider } from './recoil/providers/ClientAuthProvider';
import { DarkModeProvider } from '@/components/theme/DarkModeProvider';
import { DarkModeHydrationGuard } from '@/components/theme/DarkModeHydrationGuard';
import { PostHogProvider } from '@/components/posthog/PostHogProvider';
import { UiRefreshClass } from '@/components/theme/UiRefreshClass';
import GTProviderClient from './general-translation/GTProviderClient';

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
     <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <GTProviderClient>
          <RecoilProvider>
            <PostHogProvider>
              <ClientAuthProvider />
              <RealtimeProvider>
                <DarkModeHydrationGuard>
                  <DarkModeProvider />
                  <UiRefreshClass />

                  <SidebarProvider>
                  <AppSidebar />
                  <main className='min-h-screen h-full w-full'>
                    <AppHeader />
                    <div className='flex flex-col items-center h-full pt-[52px]'>
                      <div className='flex flex-col p-4 gap-6 w-full h-full'>
                        {children}
                      </div>
                    </div>
                    <Toaster />
                    <Analytics />
                  </main>
                </SidebarProvider>

                </DarkModeHydrationGuard>
              </RealtimeProvider>
            </PostHogProvider>
          </RecoilProvider>
        </GTProviderClient>
      </body>
    </html>
  );
}
