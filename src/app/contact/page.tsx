import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata = {
  title: "Contact Us — NitiVidya Books",
  description: "Questions, feedback, or bulk orders? Send us a message.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-12 min-h-screen">
      <div className="max-w-3xl">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-charcoal">Contact Us</h1>
        <p className="mt-3 text-slate-600 font-medium text-lg">
          Have a question about our books, delivery, or anything else? We’re happy to help.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6 md:p-8 bg-white/85 backdrop-blur border border-white/60 rounded-[28px]">
            <ContactForm />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6 bg-white/85 backdrop-blur border border-white/60 rounded-[28px]">
            <h2 className="font-heading text-xl font-extrabold text-charcoal">Reach us directly</h2>
            <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
              <div>
                Email: <span className="text-slate-900">nitividyabooks@gmail.com</span>
              </div>
              <div>
                Phone: <span className="text-slate-900">+919315383801</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 font-medium">
              For order help, you can also reach out on WhatsApp from the header.
            </p>
          </Card>

          <Card className="p-6 bg-[#FFF9C4] border border-amber-100 rounded-[28px]">
            <h3 className="font-heading text-lg font-extrabold text-charcoal">Bulk & gifting</h3>
            <p className="mt-2 text-sm text-slate-700 font-medium">
              Interested in bulk orders for schools, daycares, or gifting? Send a note with quantity and delivery city.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}


