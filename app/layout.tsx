import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { CircleAlert, CircleCheck, Info, LoaderCircle, LucideProvider, TriangleAlert } from "lucide-react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import PartyAlerts from "@/components/PartyAlerts";
import { DemoHotkey } from "@/components/demo";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: "Bulk", template: "%s · Bulk" },
  description: "Join a party with students nearby and unlock the group deal.",
  applicationName: "Bulk",
  appleWebApp: { capable: true, title: "Bulk", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f7f5ec",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${geist.variable} ${geistMono.variable} ${bricolage.variable}`}>
      <body>
        <LucideProvider size={20} strokeWidth={1.75}>
          <MotionConfig reducedMotion="user">
            {/* The phone column: full width on phones, centred with side hairlines on a laptop. */}
            <div className="relative mx-auto min-h-dvh w-full max-w-column bg-bg min-[480px]:shadow-[-1px_0_0_var(--line),1px_0_0_var(--line)]">
              <AppProvider>
                {children}
                <PartyAlerts />
                <DemoHotkey />
              </AppProvider>
            </div>
            <Toaster
              position="top-center"
              className="bulk-toaster"
              offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
              mobileOffset={{ top: "calc(env(safe-area-inset-top) + 8px)", left: "16px", right: "16px" }}
              gap={8}
              visibleToasts={3}
              duration={3200}
              icons={{
                success: <CircleCheck />,
                info: <Info />,
                warning: <TriangleAlert />,
                error: <CircleAlert />,
                loading: <LoaderCircle className="animate-spin" />,
              }}
            />
          </MotionConfig>
        </LucideProvider>
      </body>
    </html>
  );
}
