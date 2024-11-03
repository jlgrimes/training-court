import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";
import HeaderBreadcrumbs from "@/components/app-bar/HeaderBreadcrumbs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    template: '%s | Training Court',
    default: 'Training Court',
  },
  description: "Your favorite PTCG testing companion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-background text-foreground">
        <SidebarProvider>
          <AppSidebar />
          <main className="min-h-screen h-full w-full">
            <header className="fixed bg-white w-full z-50 flex flex-col px-4 gap-2">
              <div className="flex px-4 py-4 gap-2 items-center">
                <SidebarTrigger />
                <HeaderBreadcrumbs />
              </div>
            </header>
            <div className="flex flex-col items-center h-full pt-[52px]">
              {children}
            </div>
            <Toaster />
            <Analytics />
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
