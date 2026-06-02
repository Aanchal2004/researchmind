import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark h-full scroll-smooth" suppressHydrationWarning>
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
