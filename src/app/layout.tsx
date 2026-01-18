import type { Metadata } from "next";
import { Baloo_2, Quicksand } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import GoogleTagManager from "@/components/analytics/GoogleTagManager";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NitiVidya Books - Big Wisdom for Little Minds",
  description: "Vibrant, durable paperback books designed to spark joy in children aged 0–5.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${baloo.variable} ${quicksand.variable} antialiased font-body bg-soft text-charcoal flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <GoogleTagManager />
        <UserProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <LeadCaptureModal />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}

