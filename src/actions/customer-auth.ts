"use server";

/**
 * src/actions/customer-auth.ts
 * Dedicated Server Actions for Customer Authentication, Multi-Address Management,
 * and Order Tracking.
 */

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddressInput {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface ShipmentEventItem {
  id: string;
  sr_status: string;
  mapped_status: string;
  location?: string | null;
  occurred_at: string;
}

export interface CustomerShipment {
  id: string;
  kind: "forward" | "return";
  awb?: string | null;
  courier_name?: string | null;
  tracking_url?: string | null;
  status: string;
  etd?: string | null;
  pickup_scheduled_for?: string | null;
  events: ShipmentEventItem[];
}

export interface CustomerOrder {
  id: string;
  created_at: string;
  payment_method: string;
  payment_status: string;
  delivery_status: string;
  fulfillment_mode?: string | null;
  total: number;
  subtotal: number;
  shipping_fee: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
    image?: string;
    variantId?: string;
  }>;
  shipping_address: {
    fullName?: string;
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  } | null;
  shipments: CustomerShipment[];
}

// ── 1. CUSTOMER AUTHENTICATION ──────────────────────────────────────────────

export async function customerSignInAction(input: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!email || !password) {
      return { success: false, error: "Please provide both email and password." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sign in";
    return { success: false, error: message };
  }
}

export async function customerSignUpAction(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    const fullName = input.fullName.trim();
    const phone = input.phone?.trim();

    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }
    if (!fullName) {
      return { success: false, error: "Please enter your name." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: fullName,
          phone: phone || null,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Link any existing guest orders with this email to the new user ID
    if (data.user?.id) {
      const adminClient = await createAdminClient();
      await adminClient
        .from("orders")
        .update({ user_id: data.user.id })
        .eq("email", email)
        .is("user_id", null);
    }

    revalidatePath("/account");
    revalidatePath("/checkout");
    return {
      success: true,
      message: data.session ? "Account created successfully!" : "Account created! You can now sign in.",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to register";
    return { success: false, error: message };
  }
}

export async function customerSignOutAction(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/account");
  revalidatePath("/checkout");
  return { success: true };
}

export async function getCustomerSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    displayName: profile?.display_name || user.user_metadata?.display_name || "Valued Collector",
    phone: profile?.phone || user.phone || user.user_metadata?.phone || null,
  };
}

// ── 2. ADDRESS MANAGEMENT (MAX 3) ───────────────────────────────────────────

export async function getCustomerAddressesAction(): Promise<CustomerAddress[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getCustomerAddressesAction] Error:", error);
    return [];
  }

  return (data as CustomerAddress[]) || [];
}

export async function saveCustomerAddressAction(
  input: CustomerAddressInput
): Promise<{ success: boolean; error?: string; address?: CustomerAddress }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Please log in to manage addresses." };
  }

  // Basic validation
  if (!input.fullName.trim() || !input.phone.trim() || !input.line1.trim() || !input.city.trim() || !input.state.trim() || !input.pincode.trim()) {
    return { success: false, error: "Please fill in all mandatory address fields." };
  }

  // Check 3 address limit if creating new
  if (!input.id) {
    const { count, error: countErr } = await supabase
      .from("customer_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countErr) {
      return { success: false, error: countErr.message };
    }

    if ((count ?? 0) >= 3) {
      return {
        success: false,
        error: "You can save a maximum of 3 delivery addresses. Please edit or delete an existing one.",
      };
    }
  }

  // If this address is set as default (or if it's the very first address), clear other defaults
  const isDefault = input.isDefault ?? false;
  if (isDefault) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  if (input.id) {
    // Update existing
    const { data, error } = await supabase
      .from("customer_addresses")
      .update({
        label: input.label.trim() || "Home",
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        line1: input.line1.trim(),
        line2: input.line2?.trim() || null,
        city: input.city.trim(),
        state: input.state.trim(),
        pincode: input.pincode.trim(),
        is_default: isDefault,
      })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true, address: data as CustomerAddress };
  } else {
    // Insert new
    // Check if this is the first address; if so, make it default automatically
    const { count } = await supabase
      .from("customer_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const makeDefault = isDefault || (count === 0);

    const { data, error } = await supabase
      .from("customer_addresses")
      .insert({
        user_id: user.id,
        label: input.label.trim() || "Home",
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
        line1: input.line1.trim(),
        line2: input.line2?.trim() || null,
        city: input.city.trim(),
        state: input.state.trim(),
        pincode: input.pincode.trim(),
        is_default: makeDefault,
      })
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true, address: data as CustomerAddress };
  }
}

export async function deleteCustomerAddressAction(addressId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  // If deleted address was default, ensure one of the remaining ones becomes default
  const { data: remaining } = await supabase
    .from("customer_addresses")
    .select("id, is_default")
    .eq("user_id", user.id);

  if (remaining && remaining.length > 0) {
    const hasDefault = remaining.some((r) => r.is_default);
    if (!hasDefault) {
      await supabase
        .from("customer_addresses")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }
  }

  revalidatePath("/account");
  revalidatePath("/checkout");
  return { success: true };
}

export async function setDefaultAddressAction(addressId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Set all to false
  await supabase
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);

  // Set target to true
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account");
  revalidatePath("/checkout");
  return { success: true };
}

// ── 3. CUSTOMER ORDERS & LIVE TRACKING ───────────────────────────────────────

export async function getCustomerOrdersAction(): Promise<CustomerOrder[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const adminClient = await createAdminClient();

  // Look up orders either linked directly to this user_id or with matching email
  let query = adminClient
    .from("orders")
    .select(`
      id,
      created_at,
      payment_method,
      payment_status,
      delivery_status,
      fulfillment_mode,
      total,
      subtotal,
      shipping_fee,
      items,
      shipping_address
    `);

  if (user.email) {
    query = query.or(`user_id.eq.${user.id},email.eq.${user.email}`);
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data: orders, error } = await query.order("created_at", { ascending: false });

  if (error || !orders) {
    console.error("[getCustomerOrdersAction] Error fetching orders:", error);
    return [];
  }

  if (orders.length === 0) return [];

  // Fetch all shipments for these orders
  const orderIds = orders.map((o) => o.id);
  const { data: shipments } = await adminClient
    .from("shipments")
    .select("id, order_id, kind, awb, courier_name, tracking_url, status, etd, pickup_scheduled_for")
    .in("order_id", orderIds);

  const shipmentIds = (shipments || []).map((s) => s.id);

  // Fetch tracking events for these shipments
  let events: Array<{
    id: string;
    shipment_id: string;
    sr_status: string;
    mapped_status: string;
    location: string | null;
    occurred_at: string;
  }> = [];

  if (shipmentIds.length > 0) {
    const { data: evts } = await adminClient
      .from("shipment_events")
      .select("id, shipment_id, sr_status, mapped_status, location, occurred_at")
      .in("shipment_id", shipmentIds)
      .order("occurred_at", { ascending: true });
    events = evts || [];
  }

  // Combine data
  return orders.map((order) => {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const orderShipments: CustomerShipment[] = (shipments || [])
      .filter((s) => s.order_id === order.id)
      .map((s) => ({
        id: s.id,
        kind: s.kind as "forward" | "return",
        awb: s.awb,
        courier_name: s.courier_name,
        tracking_url: s.tracking_url,
        status: s.status,
        etd: s.etd,
        pickup_scheduled_for: s.pickup_scheduled_for,
        events: events
          .filter((e) => e.shipment_id === s.id)
          .map((e) => ({
            id: e.id,
            sr_status: e.sr_status,
            mapped_status: e.mapped_status,
            location: e.location,
            occurred_at: e.occurred_at,
          })),
      }));

    return {
      id: order.id,
      created_at: order.created_at,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      delivery_status: order.delivery_status,
      fulfillment_mode: order.fulfillment_mode,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shipping_fee: Number(order.shipping_fee),
      items: (rawItems as any[]).map((it) => ({
        name: it?.name || it?.title || "Handcrafted Piece",
        qty: Number(it?.qty || it?.quantity || 1),
        price: Number(it?.price || 0),
        image: it?.image || it?.imageUrl,
        variantId: it?.variantId,
      })),
      shipping_address: order.shipping_address as CustomerOrder["shipping_address"],
      shipments: orderShipments,
    };
  });
}
