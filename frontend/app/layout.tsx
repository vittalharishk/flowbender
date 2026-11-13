import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { ChunkErrorHandler } from "@/components/chunk-error-handler";
import { ConfirmProvider } from "@/components/app/confirm-dialog";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "flowbender — Film & OTT Production Management",
  description: "Professional production management platform for film and OTT teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ChunkErrorHandler />
        <ThemeProvider>
          <ConfirmProvider>
            <AuthProvider>{children}</AuthProvider>
          </ConfirmProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
