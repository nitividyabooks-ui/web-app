import { getAllProducts } from "@/lib/products";
import { getActiveTestimonials } from "@/lib/testimonials";
import { Shield, Truck, Palette, Gift, CheckCircle } from "lucide-react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import { MikoBundles } from "@/components/products/MikoBundles";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { WhatsAppActivityKit } from "@/components/home/WhatsAppActivityKit";
import { BUNDLE_5_DISCOUNT_PERCENT, SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";

export default async function Home() {
  const allProducts = await getAllProducts();
  const testimonials = await getActiveTestimonials();
  const heroProducts = allProducts.filter(p => p.hasHeroSlide).sort((a, b) => a.heroPriority - b.heroPriority);
  const mikoSeriesProducts = allProducts
    .filter((p) => p.collections?.includes("miko-series"))
    .sort((a, b) => a.heroPriority - b.heroPriority);

  return (
    <HomeContent heroProducts={heroProducts} mikoSeriesProducts={mikoSeriesProducts} testimonials={testimonials} allProducts={allProducts} />
  );
}

function HomeContent({ heroProducts, mikoSeriesProducts, testimonials, allProducts }: {
  heroProducts: any[];
  mikoSeriesProducts: any[];
  testimonials: any[];
  allProducts: any[];
}) {
  return (
    <div className="flex flex-col min-h-screen font-body">
      {/* Launch Offer Banner */}
      <div className="bg-sunshine text-ink">
        <div className="container mx-auto px-4 md:px-6 py-2 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-forest text-sunshine text-xs sm:text-sm whitespace-nowrap">
              🎁 Baby Gift Special
            </span>
            <span className="text-ink/80 text-xs sm:text-sm">
              <span className="hidden sm:inline">{SINGLE_BOOK_DISCOUNT_PERCENT}% off single • {BUNDLE_5_DISCOUNT_PERCENT}% off complete set</span>
              <span className="sm:hidden">Up to {BUNDLE_5_DISCOUNT_PERCENT}% off bundles</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <HeroCarousel products={heroProducts.length > 0 ? heroProducts : allProducts.slice(0, 1)} />

      {/* WhatsApp Activity Kit CTA */}
      <WhatsAppActivityKit />

      {/* Complete Series CTA */}
      {mikoSeriesProducts.length > 0 && (
        <section className="py-14 lg:py-18 bg-pale-yellow">
          <div className="container mx-auto px-4 md:px-6">
            <MikoBundles products={mikoSeriesProducts} />
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <TestimonialSection testimonials={testimonials} />
      )}

      {/* All Books Section */}
      <section className="py-20 lg:py-28 bg-pale-yellow">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-forest text-sunshine text-sm font-bold mb-4">
              📚 Our Collection
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-ink">All Books</h2>
            <p className="mt-4 text-lg text-ink-secondary font-medium">
              Explore the complete collection — shop securely online or via WhatsApp.
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-secondary">
              Our series books are <span className="text-forest font-extrabold">bilingual (Hindi + English)</span> — you&apos;ll see it on each book card.
            </p>
          </div>

          <div className="grid gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="relative">
        {/* Wave Separator */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
          <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#FFF9E8"></path>
          </svg>
        </div>

        <div className="bg-pale-green py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-10 text-center">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-ink">Why Parents Love NitiVidya</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Safety */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-forest rounded-full flex items-center justify-center shadow-forest text-sunshine">
                  <Shield className="w-10 h-10" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">Non-Toxic &amp; Safe</h3>
                <p className="text-sm text-ink-secondary font-medium">Certified safe for babies who love to chew.</p>
              </div>

              {/* Durability */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-sunshine rounded-full flex items-center justify-center shadow-golden">
                  <div className="text-4xl">🔨</div>
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">Tear-Proof Pages</h3>
                <p className="text-sm text-ink-secondary font-medium">Thick board pages that withstand rough play.</p>
              </div>

              {/* Design */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-coral rounded-full flex items-center justify-center shadow-sm text-white">
                  <Palette className="w-10 h-10" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">Vivid Colors</h3>
                <p className="text-sm text-ink-secondary font-medium">High-contrast art to stimulate visual development.</p>
              </div>

              {/* Shipping */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-sky/20 rounded-full flex items-center justify-center shadow-sm text-sky-600">
                  <Truck className="w-10 h-10" />
                </div>
                <h3 className="font-heading font-bold text-xl text-ink">Free Shipping</h3>
                <p className="text-sm text-ink-secondary font-medium">On all orders above ₹499 across India.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / Email Capture */}
      <section className="py-24 bg-forest">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sunshine/15 rounded-full text-sunshine font-semibold text-sm mb-6">
              <Gift className="w-4 h-4" />
              Free Gift Inside
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-sunshine">
              Join Miko&apos;s Club!
            </h2>
            <p className="mt-4 text-white/80 text-lg">
              Get <span className="font-bold text-sunshine">10% off</span> your first order + weekly parenting tips
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-sunshine" />
                Free coloring pages
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-sunshine" />
                Early access to new books
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-sunshine" />
                Parenting tips &amp; activities
              </span>
            </div>

            <NewsletterForm />
            <p className="mt-4 text-xs text-white/40">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "NitiVidya Books - Big Wisdom for Little Minds",
    description: "Beautiful bilingual books for babies and toddlers. Safe, durable, and educational.",
  };
}
