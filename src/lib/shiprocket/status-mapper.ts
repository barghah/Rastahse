/**
 * src/lib/shiprocket/status-mapper.ts
 * Centralized mapping from Shiprocket raw statuses to Rastahse delivery_status.
 * Verified against official Shiprocket webhook/tracking status definitions.
 */

import type { DeliveryStatus } from "./types";

export interface MappedStatusResult {
  deliveryStatus: DeliveryStatus;
  needsAttention: boolean;
  statusLabel: string;
}

export function mapShiprocketStatus(rawStatus: string | number | undefined | null): MappedStatusResult {
  if (!rawStatus) {
    return {
      deliveryStatus: "waiting_approval",
      needsAttention: false,
      statusLabel: "Waiting for approval",
    };
  }

  const normalized = String(rawStatus).toUpperCase().trim();

  // 1. Cancelled
  if (normalized.includes("CANCELLED") || normalized.includes("CANCELED")) {
    return {
      deliveryStatus: "cancelled",
      needsAttention: false,
      statusLabel: "Cancelled",
    };
  }

  // 2. RTO Delivered / Returned (must be before forward Delivered)
  if (
    normalized.includes("RTO DELIVERED") ||
    normalized.includes("RETURNED TO ORIGIN") ||
    normalized.includes("RETURN DELIVERED")
  ) {
    return {
      deliveryStatus: "returned",
      needsAttention: false,
      statusLabel: "Returned",
    };
  }

  // 3. RTO / Return in transit (must be before forward In Transit)
  if (
    normalized.includes("RTO") ||
    normalized.includes("RETURN IN TRANSIT") ||
    normalized.includes("RETURN INITIATED")
  ) {
    return {
      deliveryStatus: "return_in_transit",
      needsAttention: false,
      statusLabel: "In transit (return)",
    };
  }

  // 4. Undelivered / NDR (must be before forward Delivered)
  if (
    normalized.includes("UNDELIVERED") ||
    normalized.includes("NDR") ||
    normalized.includes("ATTEMPTED") ||
    normalized.includes("DELIVERY FAILED")
  ) {
    return {
      deliveryStatus: "retrying",
      needsAttention: false,
      statusLabel: "Retrying (NDR)",
    };
  }

  // 5. Delivered
  if (normalized.includes("DELIVERED")) {
    return {
      deliveryStatus: "delivered",
      needsAttention: false,
      statusLabel: "Delivered",
    };
  }

  // 6. Lost / Damaged / Unknown issue
  if (
    normalized.includes("LOST") ||
    normalized.includes("DAMAGED") ||
    normalized.includes("DESTROYED")
  ) {
    return {
      deliveryStatus: "in_transit",
      needsAttention: true,
      statusLabel: `Courier Attention Required (${rawStatus})`,
    };
  }

  // 7. In Transit / Out for delivery / Reached hub
  if (
    normalized.includes("PICKED UP") ||
    normalized.includes("IN TRANSIT") ||
    normalized.includes("OUT FOR DELIVERY") ||
    normalized.includes("REACHED") ||
    normalized.includes("SHIPPED")
  ) {
    return {
      deliveryStatus: "in_transit",
      needsAttention: false,
      statusLabel: "In transit",
    };
  }

  // 8. Pending Pickup / Drop-off
  if (
    normalized.includes("PICKUP") ||
    normalized.includes("MANIFEST") ||
    normalized.includes("LABEL") ||
    normalized.includes("AWB") ||
    normalized === "READY TO SHIP"
  ) {
    return {
      deliveryStatus: "pending_dropoff",
      needsAttention: false,
      statusLabel: "Pending drop-off",
    };
  }

  // Default fallback for unrecognized status
  return {
    deliveryStatus: "in_transit",
    needsAttention: true,
    statusLabel: `Unknown status: ${rawStatus}`,
  };
}
