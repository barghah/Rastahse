"use server";

/**
 * actions/orders.ts
 * Server Actions for order creation and status updates.
 * Called from checkout page client components.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { CartItem } from "@/types/cart";

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
}

export interface CreateOrderInput {
  email: string;
  phone?: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: ShippingAddress;
}

/**
 * Create a pending order in Supabase and return the order id.
 * Called before initiating Razorpay payment.
 * Automatically validates and reserves stock using Postgres row locks.
 */
export async function createOrder(input: CreateOrderInput) {
  const supabase = await createAdminClient();

  // 1. Resolve variant IDs for all items in cart
  const isUUID = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
  const reservationItems: { variant_id: string; qty: number }[] = [];

  for (const item of input.items) {
    let vId = item.variantId;
    if (!isUUID(vId)) {
      const { data: vRow } = await supabase
        .from("product_variants")
        .select("id")
        .or(`product_id.eq.${item.productId},sku.eq.${item.variantId}`)
        .limit(1)
        .maybeSingle();
      if (vRow?.id) {
        vId = vRow.id;
        item.variantId = vRow.id;
      }
    }
    if (isUUID(vId)) {
      reservationItems.push({ variant_id: vId, qty: item.quantity });
    }
  }

  // 2. Insert pending order
  const { data, error } = await supabase
    .from("orders")
    .insert({
      email: input.email,
      phone: input.phone ?? null,
      status: "pending",
      items: input.items as unknown as import("@/types/supabase").Json,
      subtotal: input.subtotal,
      shipping_fee: input.shippingFee,
      total: input.total,
      shipping_address: input.shippingAddress as unknown as import("@/types/supabase").Json,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createOrder] Supabase error:", error);
    throw new Error("Failed to create order. Please try again.");
  }

  // 3. Atomically reserve stock
  if (reservationItems.length > 0) {
    const { error: reserveErr } = await supabase.rpc("reserve_stock", {
      p_order_id: data.id,
      p_items_json: reservationItems,
      p_actor: input.email || "storefront_checkout",
    });

    if (reserveErr) {
      await supabase.from("orders").delete().eq("id", data.id);
      console.warn("[createOrder] Stock reservation rejected:", reserveErr.message);
      throw new Error(`One or more items are out of stock: ${reserveErr.message}`);
    }
  }

  return { orderId: data.id };
}

/**
 * Store the Razorpay order id on the pending order.
 * Called after Razorpay order is created on the backend.
 */
export async function setRazorpayOrderId(orderId: string, razorpayOrderId: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ razorpay_order_id: razorpayOrderId })
    .eq("id", orderId);

  if (error) throw new Error("Failed to update order with Razorpay ID.");
}

/**
 * Mark an order as paid after successful Razorpay payment verification.
 */
export async function markOrderPaid(orderId: string, razorpayPaymentId: string) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id: razorpayPaymentId,
    })
    .eq("id", orderId);

  if (error) throw new Error("Failed to mark order as paid.");
}

/**
 * Fetch orders for a given email (guest lookup) — server only.
 */
export async function getOrdersByEmail(email: string) {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
