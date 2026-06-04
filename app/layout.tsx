import type { Metadata } from "next";
import { IBM_Plex_Sans, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Turncoat",
  description:
    "A free multiplayer word game — Classic team vs team or Turncoat mode with a secret traitor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className={`${sans.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}
