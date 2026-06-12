import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = {
  title: "Contact Us — NitiVidya Books",
  description: "Questions, feedback, or bulk orders? Send us a message.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-paper">
      <section className="bg-paper-deep border-b border-hairline">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-deep">
            We reply fast
          </p>
          <h1 className="mt-3 font-heading text-display font-semibold text-ink">Contact us</h1>
          <p className="mt-4 text-lg text-ink-soft max-w-xl">
            Have a question about our books, delivery, or anything else? We&apos;re happy to help.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="p-6 md:p-8 bg-surface border border-hairline rounded-card shadow-card">
              <ContactForm />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-surface border border-hairline rounded-card shadow-card">
              <h2 className="font-heading text-xl font-semibold text-ink">Reach us directly</h2>
              <div className="mt-3 space-y-2 text-sm text-ink-soft">
                <div>
                  Email: <span className="font-semibold text-ink">nitividyabooks@gmail.com</span>
                </div>
                <div>
                  Phone: <span className="font-semibold text-ink">+91 93153 83801</span>
                </div>
                <div>
                  Address:{" "}
                  <span className="font-semibold text-ink">
                    208 Basera Apartment, Block E, Sector 56, Gurugram, Haryana 122011
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                For order help, you can also reach out on WhatsApp from the header.
              </p>
            </div>

            <div className="p-6 bg-marigold-soft rounded-card">
              <h3 className="font-heading text-lg font-semibold text-ink">Bulk &amp; gifting</h3>
              <p className="mt-2 text-sm text-ink-soft">
                Interested in bulk orders for schools, daycares, or gifting? Send a note with
                quantity and delivery city.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
