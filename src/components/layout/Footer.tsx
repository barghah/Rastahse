"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { site } from "@content/site";

const FOOTER_LINKS = {
  Shop: [
    { href: "/shop", label: "All Objects" },
    { href: "/category/apparel", label: "Apparel" },
    { href: "/category/ceramic", label: "Ceramic" },
    { href: "/category/home-decor", label: "Home Décor" },
    { href: "/category/jewelry", label: "Jewelry" },
  ],
  Info: [
    { href: "/about", label: "Our Story" },
    { href: "/contact", label: "Contact" },
    { href: "/track", label: "Track Order" },
    { href: "/account", label: "My Account" },
  ],
  Policies: [
    { href: "/policies/shipping", label: "Shipping & Delivery" },
    { href: "/policies/returns", label: "Returns & Exchanges" },
    { href: "/policies/privacy", label: "Privacy Policy" },
    { href: "/policies/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-surface border-t border-brand mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" aria-label="Rastahse home">
              <Image
                src="/brand/logos/wordmark.png"
                alt="RASTAH से"
                width={120}
                height={36}
                className="h-8 w-auto object-contain mb-4"
              />
            </Link>
            <p className="font-body text-sm text-ink/60 leading-relaxed max-w-xs">
              {site.description}
            </p>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 font-label text-[10px] text-ink/50 hover:text-berry transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              @rastahse
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="font-label text-[10px] text-ink/40 mb-4">{category}</p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-ink/60 hover:text-berry transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-brand flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-label text-[9px] text-ink/30">
            © {new Date().getFullYear()} Rastahse. Made with care in India.
          </p>

          {/* Motif mark */}
          <div className="opacity-20">
            <Image
              src="/brand/logos/mark-large.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              aria-hidden="true"
            />
          </div>

          <p className="font-label text-[9px] text-ink/30">
            Payments secured by Razorpay
          </p>
        </div>
      </div>
    </footer>
  );
}
