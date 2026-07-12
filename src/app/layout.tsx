import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { UserProvider } from "@/context/UserContext";
import GoogleTagManager from "@/components/analytics/GoogleTagManager";
import FacebookPixel from "@/components/analytics/FacebookPixel";
import { ConditionalComponents } from "@/components/layout/ConditionalComponents";
import { JsonLd, organizationJsonLd, webSiteJsonLd } from "@/components/seo/JsonLd";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nitividyabooks.com"),
  title: {
    default: "NitiVidya Books - Indian Story Books for Kids Ages 0-5",
    template: "%s | NitiVidya Books",
  },
  description: "Indian cultural books for toddlers. Bilingual Hindi-English board books featuring Miko the elephant — safe, durable, and educational.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunitoSans.variable}`}>
      <body
        className="antialiased font-body bg-paper text-ink flex flex-col min-h-screen"
        suppressHydrationWarning
      >
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={webSiteJsonLd()} />
        <GoogleTagManager />
        <FacebookPixel />
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
