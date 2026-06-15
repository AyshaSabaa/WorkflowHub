import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_TITLE } from "@/components/brand/logo";
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
  title: APP_TITLE,
  description: "Avishkar AI CRM — sales pipeline, deal management, and team productivity",
  icons: {
    icon: "/assets/avishkar-ai-logo.png",
    apple: "/assets/avishkar-ai-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
