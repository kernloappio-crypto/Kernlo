import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0066cc",
};

export const metadata: Metadata = {
  title: "Kernlo — Progress tracking for homeschool families",
  description:
    "Kernlo turns what your child learned today into professional progress reports — in minutes, not hours. Built for homeschool parents.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kernlo",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Kernlo — Progress tracking for homeschool families",
    description:
      "AI-powered progress reports and tracking for homeschool families. No spreadsheets. No stress.",
    url: "https://kernlo.app",
    siteName: "Kernlo",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kernlo" />
        <meta name="theme-color" content="#0066cc" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            `,
          }}
        />
      </head>
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}
