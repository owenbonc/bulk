import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import DemoControls from "@/components/DemoControls";
import NotificationBanner from "@/components/NotificationBanner";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bulk — group food orders",
  description: "Pool food orders with people nearby to unlock group deals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProvider>
          <div className="mx-auto flex min-h-screen max-w-md flex-col bg-white shadow-sm">
            <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
              <Link href="/" className="text-lg font-bold tracking-tight">
                🛵 Bulk
              </Link>
              <span className="ml-2 text-xs text-stone-500">group orders for halls</span>
            </header>
            <NotificationBanner />
            <main className="flex-1 px-4 py-4 pb-24">{children}</main>
          </div>
          <DemoControls />
        </AppProvider>
      </body>
    </html>
  );
}
