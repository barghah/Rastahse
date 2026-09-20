import Link from "next/link";
import { SectionDivider } from "@/components/brand/SectionDivider";

export const metadata = {
  title: "Shipping & Delivery — RASTAH से",
  description: "Shipping policy for Rastahse — delivery timelines, carriers, and international shipping information.",
};

export default function ShippingPage() {
  return (
    <PolicyLayout title="Shipping & Delivery" badge="Policy">
      <PolicySection title="Processing Time">
        <p>
          Every piece in our collection is made-to-order or sourced directly from individual artisan households.
          Please allow <strong>3–5 business days</strong> for us to prepare and dispatch your order.
          For custom or limited-edition pieces, processing may take up to 7 business days — we&apos;ll update you via email.
        </p>
      </PolicySection>

      <PolicySection title="Domestic Shipping (India)">
        <ul className="space-y-2">
          <li>Standard delivery: <strong>5–7 business days</strong> after dispatch.</li>
          <li>Express delivery (select pincodes): <strong>2–3 business days</strong>.</li>
          <li>Free shipping on orders above ₹1,499.</li>
          <li>Flat ₹99 shipping for orders below ₹1,499.</li>
          <li>We ship via Shiprocket using DTDC, Delhivery, or BlueDart depending on your location.</li>
        </ul>
      </PolicySection>

      <PolicySection title="International Shipping">
        <p>
          We currently ship to the United States, United Kingdom, UAE, Canada, Australia, Singapore, and most EU countries.
          International orders are shipped via DHL Express or FedEx International Priority.
        </p>
        <ul className="space-y-2 mt-3">
          <li>Estimated delivery: <strong>7–14 business days</strong>.</li>
          <li>International shipping rate: calculated at checkout based on weight and destination.</li>
          <li>Customs duties and import taxes are the responsibility of the buyer.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Tracking">
        <p>
          Once your order is dispatched, you&apos;ll receive a tracking number via email and SMS.
          You can track your shipment directly on the carrier&apos;s website.
        </p>
      </PolicySection>

      <PolicySection title="Delays & Lost Packages">
        <p>
          While we do our best to ensure timely delivery, delays can sometimes occur due to weather, festivals,
          or carrier issues. If your order hasn&apos;t arrived within the estimated window, please{" "}
          <Link href="/contact" className="text-berry hover:underline">contact us</Link> and
          we&apos;ll track it down for you.
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
          <p className="font-label text-[9px] text-ink/40">
            Questions? We&apos;re here to help.
          </p>
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
      <div className="space-y-3 pl-0">{children}</div>
    </div>
  );
}
