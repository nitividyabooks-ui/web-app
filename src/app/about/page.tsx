import { Heart, BookOpen, Shield, Sparkles, Users, CheckCircle, ShoppingBag, Factory } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Us — NitiVidya Books",
  description:
    "Meet the mom behind NitiVidya Books. Learn about our mission to create research-backed, bilingual children's books for Indian families.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: Heart,
    iconClass: "text-terracotta",
    bgClass: "bg-blush",
    title: "Child-First Design",
    description: "Every element is designed with little hands and curious minds in mind.",
  },
  {
    icon: BookOpen,
    iconClass: "text-evergreen",
    bgClass: "bg-evergreen-soft",
    title: "Research-Backed",
    description: "Content informed by early childhood development and bilingual learning research.",
  },
  {
    icon: Shield,
    iconClass: "text-evergreen",
    bgClass: "bg-evergreen-soft",
    title: "Safety First",
    description: "Non-toxic materials and rounded corners — safe for babies who love to explore.",
  },
  {
    icon: Sparkles,
    iconClass: "text-marigold-deep",
    bgClass: "bg-marigold-soft",
    title: "Cultural Connection",
    description: "Stories that celebrate Indian traditions while building global perspectives.",
  },
];

const TRUST_POINTS = [
  {
    title: "Bilingual Learning",
    description:
      "Our books feature both Hindi and English, helping children naturally develop vocabulary in both languages through daily reading.",
  },
  {
    title: "Age-Appropriate Content",
    description:
      "Each book is carefully designed for specific developmental stages, with themes and vocabulary that resonate with young minds.",
  },
  {
    title: "Durable & Safe",
    description:
      "High-quality pages, rounded corners, and non-toxic inks mean our books can withstand enthusiastic toddler handling.",
  },
  {
    title: "Beautiful Illustrations",
    description:
      "High-contrast, vibrant artwork stimulates visual development while capturing children's imagination.",
  },
  {
    title: "Parent-Tested",
    description:
      "Every book is tested with real families before publication to ensure it works in real-world reading sessions.",
  },
  {
    title: "Made in India",
    description:
      "Proudly designed and printed in India, supporting local artisans and reducing our environmental footprint.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <section className="bg-paper-deep border-b border-hairline py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-deep">
              Our story
            </p>
            <h1 className="mt-4 font-heading text-display font-semibold text-ink leading-tight">
              Big wisdom for little minds
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink-soft leading-relaxed">
              Creating thoughtful, research-backed books that help Indian children learn, grow,
              and connect with their culture.
            </p>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
              {/* Founder photo — asset pending from owner */}
              <div className="md:col-span-2">
                <div className="aspect-square bg-paper-deep rounded-card flex items-center justify-center border border-dashed border-hairline-strong">
                  <div className="text-center p-6">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-card">
                      <Users className="w-10 h-10 text-evergreen" />
                    </div>
                    <p className="text-sm text-ink-soft font-medium">Founder Photo</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 space-y-6">
                <h2 className="font-heading text-headline font-semibold text-ink">
                  A mother&apos;s mission
                </h2>
                <div className="space-y-4 text-ink-soft leading-relaxed">
                  <p>
                    Hello! I&apos;m the founder of NitiVidya Books, and like you, I&apos;m a parent
                    who wants the very best for my child. When I became a mother, I searched
                    everywhere for books that would help my little one learn both Hindi and English
                    naturally — books that reflected our culture while meeting international quality
                    standards.
                  </p>
                  <p>
                    When I couldn&apos;t find what I was looking for, I decided to create it myself.
                    Drawing on research in early childhood development and bilingual education, I
                    designed the Miko Series — books that are as safe and durable as they are
                    educational and beautiful.
                  </p>
                  <p className="font-semibold text-ink">
                    Every book we create is mom-tested, research-backed, and made with love.
                    Because your child deserves nothing less.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-paper-deep border-y border-hairline">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-headline font-semibold text-ink">What we believe</h2>
            <p className="mt-4 text-ink-soft max-w-2xl mx-auto">
              Our values guide everything we create — from the stories we tell to the materials we
              choose.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="p-6 bg-surface rounded-card border border-hairline shadow-card text-center"
              >
                <div
                  className={`w-14 h-14 ${value.bgClass} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <value.icon className={`w-7 h-7 ${value.iconClass}`} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-ink">{value.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why parents trust us */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-headline font-semibold text-ink">
                Why parents trust us
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {TRUST_POINTS.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 p-5 bg-surface rounded-card border border-hairline"
                >
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-evergreen" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm text-ink-soft">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust line */}
      <section className="py-12 bg-paper-deep border-y border-hairline">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-ink-soft">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span className="text-sm font-medium">Available on Amazon.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Non-toxic inks &amp; materials</span>
            </div>
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5" />
              <span className="text-sm font-medium">Designed &amp; printed in India</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-evergreen-deep">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-headline font-semibold text-paper">
              Let&apos;s connect
            </h2>
            <p className="mt-4 text-paper/70 text-lg">
              Have questions, feedback, or just want to say hello? We&apos;d love to hear from you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-12 px-8 bg-paper text-ink font-bold rounded-btn hover:bg-paper-deep transition-colors"
              >
                Contact Us
              </Link>
              <a
                href="mailto:nitividyabooks@gmail.com"
                className="inline-flex items-center justify-center h-12 px-8 bg-paper/10 text-paper font-bold rounded-btn hover:bg-paper/20 transition-colors border border-paper/20"
              >
                nitividyabooks@gmail.com
              </a>
            </div>
            <p className="mt-6 text-paper/60 text-sm">
              Or call us at <span className="font-semibold text-paper/80">+91 93153 83801</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
