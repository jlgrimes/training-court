import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";
import Header from "@/components/app-bar/Header";
import HeaderBreadcrumbs from "@/components/app-bar/HeaderBreadcrumbs";

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
        <Header />
        <main className="min-h-screen pt-16">
          <HeaderBreadcrumbs />
          <div className="flex flex-col items-center">
            {children}
          </div>
          <Toaster />
          <Analytics />
        </main>
      </body>
    </html>
  );
}
