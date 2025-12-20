import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "About Us — NitiVidya Books",
  description: "A Note for You — Mom-tested, research-backed books for little minds.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-12 min-h-screen">
      <div className="max-w-3xl">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-charcoal">About Us</h1>
        <p className="mt-3 text-slate-600 font-medium text-lg">
          A Note for You — <span className="text-slate-900">Mom-Tested, Research-Backed</span>.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 md:p-8 bg-white/85 backdrop-blur border border-white/60 rounded-[28px]">
            <div className="prose prose-slate max-w-none">
              <p>
                Hello! As a fellow mother, I created this book by integrating key insights from early childhood
                development and bilingual research.
              </p>
              <p>
                More than a book—it’s a carefully designed foundation tool.
              </p>
              <h2>Mother’s Promise</h2>
              <p>
                I have ensured the content aligns with principles suggesting that a consistent, loving, and interactive
                approach is the most fundamental way children learn.
              </p>
              <h2>Bilingual Confidence</h2>
              <p>
                Inspired by the &quot;one-parent, one-language&quot; method, this book gently nurtures bilingualism and
                connects your child to their imagination and curiosity.
              </p>
              <h2>Curious Creatures</h2>
              <p>
                Each page plants seeds of curiosity and observation.
              </p>
            </div>
          </Card>

          <Card className="p-6 md:p-8 bg-[#FFF9C4] border border-amber-100 rounded-[28px]">
            <h2 className="font-heading text-2xl font-extrabold text-charcoal">We’d love to hear from you</h2>
            <p className="mt-2 text-slate-700 font-medium">
              Email us at <span className="font-extrabold text-slate-900">nitividyabooks@gmail.com</span> or call{" "}
              <span className="font-extrabold text-slate-900">+919315383801</span>.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6 bg-white/85 backdrop-blur border border-white/60 rounded-[28px]">
            <h3 className="font-heading text-xl font-extrabold text-charcoal">Our focus</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 font-semibold">
              <li>Parent-friendly, child-first design</li>
              <li>Gentle vocabulary building</li>
              <li>Everyday curiosity and observation</li>
              <li>Confidence with two languages</li>
            </ul>
          </Card>

          <Card className="p-6 bg-white/85 backdrop-blur border border-white/60 rounded-[28px]">
            <h3 className="font-heading text-xl font-extrabold text-charcoal">Need help?</h3>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              For orders and delivery questions, the quickest path is WhatsApp support from the header.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}


