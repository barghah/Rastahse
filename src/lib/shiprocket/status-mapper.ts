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

  // 1. Pending Pickup / Drop-off
  // Shiprocket statuses: "AWB ASSIGNED", "LABEL GENERATED", "PICKUP SCHEDULED", "PICKUP QUEUED", "MANIFEST GENERATED"
  if (
    normalized.includes("PICKUP SCHEDULED") ||
    normalized.includes("PICKUP GENERATED") ||
    normalized.includes("PICKUP QUEUED") ||
    normalized.includes("AWAITING PICKUP") ||
    normalized.includes("MANIFEST GENERATED") ||
    normalized.includes("LABEL GENERATED") ||
    normalized.includes("AWB ASSIGNED") ||
    normalized === "READY TO SHIP"
  ) {
    return {
      deliveryStatus: "pending_dropoff",
      needsAttention: false,
      statusLabel: "Pending drop-off",
    };
  }

  // 2. In Transit / Out for delivery
  // Shiprocket statuses: "PICKED UP", "IN TRANSIT", "OUT FOR DELIVERY", "REACHED AT DESTINATION", "HUB"
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

  // 3. Delivered
  if (normalized.includes("DELIVERED") && !normalized.includes("RTO")) {
    return {
      deliveryStatus: "delivered",
      needsAttention: false,
      statusLabel: "Delivered",
    };
  }

  // 4. Undelivered / NDR (Non-delivery report)
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

  // 5. RTO in transit
  if (
    normalized.includes("RTO IN TRANSIT") ||
    normalized.includes("RTO INITIATED") ||
    normalized.includes("RETURN IN TRANSIT") ||
    normalized.includes("RTO OFD")
  ) {
    return {
      deliveryStatus: "return_in_transit",
      needsAttention: false,
      statusLabel: "In transit (return)",
    };
  }

  // 6. RTO Delivered / Returned
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

  // 7. Cancelled
  if (normalized.includes("CANCELLED") || normalized.includes("CANCELED")) {
    return {
      deliveryStatus: "cancelled",
      needsAttention: false,
      statusLabel: "Cancelled",
    };
  }

  // 8. Lost / Damaged / Unknown
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

  // Default fallback for unrecognized status
  return {
    deliveryStatus: "in_transit",
    needsAttention: true,
    statusLabel: `Unknown status: ${rawStatus}`,
  };
}
