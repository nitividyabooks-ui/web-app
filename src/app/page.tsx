import { Button } from "@/components/ui/Button";
import { getAllProducts } from "@/lib/products";
import { getActiveTestimonials } from "@/lib/testimonials";
import { Shield, Truck, Palette, Gift, CheckCircle } from "lucide-react";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductCard } from "@/components/products/ProductCard";
import { MikoBundles } from "@/components/products/MikoBundles";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { BUNDLE_3_DISCOUNT_PERCENT, BUNDLE_5_DISCOUNT_PERCENT, SINGLE_BOOK_DISCOUNT_PERCENT } from "@/lib/pricing";

export default async function Home() {
  const allProducts = await getAllProducts();
  const testimonials = await getActiveTestimonials();
  const heroProducts = allProducts.filter(p => p.hasHeroSlide).sort((a, b) => a.heroPriority - b.heroPriority);
  const mikoSeriesProducts = allProducts
    .filter((p) => p.collections?.includes("miko-series"))
    .sort((a, b) => a.heroPriority - b.heroPriority);

  return (
    <div className="flex flex-col min-h-screen font-body">
      {/* Launch Offer Banner */}
      <div className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 md:px-6 py-2 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm whitespace-nowrap">
              🎉 Launch offer
            </span>
            <span className="text-white/90 text-xs sm:text-sm">
              <span className="hidden sm:inline">{SINGLE_BOOK_DISCOUNT_PERCENT}% off single • {BUNDLE_3_DISCOUNT_PERCENT}% off 3+ • {BUNDLE_5_DISCOUNT_PERCENT}% off 5+</span>
              <span className="sm:hidden">Up to {BUNDLE_5_DISCOUNT_PERCENT}% off bundles</span>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <HeroCarousel products={heroProducts.length > 0 ? heroProducts : allProducts.slice(0, 1)} />

      {/* Complete Series CTA */}
      {mikoSeriesProducts.length > 0 && (
        <section className="py-14 lg:py-18 bg-soft/30">
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
      <section className="py-20 lg:py-28 bg-soft/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-charcoal">All Books</h2>
            <p className="mt-4 text-lg text-slate-500 font-medium">
              Explore the complete collection — shop securely online or via WhatsApp.
            </p>
            <p className="mt-2 text-sm text-slate-500 font-semibold">
              Our series books are <span className="text-slate-900">bilingual (Hindi + English)</span> — you&apos;ll see it on each book card.
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
          <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
          </svg>
        </div>

        <div className="bg-[#FFF9C4] py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Safety */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-miko-pink">
                  <Shield className="w-10 h-10" />
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">Non-Toxic & Safe</h3>
                <p className="text-sm text-slate-600 font-medium">Certified safe for babies who love to chew.</p>
              </div>

              {/* Durability */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-miko-blue">
                  <div className="text-4xl">🔨</div>
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">Tear-Proof Pages</h3>
                <p className="text-sm text-slate-600 font-medium">Thick board pages that withstand rough play.</p>
              </div>

              {/* Design */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-miko-yellow">
                  <Palette className="w-10 h-10" />
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">Vivid Colors</h3>
                <p className="text-sm text-slate-600 font-medium">High-contrast art to stimulate visual development.</p>
              </div>

              {/* Shipping */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
                  <Truck className="w-10 h-10" />
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal">Free Shipping</h3>
                <p className="text-sm text-slate-600 font-medium">On all orders above ₹499 across India.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter / Email Capture */}
      <section className="py-24 bg-gradient-to-br from-miko-blue/10 via-white to-miko-yellow/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-miko-blue/10 rounded-full text-miko-blue font-semibold text-sm mb-6">
              <Gift className="w-4 h-4" />
              Free Gift Inside
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-charcoal">
              Join Miko&apos;s Club!
            </h2>
          <p className="mt-4 text-slate-600 text-lg">
              Get <span className="font-bold text-miko-blue">10% off</span> your first order + weekly parenting tips
            </p>
            
            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Free coloring pages
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Early access to new books
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Parenting tips & activities
              </span>
            </div>

            <form className="mt-8 flex flex-col gap-3 sm:flex-row max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
                className="flex-1 rounded-full border-2 border-slate-200 px-6 py-4 text-sm focus:border-miko-blue focus:ring-miko-blue outline-none shadow-sm bg-white"
              required
            />
              <Button type="submit" size="lg" className="rounded-full bg-miko-blue hover:bg-blue-500 text-white font-bold px-8 shadow-lg shadow-miko-blue/25 btn-bounce">
              Subscribe
            </Button>
          </form>
            <p className="mt-4 text-xs text-slate-400">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
