import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import HeaderBreadcrumbs from '@/components/app-bar/HeaderBreadcrumbs';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { RecoilProvider } from './recoil/recoil-provider';
import { DarkModeProvider } from '@/components/theme/DarkModeProvider';
import { DarkModeHydrationGuard } from '@/components/theme/DarkModeHydrationGuard';
import { cookies } from 'next/headers';

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
  const theme = cookies().get("theme")?.value ?? "light";
  const isDark = theme === "dark";

  return (
     <html lang="en" className={`${GeistSans.className} ${isDark ? "dark" : ""}`} suppressHydrationWarning>
      <body className='bg-background text-foreground'>
        <RecoilProvider>
          <DarkModeHydrationGuard>
            <DarkModeProvider />
            
            <SidebarProvider>
              <AppSidebar />
              <main className='min-h-screen h-full w-full'>
                <header className='fixed w-full z-50 flex flex-col gap-2 bg-white dark:bg-zinc-900'>
                  <div className='flex px-4 py-4 gap-4 items-center'>
                    <SidebarTrigger />
                    <HeaderBreadcrumbs />
                  </div>
                </header>
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
        </RecoilProvider>
      </body>
    </html>
  );
}
