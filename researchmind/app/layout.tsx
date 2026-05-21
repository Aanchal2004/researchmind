import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ResearchMind",
    template: "%s | ResearchMind",
  },
  description:
    "AI-native research workspace for discovering, synthesizing, and organizing academic literature.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`
        dark
        ${manrope.variable}
        ${newsreader.variable}
        ${ibmPlexMono.variable}
        h-full
        scroll-smooth
      `}
      suppressHydrationWarning
    >
      <body
        className="
          min-h-screen
          bg-zinc-950
          text-zinc-100
          antialiased
          font-sans
          selection:bg-teal-400/20 selection:text-teal-50
        "
      >
        {children}
      </body>
    </html>
  );
}
