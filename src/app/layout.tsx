import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import GoogleTagManager from "@/components/analytics/GoogleTagManager";
import FacebookPixel from "@/components/analytics/FacebookPixel";
import { ConditionalComponents } from "@/components/layout/ConditionalComponents";
import VisitorTracker from "@/components/analytics/VisitorTracker";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "NitiVidya Books - Big Wisdom for Little Minds",
  description: "Indian cultural books for toddlers. Bilingual Hindi-English board books featuring Miko the elephant — safe, durable, and educational.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${nunito.variable} antialiased font-body bg-cream text-ink flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <GoogleTagManager />
        <FacebookPixel />
        <VisitorTracker />
        <UserProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <ConditionalComponents />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
