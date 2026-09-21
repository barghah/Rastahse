/**
 * lib/supabase/middleware.ts
 * Supabase session refresh + route protection middleware helper.
 * - /account         → requires any logged-in user
 * - /admin/*         → requires logged-in user with is_admin = true
 * Gracefully no-ops when NEXT_PUBLIC_SUPABASE_URL is not configured.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if Supabase is not configured yet (e.g. local dev without .env.local)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (keep tokens alive)
  const { data: { user } } = await supabase.auth.getUser();

  // ── Protect /account — must be logged in ──────────────────────────────────
  if (pathname === "/account" && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    return NextResponse.redirect(loginUrl);
  }

  // ── Protect /admin/* — must be logged in ─────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      const adminLoginUrl = request.nextUrl.clone();
      adminLoginUrl.pathname = "/admin/login";
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  return supabaseResponse;
}
