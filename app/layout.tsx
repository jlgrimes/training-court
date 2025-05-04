import { GeistSans } from 'geist/font/sans';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import HeaderBreadcrumbs from '@/components/app-bar/HeaderBreadcrumbs';
import {
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { RecoilProvider } from './recoil/recoil-provider';
import { RecoilRoot } from 'recoil';
import { DarkModeProvider } from '@/components/theme/DarkModeProvider';

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
          <DarkModeProvider />

            <SidebarProvider>
              <AppSidebar />
              <main className='min-h-screen h-full w-full'>
                <header className='fixed w-full z-50 flex flex-col gap-2'>
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

        </RecoilProvider>
      </body>
    </html>
  );
}
