import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kernlo — Progress tracking for homeschool families",
  description:
    "Kernlo turns what your child learned today into professional progress reports — in minutes, not hours. Built for homeschool parents.",
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
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}
