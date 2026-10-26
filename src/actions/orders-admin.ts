/**
 * src/actions/orders-admin.ts
 * Dedicated server actions for Admin Orders management and Shiprocket booking lifecycle.
 */

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { shiprocket } from "@/lib/shiprocket/client";
import type { DeliveryStatus, PaymentStatus } from "@/lib/shiprocket/types";

// ─── List Query Types ─────────────────────────────────────────────────────────

export interface AdminOrdersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  paymentFilter?: string;
  deliveryFilter?: string;
  quickApprovalOnly?: boolean;
}

export interface AdminOrderSummary {
  id: string;
  created_at: string;
  email: string;
  phone: string | null;
  payment_method: "razorpay" | "cod";
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  fulfillment_mode: "shiprocket" | "local" | null;
  needs_attention: boolean;
  total: number;
  subtotal: number;
  shipping_fee: number;
  shipping_address: {
    name?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  tracking_number: string | null;
  delivered_at: string | null;
  expected_delivery_date: string | null;
  items_count: number;
  items_summary: string;
  courier_name: string | null;
  handover_method: "pickup" | "dropoff" | null;
  label_url: string | null;
}

export interface AdminOrdersListResult {
  orders: AdminOrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: {
    all: number;
    waiting_approval: number;
    pending_dropoff: number;
    in_transit: number;
    delivered: number;
    retrying: number;
    returned: number;
    cancelled: number;
    paid: number;
    cod: number;
    refunded: number;
  };
}

// ─── Orders List Action ───────────────────────────────────────────────────────

export async function getAdminOrdersList(
  query: AdminOrdersQuery = {}
): Promise<AdminOrdersListResult> {
  const { admin } = await requireAdmin();

  const page = Math.max(1, query.page || 1);
  const pageSize = query.pageSize || 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 1. Fetch overall counts across active delivery/payment stages (excluding awaiting_payment)
  const { data: countRows } = await admin
    .from("orders")
    .select("delivery_status, payment_status")
    .neq("payment_status", "awaiting_payment");

  const counts = {
    all: countRows?.length || 0,
    waiting_approval: 0,
    pending_dropoff: 0,
    in_transit: 0,
    delivered: 0,
    retrying: 0,
    returned: 0,
    cancelled: 0,
    paid: 0,
    cod: 0,
    refunded: 0,
  };

  countRows?.forEach((r) => {
    if (r.delivery_status in counts) {
      counts[r.delivery_status as keyof typeof counts]++;
    }
    if (r.payment_status in counts) {
      counts[r.payment_status as keyof typeof counts]++;
    }
  });

  // 2. Build filtered query
  let builder = admin
    .from("orders")
    .select(
      `
      id,
      created_at,
      email,
      phone,
      payment_method,
      payment_status,
      delivery_status,
      fulfillment_mode,
      needs_attention,
      total,
      subtotal,
      shipping_fee,
      shipping_address,
      tracking_number,
      delivered_at,
      expected_delivery_date,
      items,
      order_items ( id, sku, name, qty ),
      shipments ( id, courier_name, awb, handover_method, label_url, kind )
    `,
      { count: "exact" }
    )
    .neq("payment_status", "awaiting_payment");

  // Quick Approval filter
  if (query.quickApprovalOnly) {
    builder = builder.eq("delivery_status", "waiting_approval");
  } else {
    // Delivery status filter
    if (query.deliveryFilter && query.deliveryFilter !== "all") {
      builder = builder.eq("delivery_status", query.deliveryFilter as any);
    }
    // Payment status filter
    if (query.paymentFilter && query.paymentFilter !== "all") {
      builder = builder.eq("payment_status", query.paymentFilter as any);
    }
  }

  // Search filter
  const s = query.search?.trim();
  if (s) {
    // Clean search string
    const cleanS = s.replace(/^#/, "");
    builder = builder.or(
      `id.ilike.%${cleanS}%,email.ilike.%${cleanS}%,phone.ilike.%${cleanS}%,tracking_number.ilike.%${cleanS}%`
    );
  }

  // Sort newest to oldest
  builder = builder.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await builder;

  if (error || !data) {
    console.error("[getAdminOrdersList] Supabase error:", error);
    return {
      orders: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 0,
      counts,
    };
  }

  const orders: AdminOrderSummary[] = (data as any[]).map((row) => {
    const rawItems = Array.isArray(row.order_items) && row.order_items.length > 0
      ? row.order_items
      : Array.isArray(row.items)
      ? row.items
      : [];

    const itemsCount = rawItems.reduce(
      (sum: number, it: any) => sum + (it.qty || it.quantity || 1),
      0
    );

    const firstItem = rawItems[0]?.name || "Handcrafted Object";
    const itemsSummary =
      rawItems.length > 1 ? `${firstItem} + ${rawItems.length - 1} more` : firstItem;

    // Pick forward shipment info if exists
    const fwdShipment = Array.isArray(row.shipments)
      ? row.shipments.find((s: any) => s.kind === "forward") || row.shipments[0]
      : null;

    return {
      id: row.id,
      created_at: row.created_at,
      email: row.email,
      phone: row.phone,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      delivery_status: row.delivery_status,
      fulfillment_mode: row.fulfillment_mode,
      needs_attention: row.needs_attention,
      total: Number(row.total),
      subtotal: Number(row.subtotal),
      shipping_fee: Number(row.shipping_fee),
      shipping_address: row.shipping_address as any,
      tracking_number: row.tracking_number,
      delivered_at: row.delivered_at,
      expected_delivery_date: row.expected_delivery_date,
      items_count: itemsCount,
      items_summary: itemsSummary,
      courier_name: fwdShipment?.courier_name || null,
      handover_method: fwdShipment?.handover_method || null,
      label_url: fwdShipment?.label_url || null,
    };
  });

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    orders,
    totalCount,
    page,
    pageSize,
    totalPages,
    counts,
  };
}

// ─── Order Detail Action ──────────────────────────────────────────────────────

export async function getAdminOrderDetail(id: string) {
  const { admin } = await requireAdmin();

  const [orderRes, itemsRes, shipmentsRes, pickupRes, settingsRes] = await Promise.all([
    admin.from("orders").select("*").eq("id", id).maybeSingle(),
    admin.from("order_items").select("*").eq("order_id", id).order("created_at", { ascending: true }),
    admin.from("shipments").select("*, shipment_events(*), ndr_cases(*)").eq("order_id", id),
    admin.from("pickup_locations").select("*").order("is_default", { ascending: false }),
    admin.from("shop_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  if (orderRes.error || !orderRes.data) return null;

  return {
    order: {
      ...orderRes.data,
      order_items: itemsRes.data || [],
      shipments: shipmentsRes.data || [],
    },
    pickupLocations: pickupRes.data || [],
    shopSettings: settingsRes.data || null,
  };
}

// ─── Courier Serviceability Quote ─────────────────────────────────────────────

export async function getCourierServiceability(params: {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  cod: boolean;
}) {
  await requireAdmin();
  try {
    return await shiprocket.checkServiceability({
      pickup_postcode: params.pickupPincode,
      delivery_postcode: params.deliveryPincode,
      weight: params.weightKg,
      cod: params.cod,
    });
  } catch (err) {
    return {
      success: false,
      couriers: [],
      error: err instanceof Error ? err.message : "Failed to fetch courier quotes",
    };
  }
}

// ─── Approve & Book (Resumable Sequence) ──────────────────────────────────────

export interface ApproveAndBookInput {
  orderId: string;
  courierId: number;
  courierName?: string;
  handoverMethod: "pickup" | "dropoff";
  pickupLocationName: string;
  pickupPincode: string;
  pickupDate?: string;
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}

export async function approveAndBookOrderAction(
  input: ApproveAndBookInput
): Promise<{ success: boolean; error?: string; stepFailed?: string; awb?: string }> {
  const { admin } = await requireAdmin();

  try {
    // 1. Fetch Order and items
    const [orderRes, itemsRes, shipmentsRes] = await Promise.all([
      admin.from("orders").select("*").eq("id", input.orderId).single(),
      admin.from("order_items").select("*").eq("order_id", input.orderId),
      admin.from("shipments").select("*").eq("order_id", input.orderId),
    ]);

    if (orderRes.error || !orderRes.data) throw new Error("Order not found.");
    const order = orderRes.data;
    const items = itemsRes.data || [];
    const shipments = shipmentsRes.data || [];

    if (order.delivery_status !== "waiting_approval") {
      throw new Error(`Order cannot be approved in '${order.delivery_status}' state.`);
    }

    const addr = order.shipping_address as any;

    // Check for an existing forward shipment to resume from
    let forwardShipment = shipments.find((s) => s.kind === "forward");

    let shipmentId = forwardShipment?.id;
    let srOrderId = forwardShipment?.sr_order_id;
    let srShipmentId = forwardShipment?.sr_shipment_id;
    let awb = forwardShipment?.awb;
    let labelUrl = forwardShipment?.label_url;
    let currentStep = forwardShipment?.booking_step || "serviceability_checked";

    // ── STEP 1 & 2: Create Shiprocket Order (if not already created) ─────────
    if (!srOrderId || !srShipmentId) {
      const srPayload = {
        order_id: order.id, // Channel order id ensures idempotency
        order_date: new Date(order.created_at).toISOString().slice(0, 19).replace("T", " "),
        pickup_location: input.pickupLocationName,
        billing_customer_name: addr?.name || "Customer",
        billing_address: addr?.line1 || "Street Address",
        billing_address_2: addr?.line2 || "",
        billing_city: addr?.city || "City",
        billing_pincode: addr?.pincode || "560001",
        billing_state: addr?.state || "Karnataka",
        billing_country: "India",
        billing_email: order.email,
        billing_phone: order.phone || "+919876543210",
        shipping_is_billing: true,
        order_items: items.map((it) => ({
          name: it.name,
          sku: it.sku || `SKU-${it.id}`,
          units: it.qty,
          selling_price: Math.round(it.unit_price / 100),
        })),
        payment_method: (order.payment_method === "cod" ? "COD" : "Prepaid") as "Prepaid" | "COD",
        sub_total: Math.round(Number(order.subtotal)),
        length: input.lengthCm,
        breadth: input.breadthCm,
        height: input.heightCm,
        weight: input.weightKg,
      };

      try {
        const srRes = await shiprocket.createOrder(srPayload);
        srOrderId = String(srRes.order_id);
        srShipmentId = String(srRes.shipment_id);
        currentStep = "sr_order_created";

        if (!shipmentId) {
          const { data: newShipment, error: insertErr } = await admin
            .from("shipments")
            .insert({
              order_id: order.id,
              kind: "forward",
              sr_order_id: srOrderId,
              sr_shipment_id: srShipmentId,
              pickup_location_name: input.pickupLocationName,
              pickup_pincode: input.pickupPincode,
              handover_method: input.handoverMethod,
              booking_step: "sr_order_created",
              status: "waiting_approval",
            })
            .select("id")
            .single();

          if (insertErr || !newShipment) throw new Error(insertErr?.message || "Failed to create shipment record");
          shipmentId = newShipment.id;
        } else {
          await admin
            .from("shipments")
            .update({
              sr_order_id: srOrderId,
              sr_shipment_id: srShipmentId,
              booking_step: "sr_order_created",
            })
            .eq("id", shipmentId);
        }
      } catch (err) {
        return {
          success: false,
          stepFailed: "sr_order_created",
          error: `Shiprocket order creation failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // ── STEP 3: Assign AWB ───────────────────────────────────────────────────
    if (!shipmentId) {
      throw new Error("Shipment record not found or could not be created.");
    }
    const validShipmentId: string = shipmentId;

    let etdDate: string | null = null;
    let freight = 0;
    if (!awb) {
      try {
        const awbRes = await shiprocket.assignAwb({
          shipment_id: srShipmentId!,
          courier_id: input.courierId,
        });

        awb = awbRes.awb_code;
        freight = awbRes.freight_charge || 0;
        etdDate = awbRes.etd || null;
        currentStep = "awb_assigned";

        await admin
          .from("shipments")
          .update({
            awb,
            courier_id: String(awbRes.courier_company_id),
            courier_name: awbRes.courier_name || input.courierName || "Courier Partner",
            freight_charge: freight,
            booking_step: "awb_assigned",
          })
          .eq("id", validShipmentId);
      } catch (err) {
        return {
          success: false,
          stepFailed: "awb_assigned",
          error: `AWB assignment failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // ── STEP 4: Request Pickup (If handover method is courier pickup) ────────
    if (input.handoverMethod === "pickup" && currentStep === "awb_assigned") {
      try {
        await shiprocket.generatePickup({
          shipment_id: srShipmentId!,
          pickup_date: input.pickupDate,
        });
        currentStep = "pickup_requested";
        await admin
          .from("shipments")
          .update({
            booking_step: "pickup_requested",
            pickup_scheduled_for: input.pickupDate || new Date().toISOString().split("T")[0],
          })
          .eq("id", validShipmentId);
      } catch (err) {
        return {
          success: false,
          stepFailed: "pickup_requested",
          error: `Courier pickup scheduling failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // ── STEP 5: Generate Shipping Label ─────────────────────────────────────
    if (!labelUrl) {
      try {
        const labelRes = await shiprocket.generateLabel({ shipment_id: srShipmentId! });
        labelUrl = labelRes.label_url;
        currentStep = "label_ready";
        await admin
          .from("shipments")
          .update({
            label_url: labelUrl,
            booking_step: "label_ready",
          })
          .eq("id", validShipmentId);
      } catch (err) {
        return {
          success: false,
          stepFailed: "label_ready",
          error: `Label generation failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // ── STEP 6: Mark Complete & Update Order Delivery Status ────────────────
    await admin
      .from("shipments")
      .update({
        booking_step: "done",
        status: "pending_dropoff",
        tracking_url: `https://shiprocket.co/tracking/${awb}`,
      })
      .eq("id", validShipmentId);

    await admin
      .from("orders")
      .update({
        delivery_status: "pending_dropoff",
        fulfillment_mode: "shiprocket",
        tracking_number: awb,
        expected_delivery_date: etdDate,
      })
      .eq("id", order.id);

    // Add initial tracking event
    await admin
      .from("shipment_events")
      .insert({
        shipment_id: validShipmentId,
        sr_status: input.handoverMethod === "pickup" ? "PICKUP_SCHEDULED" : "READY_TO_SHIP",
        mapped_status: "pending_dropoff",
        location: input.pickupLocationName,
        occurred_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle();

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);

    return { success: true, awb };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete approval and booking.",
    };
  }
}

// ─── Local Delivery Override ──────────────────────────────────────────────────

export async function approveLocalDeliveryOrder(
  orderId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  try {
    const { error: ordErr } = await admin
      .from("orders")
      .update({
        fulfillment_mode: "local",
        delivery_status: "in_transit",
        notes: note ? `Local delivery: ${note}` : undefined,
      })
      .eq("id", orderId);

    if (ordErr) return { success: false, error: ordErr.message };

    await admin.from("shipments").insert({
      order_id: orderId,
      kind: "forward",
      courier_name: "Local Delivery",
      handover_method: "dropoff",
      status: "in_transit",
      booking_step: "done",
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to approve local order" };
  }
}

// ─── Mark Local Delivered ─────────────────────────────────────────────────────

export async function markLocalDeliveredAction(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  try {
    const { error } = await admin
      .from("orders")
      .update({
        delivery_status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) return { success: false, error: error.message };

    // Stock completion
    const { data: ord } = await admin.from("orders").select("items").eq("id", orderId).single();
    if (ord?.items && Array.isArray(ord.items)) {
      const isUUID = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
      const itemsToComplete = (ord.items as any[])
        .map((it) => ({
          variant_id: isUUID(it.variantId || it.variant_id) ? (it.variantId || it.variant_id) : null,
          qty: it.quantity || it.qty || 1,
        }))
        .filter((x): x is { variant_id: string; qty: number } => Boolean(x.variant_id));

      if (itemsToComplete.length > 0) {
        await admin.rpc("complete_stock", {
          p_order_id: orderId,
          p_items_json: itemsToComplete,
          p_actor: "admin_local_delivery",
        });
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to mark delivered" };
  }
}

// ─── Cancel Order ─────────────────────────────────────────────────────────────

export async function cancelOrderAction(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  try {
    const [orderRes, itemsRes] = await Promise.all([
      admin.from("orders").select("*").eq("id", orderId).single(),
      admin.from("order_items").select("*").eq("order_id", orderId),
    ]);

    if (orderRes.error || !orderRes.data) return { success: false, error: "Order not found." };
    const order = orderRes.data;
    const items = itemsRes.data || [];

    if (order.delivery_status !== "waiting_approval") {
      return { success: false, error: "Orders can only be cancelled before approval and courier dispatch." };
    }

    // 1. Release reserved stock
    const itemsToRelease = items
      .filter((it) => it.variant_id)
      .map((it) => ({ variant_id: it.variant_id!, qty: it.qty }));

    if (itemsToRelease.length > 0) {
      await admin.rpc("release_stock", {
        p_order_id: orderId,
        p_items_json: itemsToRelease,
        p_actor: "admin_cancellation",
      });
    }

    // 2. Mark refunded if paid, or cancelled if COD
    const newPaymentStatus = order.payment_status === "paid" ? "refunded" : order.payment_status;

    await admin
      .from("orders")
      .update({
        delivery_status: "cancelled",
        payment_status: newPaymentStatus,
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason || "Cancelled by admin prior to dispatch",
      })
      .eq("id", orderId);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to cancel order" };
  }
}

// ─── Mark COD Remitted ────────────────────────────────────────────────────────

export async function markCodRemittedAction(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();

  try {
    const { error } = await admin
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to mark COD remitted" };
  }
}
