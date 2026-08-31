import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PWAProvider } from "@/context/PWAContext";
import { LanguageProvider } from "@/context/LanguageContext";
import StorefrontMobileTabBar from "@/components/storefront/StorefrontMobileTabBar";
import StorefrontPWAInstallModal from "@/components/storefront/StorefrontPWAInstallModal";
import PushNotificationPrompt from "@/components/common/PushNotificationPrompt";

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
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/apple-icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#141414",
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
        <LanguageProvider>
          <PWAProvider>
            <ToastProvider>
              <AuthProvider>
                <CartProvider>
                  {children}
                  {/* Client Storefront Mobile Bottom Tab Bar */}
                  <StorefrontMobileTabBar />
                  {/* Client Storefront PWA Install Modal & Floating Banner */}
                  <StorefrontPWAInstallModal />
                  {/* VIP Push Notification Prompt */}
                  <PushNotificationPrompt />
                </CartProvider>
              </AuthProvider>
            </ToastProvider>
          </PWAProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
