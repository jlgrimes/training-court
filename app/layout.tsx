import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";
import Header from "@/components/app-bar/Header";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Buddy Poffin",
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
        <main className="min-h-screen flex flex-col items-center">
          {children}
          <Toaster />
        </main>
      </body>
    </html>
  );
}
