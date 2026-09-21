import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

/**
 * Admin layout — Server Component auth guard.
 * Checks session AND is_admin on every request.
 * Styled in Rastah's signature warm paper/cream atelier theme.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Skip auth check in dev when Supabase env vars not set
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/admin/login");

    const admin = await createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      // Sign out non-admin user and redirect
      await supabase.auth.signOut();
      redirect("/admin/login");
    }
  }

  const navLinks = [
    { href: "/admin",           label: "Dashboard", icon: "▦" },
    { href: "/admin/orders",    label: "Orders",    icon: "📦" },
    { href: "/admin/products",  label: "Products",  icon: "🪨" },
    { href: "/admin/messages",  label: "Messages",  icon: "✉️"  },
  ];

  return (
    <div className="min-h-screen flex bg-surface text-ink">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-brand bg-paper shadow-xs">
        {/* Brand mark */}
        <div className="px-6 py-6 border-b border-brand">
          <Link href="/admin" className="flex items-center gap-3">
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
              <p className="font-label text-[11px] text-ink tracking-[0.25em] uppercase font-medium">
                RASTAH <span className="text-berry font-serif font-medium">से</span>
              </p>
              <p className="font-body text-[10px] text-ink/40 mt-0.5">Admin Archive</p>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-5 px-3.5 space-y-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] font-label text-[11.5px] text-ink/70 hover:text-berry hover:bg-surface transition-all duration-150 font-medium"
            >
              <span className="text-base leading-none text-ink/40">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-brand space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 font-label text-[10.5px] text-ink/50 hover:text-berry transition-colors uppercase tracking-wider"
          >
            ← Storefront
          </Link>
        </div>
      </aside>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 overflow-y-auto bg-surface">
        {children}
      </main>
    </div>
  );
}
