import Link from "next/link";
import { SectionDivider } from "@/components/brand/SectionDivider";

export const metadata = {
  title: "Terms & Conditions — RASTAH से",
  description: "Terms and conditions for using the Rastahse website and purchasing our handcrafted products.",
};

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms & Conditions" badge="Legal">
      <p className="text-ink/60">
        By accessing or using the Rastahse website and purchasing our products, you agree to be bound by the
        following terms and conditions. Please read them carefully.
      </p>

      <PolicySection title="1. About Us">
        <p>
          Rastahse is operated by Afeedha Sherin and Salman Roshan, registered in India. Our business focuses on
          sourcing and selling authentic handcrafted goods from Indian artisans.
        </p>
      </PolicySection>

      <PolicySection title="2. Product Descriptions">
        <p>
          We make every effort to display our products accurately. However, due to the handmade nature of our
          goods, there may be slight variations in color, texture, or dimensions from product to product.
          These variations are a feature — not a flaw — of authentic craftsmanship.
        </p>
      </PolicySection>

      <PolicySection title="3. Pricing & Payment">
        <ul className="space-y-2">
          <li>All prices are in Indian Rupees (₹) and inclusive of applicable GST.</li>
          <li>We accept UPI, credit/debit cards, net banking, and EMI via Razorpay.</li>
          <li>Prices may change without prior notice.</li>
          <li>Orders will only be confirmed upon successful payment.</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. Order Cancellations">
        <p>
          You may cancel your order within <strong>12 hours</strong> of placing it by contacting us at{" "}
          <a href="mailto:orders@rastahse.com" className="text-berry hover:underline">orders@rastahse.com</a>.
          After 12 hours, orders may already be in processing or dispatch stages.
        </p>
      </PolicySection>

      <PolicySection title="5. Intellectual Property">
        <p>
          All content on this website — including brand identity, photographs, copy, and product descriptions —
          is the intellectual property of Rastahse. Unauthorized use, reproduction, or distribution is prohibited.
        </p>
      </PolicySection>

      <PolicySection title="6. Limitation of Liability">
        <p>
          Rastahse is not liable for any indirect, incidental, or consequential damages arising from the use of
          our website or products. Our liability is limited to the purchase price of the product in question.
        </p>
      </PolicySection>

      <PolicySection title="7. Governing Law">
        <p>
          These terms are governed by the laws of India. Any disputes shall be subject to the exclusive
          jurisdiction of courts in [your city], India.
        </p>
      </PolicySection>

      <PolicySection title="8. Contact">
        <p>
          For any questions about these terms, please{" "}
          <Link href="/contact" className="text-berry hover:underline">contact us</Link>.
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

      <SectionDivider motif="path" className="py-8 max-w-xl mx-auto" />
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
