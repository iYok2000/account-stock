import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inventory & Ordering Control",
  description: "Inventory and order management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning className={sarabun.variable}>
      <body className={sarabun.className}>{children}</body>
    </html>
  );
}
