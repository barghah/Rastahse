"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { BerryDot } from "@/components/brand/SectionDivider";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileNav({ open, onClose, links }: MobileNavProps) {
  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.nav
            className="fixed top-0 left-0 bottom-0 z-[81] w-72 bg-paper flex flex-col"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            aria-label="Mobile navigation"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-brand">
              <Link href="/" onClick={onClose}>
                <Image
                  src="/brand/logos/wordmark.png"
                  alt="RASTAH से"
                  width={100}
                  height={30}
                  className="h-6 w-auto object-contain"
                />
              </Link>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface rounded-[8px] transition-colors"
                aria-label="Close navigation"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-[12px] font-label text-[11px] text-ink/70 hover:text-berry hover:bg-surface transition-colors group"
                  >
                    <BerryDot className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-brand">
              <div className="flex gap-4">
                <Link href="/account" onClick={onClose} className="font-label text-[10px] text-ink/50 hover:text-berry transition-colors">
                  Account
                </Link>
                <Link href="/track" onClick={onClose} className="font-label text-[10px] text-ink/50 hover:text-berry transition-colors">
                  Track Order
                </Link>
                <Link href="/contact" onClick={onClose} className="font-label text-[10px] text-ink/50 hover:text-berry transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
