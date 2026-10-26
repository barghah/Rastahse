/**
 * scripts/create-admin-user.ts
 * Creates an admin account in local Supabase Auth and marks is_admin = true in profiles.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@rastahse.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";

  console.log(`Creating admin user: ${email}...`);

  // 1. Create or get user in auth.users
  const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId = userData?.user?.id;

  if (userErr) {
    if (userErr.message.includes("already registered") || userErr.message.includes("exists")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      userId = existing?.id;
      console.log(`User already exists with ID: ${userId}`);
    } else {
      throw new Error(`Failed to create user: ${userErr.message}`);
    }
  } else {
    console.log(`User created successfully with ID: ${userId}`);
  }

  if (!userId) {
    throw new Error("Unable to resolve userId.");
  }

  // 2. Upsert profile with is_admin = true
  const { error: profErr } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: "Rastahse Admin",
      phone: "+91 98765 43210",
      is_admin: true,
    },
    { onConflict: "id" }
  );

  if (profErr) {
    throw new Error(`Failed to set is_admin in profiles: ${profErr.message}`);
  }

  console.log(`\n🎉 Admin user successfully configured!`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   URL:      http://localhost:3000/admin/login`);
}

main().catch((err) => {
  console.error("Error creating admin user:", err);
  process.exit(1);
});
