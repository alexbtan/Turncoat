import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codenames",
  description: "A free multiplayer Codenames game built with Next.js.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
