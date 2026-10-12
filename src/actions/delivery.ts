"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/actions/admin";

// Day numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export type DeliverySettings = {
  activeDays: number[]; // e.g. [0, 2] = Sunday & Tuesday
};

const SETTINGS_KEY = "dispatch_days";

/** Read active dispatch days from Supabase. Falls back to [0, 2] (Sun, Tue). */
export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin.from("delivery_settings") as any)
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();
    if (data?.value) {
      return { activeDays: data.value as number[] };
    }
  } catch {
    // Table may not exist yet — use defaults
  }
  return { activeDays: [0, 2] };
}

/** Save active dispatch days to Supabase. */
export async function saveDeliverySettings(
  activeDays: number[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const admin = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from("delivery_settings") as any).upsert(
      { key: SETTINGS_KEY, value: activeDays, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save settings.",
    };
  }
}
