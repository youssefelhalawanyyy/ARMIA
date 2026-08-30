import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PWAProvider } from "@/context/PWAContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARMIA BOUTIQUE | Design for Your Style",
  description:
    "Discover ARMIA Boutique's curated luxury women's fashion, dresses, sets, tops, bottoms, and outerwear. Wholesale & Retail in Egypt.",
  keywords: [
    "ARMIA Boutique",
    "Egypt Fashion",
    "Women's Boutique",
    "Luxury Dresses",
    "Linen Sets",
    "Wholesale Fashion Egypt",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ARMIA",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F1F1F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F3EE] text-[#1F1F1F] font-sans selection:bg-[#DCC9A6] selection:text-[#1F1F1F]">
        <PWAProvider>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>{children}</CartProvider>
            </AuthProvider>
          </ToastProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
