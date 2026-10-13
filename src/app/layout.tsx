import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "MenuHub — Bilingual Digital Menus | منوی دیجیتال دوزبانه",
  description:
    "Create a professional bilingual (Persian/English) restaurant menu with QR codes in minutes. Multi-tenant SaaS. منوی دوزبانه رستوران با کد QR.",
  keywords: ["digital menu", "QR menu", "restaurant menu", "bilingual", "Persian", "منوی دیجیتال", "منو رستوران"],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%230F766E'/><text y='72' x='50' text-anchor='middle' font-size='58' font-weight='bold' fill='%23FBBF24' font-family='Arial'>7</text></svg>",
  },
  openGraph: {
    title: "MenuHub — Bilingual Digital Menus",
    description: "Your restaurant menu, live in minutes. Persian & English, QR codes built-in.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Vazirmatn — Persian + Latin UI font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-foreground font-vazir">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
