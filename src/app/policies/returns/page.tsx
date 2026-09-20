import Link from "next/link";
import { SectionDivider } from "@/components/brand/SectionDivider";

export const metadata = {
  title: "Returns & Exchanges — RASTAH से",
  description: "Rastahse return and exchange policy — how to initiate a return and what's eligible.",
};

export default function ReturnsPage() {
  return (
    <PolicyLayout title="Returns & Exchanges" badge="Policy">
      <div className="p-5 rounded-[18px] bg-surface border border-brand">
        <p className="font-label text-[9px] text-berry mb-1">Our Commitment</p>
        <p>
          We stand behind every piece we sell. If something isn&apos;t right, we&apos;ll make it right — no complicated
          processes, no arguments.
        </p>
      </div>

      <PolicySection title="Return Window">
        <p>
          You may initiate a return within <strong>7 days</strong> of receiving your order.
          Items must be unused, unwashed, and in original packaging. Once we receive and inspect the item,
          we&apos;ll process your refund within 5–7 business days.
        </p>
      </PolicySection>

      <PolicySection title="How to Initiate a Return">
        <ol className="space-y-2 list-decimal list-inside">
          <li>
            Email us at <a href="mailto:returns@rastahse.com" className="text-berry hover:underline">returns@rastahse.com</a> with
            your order number and the reason for return.
          </li>
          <li>We&apos;ll send you a prepaid return shipping label (India only).</li>
          <li>Pack the item securely and drop it at your nearest courier pickup point.</li>
          <li>Once received and inspected, your refund will be credited within 5–7 business days.</li>
        </ol>
      </PolicySection>

      <PolicySection title="Exchanges">
        <p>
          If you&apos;d like to exchange for a different size or variant, we&apos;ll do our best to accommodate — subject
          to availability. Please{" "}
          <Link href="/contact" className="text-berry hover:underline">contact us</Link>{" "}
          within 7 days of delivery.
        </p>
      </PolicySection>

      <PolicySection title="Non-Returnable Items">
        <ul className="space-y-1.5">
          <li>Custom-made or personalized items</li>
          <li>Items on clearance or marked final sale</li>
          <li>Digital gift cards</li>
          <li>Items that show signs of use, washing, or damage</li>
        </ul>
      </PolicySection>

      <PolicySection title="Damaged or Wrong Items">
        <p>
          If you received a damaged, defective, or wrong item, please email us within 48 hours of delivery with
          photographs. We&apos;ll arrange a replacement or full refund immediately — no return needed.
        </p>
      </PolicySection>

      <PolicySection title="International Returns">
        <p>
          International customers are responsible for return shipping costs and any customs fees.
          We recommend using a trackable shipping method.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}

function PolicyLayout({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper pb-24">
      <section className="bg-surface/50 border-b border-brand py-14 sm:py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="font-label text-[10px] text-berry mb-3">{badge}</p>
          <h1 className="font-hand text-4xl sm:text-5xl text-ink leading-tight">{title}</h1>
          <p className="font-label text-[9px] text-ink/40 mt-3">Last updated: September 2026</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <div className="space-y-10 font-body text-sm text-ink/80 leading-relaxed">
          {children}
        </div>

        <div className="mt-14 pt-8 border-t border-brand flex flex-col sm:flex-row gap-3 justify-between items-center">
          <p className="font-label text-[9px] text-ink/40">Questions? We&apos;re here to help.</p>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-[12px] bg-berry text-paper font-label text-[9px] hover:bg-[#580118] transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>

      <SectionDivider motif="waves" className="py-8 max-w-xl mx-auto" />
    </div>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-hand text-2xl text-ink">{title}</h2>
      <div>{children}</div>
    </div>
  );
}
