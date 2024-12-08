import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/Toaster";
import React from "react";
import ReactQueryProvider from "@/providers/ReactQueryProvider";

const font = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Quibble",
    default: "Quibble",
  },
  description: "For when you've got something to say (or just need to vent)?",
};

export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${font.className} w-full h-full`}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
          >
            {children}
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>

  );
}
