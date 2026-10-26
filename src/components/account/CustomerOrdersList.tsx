"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CustomerOrder } from "@/actions/customer-auth";

interface CustomerOrdersListProps {
  orders: CustomerOrder[];
}

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: "Payment Confirmed", color: "text-emerald-800 bg-emerald-50 border-emerald-200" },
  cod: { label: "Cash on Delivery", color: "text-amber-800 bg-amber-50 border-amber-200" },
  awaiting_payment: { label: "Payment Pending", color: "text-orange-800 bg-orange-50 border-orange-200" },
  refunded: { label: "Refunded", color: "text-gray-700 bg-gray-100 border-gray-300" },
};

const DELIVERY_LABELS: Record<string, { label: string; color: string }> = {
  waiting_approval: { label: "Preparing in Studio", color: "text-blue-800 bg-blue-50 border-blue-200" },
  pending_dropoff: { label: "Packed & Ready for Dispatch", color: "text-indigo-800 bg-indigo-50 border-indigo-200" },
  in_transit: { label: "In Transit with Courier", color: "text-purple-800 bg-purple-50 border-purple-200" },
  delivered: { label: "Delivered to Customer", color: "text-emerald-800 bg-emerald-50 border-emerald-200" },
  retrying: { label: "Delivery Attempt Retrying", color: "text-orange-800 bg-orange-50 border-orange-200" },
  returned: { label: "Package Returned (RTO)", color: "text-rose-800 bg-rose-50 border-rose-200" },
  return_in_transit: { label: "Return In Transit", color: "text-rose-800 bg-rose-50 border-rose-200" },
  cancelled: { label: "Cancelled", color: "text-gray-700 bg-gray-100 border-gray-300" },
};

export function CustomerOrdersList({ orders }: CustomerOrdersListProps) {
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center bg-surface/40 rounded-[20px] border border-brand/70 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-paper border border-brand flex items-center justify-center text-lg">
          📦
        </div>
        <h3 className="font-hand text-2xl text-ink">No orders recorded yet</h3>
        <p className="font-body text-xs text-ink/50 max-w-sm mx-auto">
          When you purchase handcrafted art or attire from Rastah, you will receive real-time updates and live package tracking here.
        </p>
        <Link
          href="/shop"
          className="mt-2 inline-block px-6 py-2.5 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider hover:bg-[#580118] transition-colors shadow-soft"
        >
          Explore the Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand flex items-center justify-between">
        <div>
          <h2 className="font-hand text-2xl text-ink">My Acquisitions & Live Tracking</h2>
          <p className="font-label text-[10px] text-ink/50 uppercase tracking-wider mt-0.5">
            {orders.length} {orders.length === 1 ? "order" : "orders"} placed
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const payBadge = PAYMENT_LABELS[order.payment_status] || {
            label: order.payment_status,
            color: "text-ink/60 bg-surface border-brand",
          };
          const delivBadge = DELIVERY_LABELS[order.delivery_status] || {
            label: order.delivery_status,
            color: "text-ink/60 bg-surface border-brand",
          };

          const isExpanded = expandedTrackingId === order.id;
          const forwardShipment = order.shipments.find((s) => s.kind === "forward") || order.shipments[0];
          const hasTracking = Boolean(forwardShipment?.awb || forwardShipment?.tracking_url);

          // Calculate progression step: 0 = Waiting, 1 = Ready/Dispatched, 2 = In Transit, 3 = Delivered
          let progressStep = 0;
          if (order.delivery_status === "waiting_approval") progressStep = 1;
          else if (order.delivery_status === "pending_dropoff") progressStep = 2;
          else if (order.delivery_status === "in_transit" || order.delivery_status === "retrying") progressStep = 3;
          else if (order.delivery_status === "delivered") progressStep = 4;
          else if (order.delivery_status === "returned") progressStep = 3;

          return (
            <div
              key={order.id}
              className="bg-paper rounded-[20px] border border-brand p-5 sm:p-6 shadow-card space-y-5"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label text-xs uppercase tracking-wider font-semibold text-ink">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    {order.fulfillment_mode === "local" ? (
                      <span className="font-label text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        🛵 Rastah Hand Delivery
                      </span>
                    ) : (
                      <span className="font-label text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        ✈️ Express Courier
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-ink/50 mt-1">
                    Placed on{" "}
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full font-label text-[10px] border ${payBadge.color}`}>
                      💳 {payBadge.label}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-label text-[10px] border font-medium ${delivBadge.color}`}>
                      📦 {delivBadge.label}
                    </span>
                  </div>
                  <span className="font-label text-sm text-ink font-semibold">
                    ₹{order.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Live Timeline Step Indicator */}
              <div className="bg-surface/50 rounded-[16px] p-4 border border-brand/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-label">
                  <span className="uppercase tracking-wider text-ink/60 text-[10px]">
                    Live Delivery Progression
                  </span>
                  {forwardShipment?.etd && (
                    <span className="text-berry font-medium text-[11px]">
                      Est. Arrival: {new Date(forwardShipment.etd).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>

                {/* 4-stage bar */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[
                    { step: 1, label: "Studio Confirmation" },
                    { step: 2, label: "Packed & Ready" },
                    { step: 3, label: "In Transit" },
                    { step: 4, label: "Delivered" },
                  ].map((s) => {
                    const isDone = progressStep >= s.step;
                    const isCurrent = progressStep === s.step;
                    return (
                      <div key={s.step} className="space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isDone
                              ? "bg-berry"
                              : "bg-brand/30"
                          } ${isCurrent ? "ring-2 ring-berry/30 animate-pulse" : ""}`}
                        />
                        <p
                          className={`font-label text-[8.5px] uppercase tracking-wider text-center truncate ${
                            isDone ? "text-ink font-semibold" : "text-ink/40"
                          }`}
                        >
                          {s.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* AWB & Carrier Link */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-body border-t border-brand/40">
                  <div className="flex items-center gap-2">
                    {forwardShipment?.courier_name && (
                      <span className="font-label text-[10px] text-ink/70 uppercase">
                        Carrier: <span className="font-semibold text-ink">{forwardShipment.courier_name}</span>
                      </span>
                    )}
                    {forwardShipment?.awb && (
                      <span className="font-label text-[10px] text-ink/70 uppercase">
                        AWB: <span className="font-mono font-semibold text-berry">{forwardShipment.awb}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {forwardShipment?.events && forwardShipment.events.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedTrackingId(isExpanded ? null : order.id)}
                        className="font-label text-[10px] uppercase tracking-wider text-berry hover:text-[#580118] cursor-pointer underline underline-offset-4"
                      >
                        {isExpanded ? "Hide Tracking Audit" : `View Tracking Audit (${forwardShipment.events.length})`}
                      </button>
                    )}

                    {hasTracking && forwardShipment?.tracking_url && (
                      <a
                        href={forwardShipment.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-[8px] bg-berry text-paper font-label text-[9px] uppercase tracking-wider hover:bg-[#580118] transition-colors"
                      >
                        Track on Courier Website ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Expanded Tracking Timeline Events */}
                {isExpanded && forwardShipment?.events && (
                  <div className="mt-3 pt-3 border-t border-brand/50 space-y-2">
                    <p className="font-label text-[9px] uppercase tracking-wider text-ink/50">
                      Carrier Audit Log
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {forwardShipment.events.map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-start gap-3 p-2 rounded-[8px] bg-paper border border-brand/40 text-xs"
                        >
                          <span className="text-berry text-xs">📍</span>
                          <div className="flex-1">
                            <p className="font-body text-xs font-medium text-ink">
                              {evt.mapped_status.replace(/_/g, " ").toUpperCase()}
                            </p>
                            {evt.location && (
                              <p className="font-body text-[11px] text-ink/60">
                                Location: {evt.location}
                              </p>
                            )}
                          </div>
                          <span className="font-label text-[9px] text-ink/40 shrink-0">
                            {new Date(evt.occurred_at).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Items in order */}
              <div className="space-y-3">
                <p className="font-label text-[9.5px] uppercase tracking-wider text-ink/50">
                  Items in this shipment ({order.items.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-[12px] bg-surface/30 border border-brand/50"
                    >
                      <div className="w-12 h-12 rounded-[8px] bg-surface border border-brand/40 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-ink/30">🎨</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-xs text-ink font-medium truncate">{item.name}</p>
                        <p className="font-label text-[10px] text-ink/50 mt-0.5">
                          Qty: {item.qty} &middot; ₹{(item.price).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping destination */}
              {order.shipping_address && (
                <div className="pt-2 text-xs font-body text-ink/60 border-t border-brand/40 flex items-center gap-2">
                  <span>📍</span>
                  <span>
                    Delivering to{" "}
                    <span className="font-medium text-ink">
                      {order.shipping_address.fullName || order.shipping_address.name}
                    </span>
                    {order.shipping_address.city && `, ${order.shipping_address.city}`}
                    {order.shipping_address.pincode && ` (${order.shipping_address.pincode})`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
