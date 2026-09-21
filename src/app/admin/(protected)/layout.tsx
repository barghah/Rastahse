import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/actions/admin";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import type { ReactNode } from "react";

/**
 * Admin layout — Responsive phone-friendly layout with auth guard.
 * Features:
 * - Desktop fixed sidebar with brand mark, nav, admin email, and Sign Out
 * - Mobile sticky top header with slide-over drawer
 * - Mobile bottom quick-nav bar for thumb-friendly navigation
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  let adminEmail: string | null = null;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const { user } = await requireAdmin();
    adminEmail = user?.email ?? null;
  }

  const navLinks = [
    { href: "/admin",           label: "Dashboard", icon: "▦" },
    { href: "/admin/orders",    label: "Orders",    icon: "📦" },
    { href: "/admin/products",  label: "Products",  icon: "🪨" },
    { href: "/admin/customers", label: "Customers", icon: "👥" },
    { href: "/admin/messages",  label: "Messages",  icon: "✉️" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface text-ink antialiased">
      {/* ── Mobile Navigation (Header + Slide Drawer + Bottom Bar) ── */}
      <AdminMobileNav navLinks={navLinks} adminEmail={adminEmail} />

      {/* ── Desktop Sidebar (Hidden on mobile, visible md+) ── */}
      <aside className="hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-brand bg-paper shadow-xs min-h-screen sticky top-0 h-screen">
        {/* Brand mark */}
        <div className="px-6 py-6 border-b border-brand">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-auto shrink-0">
              <Image
                src="/brand/logos/emblem-intact.png"
                alt="RASTAH"
                width={433}
                height={808}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
            <div>
              <p className="font-label text-[11px] text-ink tracking-[0.25em] uppercase font-semibold">
                RASTAH <span className="text-berry font-serif font-medium">से</span>
              </p>
              <p className="font-body text-[10px] text-ink/40 mt-0.5">Admin Archive</p>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="flex-1 py-5 px-3.5 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] font-label text-[11.5px] text-ink/70 hover:text-berry hover:bg-surface transition-all duration-150 font-medium"
            >
              <span className="text-base leading-none text-ink/40">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Admin Footer & Sign Out */}
        <div className="p-4 border-t border-brand space-y-3 bg-surface/30">
          {adminEmail && (
            <div className="px-1">
              <p className="font-label text-[9px] text-ink/40 uppercase tracking-wider">Admin Account</p>
              <p className="font-body text-[11px] text-ink/80 font-medium truncate mt-0.5" title={adminEmail}>
                {adminEmail}
              </p>
            </div>
          )}

          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-[10px] border border-brand bg-paper font-label text-[10.5px] text-ink/60 hover:text-berry transition-colors uppercase tracking-wider font-medium shadow-2xs"
          >
            <span>← Storefront</span>
            <span className="text-xs">↗</span>
          </Link>

          {/* Prominent Log Out Button */}
          <AdminSignOutButton />
        </div>
      </aside>

      {/* ── Main Dashboard Viewport ── */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-surface pb-20 md:pb-8">
        {children}
      </main>
    </div>
  );
}
