import type { Metadata } from "next";
import { getStorefrontProducts } from "@/lib/products";
import { getActiveTestimonials } from "@/lib/testimonials";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/ui/TrustStrip";
import { MikoShelf } from "@/components/home/MikoShelf";
import { MikoBundles } from "@/components/products/MikoBundles";
import { BrandStory } from "@/components/home/BrandStory";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { LookInside } from "@/components/home/LookInside";
import { PrintablesHook } from "@/components/home/PrintablesHook";
import { YouTubeChannelSection } from "@/components/home/YouTubeChannelSection";
import { LeadCaptureBand } from "@/components/home/LeadCaptureBand";

export const metadata: Metadata = {
    title: "NitiVidya Books - Indian Story Books for Kids Ages 0-5",
    description:
        "Bilingual Hindi-English picture books for children aged 0-5. The Miko series brings Indian festivals, values, and first words to your child's bookshelf. Free shipping over ₹499.",
    alternates: { canonical: "/" },
};

export default async function Home() {
    const allProducts = await getStorefrontProducts();
    const testimonials = await getActiveTestimonials();
    const mikoSeriesProducts = allProducts
        .filter((p) => p.collections?.includes("miko-series"))
        .sort((a, b) => a.heroPriority - b.heroPriority);

    return (
        <div className="flex flex-col min-h-screen font-body">
            <Hero products={mikoSeriesProducts.length > 0 ? mikoSeriesProducts : allProducts} />

            <TrustStrip />

            <MikoShelf products={mikoSeriesProducts} />

            {mikoSeriesProducts.length > 0 && (
                <section className="pb-14 lg:pb-20 bg-paper">
                    <div className="container mx-auto px-4 md:px-6">
                        <MikoBundles products={mikoSeriesProducts} location="home_bundle" />
                    </div>
                </section>
            )}

            <BrandStory />

            <TestimonialSection testimonials={testimonials} />

            <LookInside products={allProducts} />

            <PrintablesHook />

            <YouTubeChannelSection />

            <LeadCaptureBand />
        </div>
    );
}
