"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AdminSignOutButton } from "./AdminSignOutButton";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface Props {
  navLinks: NavItem[];
  adminEmail?: string | null;
}

export function AdminMobileNav({ navLinks, adminEmail }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Mobile Top Sticky Bar ── */}
      <header className="md:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur-md border-b border-brand px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-auto shrink-0">
            <Image
              src="/brand/logos/emblem-intact.png"
              alt="RASTAH"
              width={433}
              height={808}
              className="w-full h-auto object-contain select-none"
              priority
            />
          </div>
          <div>
            <p className="font-label text-[11px] text-ink tracking-[0.2em] uppercase font-semibold leading-tight">
              RASTAH <span className="text-berry font-serif font-medium">से</span>
            </p>
            <p className="font-body text-[9.5px] text-ink/40 leading-none">Admin Panel</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-2.5 py-1 rounded-[8px] bg-surface border border-brand font-label text-[10px] text-ink/60 uppercase tracking-wider hover:text-berry"
          >
            Store ↗
          </Link>

          {/* Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Admin Menu"
            className="p-2 rounded-[10px] bg-surface border border-brand text-ink hover:bg-surface/80 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Slide-Over Drawer Backdrop & Panel ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-[82vw] max-w-xs bg-paper h-full flex flex-col border-r border-brand shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-brand flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-auto">
                  <Image
                    src="/brand/logos/emblem-intact.png"
                    alt="RASTAH"
                    width={433}
                    height={808}
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div>
                  <p className="font-label text-xs text-ink tracking-[0.22em] uppercase font-semibold">
                    RASTAH <span className="text-berry font-serif font-medium">से</span>
                  </p>
                  <p className="font-body text-[10px] text-ink/40">Atelier Control</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-[8px] bg-surface border border-brand flex items-center justify-center text-ink/60 hover:text-ink cursor-pointer"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Admin Info Banner */}
            {adminEmail && (
              <div className="px-5 py-3 bg-surface/60 border-b border-brand/60">
                <p className="font-label text-[9px] text-ink/40 uppercase tracking-wider">Signed in as</p>
                <p className="font-body text-xs text-ink font-semibold truncate mt-0.5">{adminEmail}</p>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-[14px] font-label text-xs uppercase tracking-wider transition-all font-semibold ${
                      isActive
                        ? "bg-berry text-paper shadow-soft"
                        : "text-ink/70 hover:text-berry hover:bg-surface"
                    }`}
                  >
                    <span className="text-lg leading-none">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer: Storefront & Sign Out */}
            <div className="p-4 border-t border-brand space-y-3 bg-surface/30">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-[12px] border border-brand bg-paper font-label text-[11px] text-ink/70 hover:text-berry transition-colors uppercase tracking-wider font-medium shadow-xs"
              >
                ← Return to Storefront
              </Link>

              {/* Prominent Log Out Button */}
              <AdminSignOutButton />
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Quick-Nav Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-brand py-1.5 px-2 flex justify-around items-center shadow-lg">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-[10px] transition-all ${
                isActive ? "text-berry font-bold" : "text-ink/50 hover:text-ink"
              }`}
            >
              <span className={`text-lg leading-none ${isActive ? "scale-110 transition-transform" : ""}`}>
                {link.icon}
              </span>
              <span className="font-label text-[9px] uppercase tracking-wider mt-1">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
