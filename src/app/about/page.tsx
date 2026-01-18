import { Card } from "@/components/ui/Card";
import { Heart, BookOpen, Shield, Sparkles, Users, Award, CheckCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Us — NitiVidya Books",
  description: "Meet the mom behind NitiVidya Books. Learn about our mission to create research-backed, bilingual children's books for Indian families.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-miko-blue/10 via-white to-miko-yellow/10 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-miko-blue/10 rounded-full text-miko-blue font-semibold text-sm mb-6">
              <Heart className="w-4 h-4 fill-miko-blue" />
              Our Story
            </span>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-charcoal leading-tight">
              Big Wisdom for<br />
              <span className="text-miko-blue">Little Minds</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed">
              Creating thoughtful, research-backed books that help Indian children 
              learn, grow, and connect with their culture.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center">
              {/* Photo Placeholder */}
              <div className="md:col-span-2">
                <div className="aspect-square bg-gradient-to-br from-miko-blue/20 to-miko-yellow/20 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-300">
                  <div className="text-center p-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Users className="w-10 h-10 text-miko-blue" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Founder Photo</p>
                  </div>
                </div>
      </div>

              {/* Story Content */}
              <div className="md:col-span-3 space-y-6">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal">
                  A Mother&apos;s Mission
                </h2>
                <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                    Hello! I&apos;m the founder of NitiVidya Books, and like you, I&apos;m a parent who wants 
                    the very best for my child. When I became a mother, I searched everywhere for books 
                    that would help my little one learn both Hindi and English naturally—books that 
                    reflected our culture while meeting international quality standards.
              </p>
              <p>
                    When I couldn&apos;t find what I was looking for, I decided to create it myself. 
                    Drawing on research in early childhood development and bilingual education, 
                    I designed the Miko Series—books that are as safe and durable as they are 
                    educational and beautiful.
                  </p>
                  <p className="font-medium text-charcoal">
                    Every book we create is mom-tested, research-backed, and made with love. 
                    Because your child deserves nothing less.
              </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 md:py-24 bg-soft/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal">
              What We Believe
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Our values guide everything we create—from the stories we tell to the materials we choose.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-miko-pink" />
              </div>
              <h3 className="font-heading font-bold text-lg text-charcoal">Child-First Design</h3>
              <p className="mt-2 text-sm text-slate-500">
                Every element is designed with little hands and curious minds in mind.
              </p>
            </Card>

            <Card className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-miko-blue" />
              </div>
              <h3 className="font-heading font-bold text-lg text-charcoal">Research-Backed</h3>
              <p className="mt-2 text-sm text-slate-500">
                Content informed by early childhood development and bilingual learning research.
              </p>
            </Card>

            <Card className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-heading font-bold text-lg text-charcoal">Safety First</h3>
              <p className="mt-2 text-sm text-slate-500">
                Non-toxic materials and rounded corners—safe for babies who love to explore.
              </p>
            </Card>

            <Card className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="font-heading font-bold text-lg text-charcoal">Cultural Connection</h3>
              <p className="mt-2 text-sm text-slate-500">
                Stories that celebrate Indian traditions while building global perspectives.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Parents Trust Us */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-charcoal">
                Why Parents Trust Us
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Bilingual Learning",
                  description: "Our books feature both Hindi and English, helping children naturally develop vocabulary in both languages through daily reading."
                },
                {
                  title: "Age-Appropriate Content",
                  description: "Each book is carefully designed for specific developmental stages, with themes and vocabulary that resonate with young minds."
                },
                {
                  title: "Durable & Safe",
                  description: "High-quality pages, rounded corners, and non-toxic inks mean our books can withstand enthusiastic toddler handling."
                },
                {
                  title: "Beautiful Illustrations",
                  description: "High-contrast, vibrant artwork stimulates visual development while capturing children's imagination."
                },
                {
                  title: "Parent-Tested",
                  description: "Every book is tested with real families before publication to ensure it works in real-world reading sessions."
                },
                {
                  title: "Made in India",
                  description: "Proudly designed and printed in India, supporting local artisans and reducing our environmental footprint."
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-100">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-charcoal">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Awards & Recognition Placeholder */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-slate-400">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6" />
              <span className="text-sm font-medium">Featured on Amazon.in</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              <span className="text-sm font-medium">Non-Toxic Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6" />
              <span className="text-sm font-medium">500+ Happy Families</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-miko-blue to-blue-600">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              Let&apos;s Connect
            </h2>
            <p className="mt-4 text-white/80 text-lg">
              Have questions, feedback, or just want to say hello? We&apos;d love to hear from you!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-miko-blue font-bold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Contact Us
              </Link>
              <a
                href="mailto:nitividyabooks@gmail.com"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
              >
                nitividyabooks@gmail.com
              </a>
        </div>
            <p className="mt-6 text-white/60 text-sm">
              Or call us at <span className="font-semibold text-white/80">+91 9315383801</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


