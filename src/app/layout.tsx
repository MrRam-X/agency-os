import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReduxProvider } from "@/store/provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgencyOS | The Unified Agency Operating System",
  description: "AI-Powered Sprint Management, Automation & Ledger Tracking for Agencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ReduxProvider>
          {children}
          <Toaster position="top-right" closeButton richColors /> {/* 🟢 Custom Sonner settings */}
        </ReduxProvider>
      </body>
    </html>
  );
}