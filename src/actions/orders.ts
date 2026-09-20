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
 */
export async function createOrder(input: CreateOrderInput) {
  const supabase = await createAdminClient();

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
