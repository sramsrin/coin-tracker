import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ram & Dhruvan Coin Collection",
  description: "Track your coin collection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
