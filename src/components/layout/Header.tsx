"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cart-store";
import { SearchBar } from "./SearchBar";
import { MobileNav } from "./MobileNav";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/category/apparel", label: "Apparel" },
  { href: "/category/ceramic", label: "Ceramic" },
  { href: "/category/home-decor", label: "Home Décor" },
  { href: "/category/jewelry", label: "Jewelry" },
  { href: "/about", label: "Our Story" },
];

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-paper/95 backdrop-blur-sm shadow-[0_1px_0_rgba(49,49,48,0.08)]"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -ml-2 text-ink hover:bg-surface rounded-[12px] transition-colors"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M2.5 5h15M2.5 10h15M2.5 15h15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0" aria-label="Rastahse home">
              <Image
                src="/brand/logos/wordmark.png"
                alt="RASTAH से"
                width={140}
                height={40}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-label text-[10px] text-ink/70 hover:text-berry transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-berry opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(true)}
                className="p-2 text-ink hover:bg-surface rounded-[12px] transition-colors"
                aria-label="Search products"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M13.5 13.5 L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </motion.button>

              {/* Account */}
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link
                  href="/account"
                  className="p-2 text-ink hover:bg-surface rounded-[12px] transition-colors hidden sm:flex"
                  aria-label="My account"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Link>
              </motion.div>

              {/* Cart */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={openCart}
                className="relative p-2 text-ink hover:bg-surface rounded-[12px] transition-colors"
                aria-label={`Cart, ${totalItems} ${totalItems === 1 ? "item" : "items"}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M2 2h2l2.5 9h9l1.5-6H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8.5" cy="16.5" r="1.5" fill="currentColor" />
                  <circle cx="14.5" cy="16.5" r="1.5" fill="currentColor" />
                </svg>
                <AnimatePresence mode="wait">
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-berry text-paper text-[9px] font-label rounded-full flex items-center justify-center leading-none"
                    >
                      {totalItems > 9 ? "9+" : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile nav */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        links={NAV_LINKS}
      />
    </>
  );
}
