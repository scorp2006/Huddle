import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

// JetBrains Mono from Google Fonts
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Huddle — Never miss a connection",
  description: "Event networking made simple. Scan a QR code, discover attendees, and connect on LinkedIn.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@1,900,700,500,400&display=swap" rel="stylesheet" />
      </head>
      <body className={jetbrainsMono.variable} style={{ fontFamily: 'Satoshi, system-ui, -apple-system, sans-serif' }}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
