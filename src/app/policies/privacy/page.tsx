import Link from "next/link";
import { SectionDivider } from "@/components/brand/SectionDivider";

export const metadata = {
  title: "Privacy Policy — RASTAH से",
  description: "Privacy policy for Rastahse — how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" badge="Legal">
      <p className="text-ink/60">
        Rastahse (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your personal
        information. This policy explains how we collect, use, and safeguard your data when you visit our website or
        make a purchase.
      </p>

      <PolicySection title="Information We Collect">
        <ul className="space-y-2">
          <li><strong>Contact information:</strong> Name, email address, phone number, and delivery address.</li>
          <li><strong>Payment information:</strong> Processed securely via Razorpay. We never store card details.</li>
          <li><strong>Usage data:</strong> Pages visited, products viewed, and search queries — used to improve our service.</li>
          <li><strong>Cookies:</strong> Session and preference cookies to maintain your cart and wishlist.</li>
        </ul>
      </PolicySection>

      <PolicySection title="How We Use Your Information">
        <ul className="space-y-2">
          <li>To process and fulfill your orders.</li>
          <li>To send order confirmations, shipping updates, and delivery notifications.</li>
          <li>To respond to your inquiries and customer service requests.</li>
          <li>To improve our website, products, and customer experience.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Data Sharing">
        <p>
          We do not sell, trade, or rent your personal information to third parties. We share data only with
          service providers necessary to operate our business:
        </p>
        <ul className="space-y-2 mt-3">
          <li><strong>Razorpay</strong> — payment processing</li>
          <li><strong>Shiprocket / DTDC / Delhivery / BlueDart</strong> — order fulfillment and shipping</li>
          <li><strong>Supabase</strong> — secure database hosting (EU servers, GDPR compliant)</li>
        </ul>
      </PolicySection>

      <PolicySection title="Cookies">
        <p>
          We use essential cookies to maintain your cart and wishlist across sessions. We do not use advertising
          or cross-site tracking cookies. You can clear cookies in your browser at any time.
        </p>
      </PolicySection>

      <PolicySection title="Your Rights">
        <p>You have the right to:</p>
        <ul className="space-y-1.5 mt-2">
          <li>Access the personal data we hold about you.</li>
          <li>Request correction or deletion of your data.</li>
          <li>Withdraw consent for marketing communications at any time.</li>
        </ul>
        <p className="mt-3">
          To exercise these rights, email us at{" "}
          <a href="mailto:privacy@rastahse.com" className="text-berry hover:underline">privacy@rastahse.com</a>.
        </p>
      </PolicySection>

      <PolicySection title="Data Security">
        <p>
          All data is transmitted over HTTPS. Payment data is handled exclusively by Razorpay, which is PCI-DSS
          compliant. We implement industry-standard security measures to protect your information.
        </p>
      </PolicySection>

      <PolicySection title="Changes to This Policy">
        <p>
          We may update this privacy policy from time to time. Any changes will be posted on this page with an
          updated date. Continued use of our website constitutes acceptance of the updated policy.
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

      <SectionDivider motif="river" className="py-8 max-w-xl mx-auto" />
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
