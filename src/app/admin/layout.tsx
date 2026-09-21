import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

/**
 * Admin layout — Server Component auth guard.
 * Checks session AND is_admin on every request.
 * Renders a minimal dark sidebar with navigation.
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
      // Sign out the non-admin user and redirect
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
    <div className="min-h-screen flex" style={{ backgroundColor: "#111010" }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-56 shrink-0 flex flex-col border-r"
        style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "#161412" }}
      >
        {/* Brand mark */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <p className="font-label text-[11px] text-white/70 tracking-[0.25em] uppercase">
            RASTAH से
          </p>
          <p className="font-body text-[10px] text-white/25 mt-0.5">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-label text-[11px] text-white/50 hover:text-white hover:bg-white/5 transition-all duration-150"
            >
              <span className="text-base leading-none">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Link
            href="/"
            className="font-label text-[10px] text-white/25 hover:text-white/50 transition-colors"
          >
            ← Back to store
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
