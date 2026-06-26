import type { Metadata } from "next";
import { Figtree, League_Spartan } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/Toaster";
import React from "react";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { NextSSRPlugin} from "@uploadthing/react/next-ssr-plugin";
import { fileRouter } from "./api/uploadthing/core";
import { extractRouterConfig } from "uploadthing/server";

const font = Figtree({ subsets: ["latin"], variable: "--figtree" });
const leagueSpartan = League_Spartan({ subsets: ["latin"], weight: ["900"], variable: "--league-spartan" });

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
    <html lang="en" suppressHydrationWarning={true} className="dark">
      <body className={`${font.className} ${leagueSpartan.variable} w-full h-full`}>
        <NextSSRPlugin routerConfig={extractRouterConfig(fileRouter)} />
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
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
