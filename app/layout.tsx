import type { ReactNode } from "react";
import { Rajdhani, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppContentWrapper } from "@/components/AppContentWrapper";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${dmSans.variable}`} data-theme="dark">
      <head>
        <title>Kahawa Sport Arena</title>
        <meta name="description" content="Book pitches and complete payment at Kahawa Sport Arena." />
      </head>
      <body className="min-h-screen bg-navy-deep text-white-soft font-sans antialiased">
        <ThemeProvider>
          <AppContentWrapper>{children}</AppContentWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}


