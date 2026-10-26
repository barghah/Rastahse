"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  approveAndBookOrderAction,
  approveLocalDeliveryOrder,
  cancelOrderAction,
  markLocalDeliveredAction,
  markCodRemittedAction,
  getCourierServiceability,
} from "@/actions/orders-admin";
import type { ShiprocketCourierPartner } from "@/lib/shiprocket/types";
import type { PickupLocationRow } from "@/types/supabase";

interface Props {
  data: {
    order: any;
    pickupLocations: PickupLocationRow[];
    shopSettings: any;
  };
}

export function OrderDetailManage({ data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { order, pickupLocations } = data;
  const items = Array.isArray(order.order_items) && order.order_items.length > 0
    ? order.order_items
    : Array.isArray(order.items)
    ? order.items
    : [];

  const forwardShipment = Array.isArray(order.shipments)
    ? order.shipments.find((s: any) => s.kind === "forward") || order.shipments[0]
    : null;

  const events = Array.isArray(forwardShipment?.shipment_events)
    ? forwardShipment.shipment_events.sort(
        (a: any, b: any) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      )
    : [];

  const addr = (order.shipping_address || {}) as {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };

  // ── Shiprocket Panel States ──
  const defaultLoc = pickupLocations.find((l) => l.is_default) || pickupLocations[0];
  const [selectedPickup, setSelectedPickup] = useState(
    defaultLoc?.name || "Primary Studio"
  );
  const [pickupPincode, setPickupPincode] = useState(
    defaultLoc?.pin || "560038"
  );
  const [handoverMethod, setHandoverMethod] = useState<"pickup" | "dropoff">("dropoff");
  const [pickupDate, setPickupDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Compute aggregate package metrics
  const totalWeightKg = Math.max(
    0.5,
    items.reduce((sum: number, it: any) => sum + (it.weight_grams || 500) * (it.qty || 1), 0) / 1000
  );

  const [weightKg, setWeightKg] = useState<number>(Number(totalWeightKg.toFixed(2)));
  const [lengthCm, setLengthCm] = useState<number>(18);
  const [breadthCm, setBreadthCm] = useState<number>(14);
  const [heightCm, setHeightCm] = useState<number>(10);

  // Couriers list from serviceability
  const [couriers, setCouriers] = useState<ShiprocketCourierPartner[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Booking Feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Cancel Dialog State
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Local delivery modal/drawer
  const [showLocalDialog, setShowLocalDialog] = useState(false);
  const [localNote, setLocalNote] = useState("");

  // Fetch Courier Quotes when parameters change
  useEffect(() => {
    if (order.delivery_status !== "waiting_approval") return;

    let cancelled = false;
    async function fetchQuotes() {
      setIsLoadingQuotes(true);
      setQuoteError(null);

      const res = await getCourierServiceability({
        pickupPincode,
        deliveryPincode: addr?.pincode || "560001",
        weightKg,
        cod: order.payment_method === "cod",
      });

      if (!cancelled) {
        setIsLoadingQuotes(false);
        if (res.success && res.couriers && res.couriers.length > 0) {
          // Filter couriers for COD if needed
          const filtered = order.payment_method === "cod"
            ? res.couriers.filter((c) => c.cod_available)
            : res.couriers;

          setCouriers(filtered);
          if (filtered.length > 0 && !selectedCourierId) {
            setSelectedCourierId(filtered[0].courier_company_id);
          }
        } else {
          setCouriers([]);
          setQuoteError(res.error || "No serviceable couriers found for this pincode.");
        }
      }
    }

    fetchQuotes();
    return () => {
      cancelled = true;
    };
  }, [pickupPincode, addr?.pincode, weightKg, order.payment_method, order.delivery_status]);

  // Handle Pickup Location change
  function handlePickupChange(locName: string) {
    setSelectedPickup(locName);
    const loc = pickupLocations.find((l) => l.name === locName);
    if (loc) {
      setPickupPincode(loc.pin);
    }
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  function handleApproveAndBook() {
    if (!selectedCourierId) {
      setActionError("Please select a courier partner before booking.");
      return;
    }
    setActionError(null);
    setActionSuccess(null);

    const selectedCourier = couriers.find((c) => c.courier_company_id === selectedCourierId);

    startTransition(async () => {
      const res = await approveAndBookOrderAction({
        orderId: order.id,
        courierId: selectedCourierId,
        courierName: selectedCourier?.courier_name,
        handoverMethod,
        pickupLocationName: selectedPickup,
        pickupPincode,
        pickupDate: handoverMethod === "pickup" ? pickupDate : undefined,
        weightKg,
        lengthCm,
        breadthCm,
        heightCm,
      });

      if (!res.success) {
        setActionError(res.error || "Booking failed.");
      } else {
        setActionSuccess(`Order approved! AWB generated: ${res.awb}`);
        router.refresh();
      }
    });
  }

  function handleCancelOrder() {
    setActionError(null);
    startTransition(async () => {
      const res = await cancelOrderAction(order.id, cancelReason);
      if (!res.success) {
        setActionError(res.error || "Failed to cancel order.");
      } else {
        setShowCancelDialog(false);
        router.refresh();
      }
    });
  }

  function handleApproveLocal() {
    setActionError(null);
    startTransition(async () => {
      const res = await approveLocalDeliveryOrder(order.id, localNote);
      if (!res.success) {
        setActionError(res.error || "Failed to approve local order.");
      } else {
        setShowLocalDialog(false);
        router.refresh();
      }
    });
  }

  function handleMarkLocalDelivered() {
    setActionError(null);
    startTransition(async () => {
      const res = await markLocalDeliveredAction(order.id);
      if (!res.success) {
        setActionError(res.error || "Failed to mark delivered.");
      } else {
        router.refresh();
      }
    });
  }

  function handleMarkCodRemitted() {
    setActionError(null);
    startTransition(async () => {
      const res = await markCodRemittedAction(order.id);
      if (!res.success) {
        setActionError(res.error || "Failed to mark remitted.");
      } else {
        router.refresh();
      }
    });
  }

  const isPaid = order.payment_status === "paid";
  const isWaitingApproval = order.delivery_status === "waiting_approval";
  const isShipped = ["pending_dropoff", "in_transit"].includes(order.delivery_status);
  const isDelivered = order.delivery_status === "delivered";
  const isLocal = order.fulfillment_mode === "local";

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      {/* ── Back Navigation & Header ── */}
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 font-label text-[10.5px] text-ink/50 hover:text-berry transition-colors uppercase tracking-wider font-semibold"
        >
          ← Back to All Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pb-3 border-b border-brand">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-label text-2xl text-ink font-semibold tracking-tight">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              {order.needs_attention && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-label text-[10px] uppercase tracking-wider font-bold animate-pulse">
                  ⚠️ Action Required
                </span>
              )}
            </div>
            <p className="font-body text-xs text-ink/50 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Quick Status Pills */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="font-label text-[9px] uppercase tracking-widest text-ink/40 block">Payment</span>
              <span className="inline-block px-3 py-1 rounded-full font-label text-[10px] uppercase tracking-wider font-semibold bg-surface border border-brand text-ink">
                {order.payment_status.toUpperCase()} ({order.payment_method.toUpperCase()})
              </span>
            </div>
            <div className="text-right">
              <span className="font-label text-[9px] uppercase tracking-widest text-ink/40 block">Delivery</span>
              <span className="inline-block px-3 py-1 rounded-full font-label text-[10px] uppercase tracking-wider font-semibold bg-berry text-paper">
                {order.delivery_status.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages & Alerts ── */}
      {actionError && (
        <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-900 font-body text-xs">
          <strong>Error:</strong> {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-900 font-body text-xs">
          <strong>Success:</strong> {actionSuccess}
        </div>
      )}

      {/* ── Customer & Address Information ── */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-2">
          <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider mb-2 font-semibold">
            Customer Contact
          </p>
          <p className="font-body text-sm text-ink font-semibold">{addr?.name || "Guest Customer"}</p>
          {order.email && <p className="font-body text-xs text-ink/65">✉️ {order.email}</p>}
          {order.phone && <p className="font-body text-xs text-ink/65">📱 {order.phone}</p>}
        </div>

        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-1">
          <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider mb-2 font-semibold">
            Shipping Destination
          </p>
          {addr?.line1 && <p className="font-body text-xs text-ink/75">{addr.line1}</p>}
          {addr?.line2 && <p className="font-body text-xs text-ink/75">{addr.line2}</p>}
          <p className="font-body text-xs text-ink/65 font-medium mt-1">
            {[addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      {/* ── Order Items Snapshot ── */}
      <div className="rounded-[18px] bg-paper border border-brand overflow-hidden shadow-soft">
        <div className="px-6 py-3.5 bg-surface/70 border-b border-brand flex items-center justify-between">
          <p className="font-label text-[10.5px] text-ink/50 uppercase tracking-wider font-semibold">
            Items in Order ({items.length})
          </p>
          <span className="font-label text-[10px] text-ink/40 uppercase tracking-wider">
            Total Package Weight: ~{weightKg} kg
          </span>
        </div>

        <div className="divide-y divide-brand/60">
          {items.map((item: any, idx: number) => {
            const unitPaise = item.unit_price || item.price || 0;
            const unitRupees = Math.round(unitPaise / 100);
            const qty = item.qty || item.quantity || 1;
            const lineTotal = unitRupees * qty;

            return (
              <div
                key={item.id || idx}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface/30 transition-colors gap-4"
              >
                <div className="flex items-center gap-3">
                  {item.image ? (
                    <div className="relative w-12 h-12 rounded-[10px] overflow-hidden bg-surface border border-brand shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name || "Object"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-[10px] bg-surface border border-brand flex items-center justify-center font-label text-ink/30 text-[10px] shrink-0">
                      OBJ
                    </div>
                  )}

                  <div>
                    <p className="font-body text-sm text-ink font-semibold">{item.name || "Handcrafted Object"}</p>
                    <p className="font-mono text-[10px] text-ink/40 mt-0.5">
                      SKU: {item.sku || "N/A"} · Qty: <strong className="text-ink">{qty}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-label text-xs text-ink font-semibold">
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </p>
                  <p className="font-label text-[10px] text-ink/40">
                    ₹{unitRupees.toLocaleString("en-IN")} each
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing Summary */}
        <div className="bg-surface/40 p-6 space-y-2 border-t border-brand">
          <div className="flex justify-between text-xs text-ink/65">
            <span className="font-body">Subtotal</span>
            <span className="font-label font-medium">₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
          </div>
          {Number(order.shipping_fee) > 0 && (
            <div className="flex justify-between text-xs text-ink/65">
              <span className="font-body">Shipping Fee</span>
              <span className="font-label font-medium">₹{Number(order.shipping_fee).toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-ink pt-2 border-t border-brand font-semibold">
            {/* Requirement: Fix label so it reads "Total" unless payment_status is paid */}
            <span className="font-body">{isPaid ? "Total Paid" : "Total"}</span>
            <span className="font-label font-bold text-base">₹{Number(order.total).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* ── ACTION STAGE 1: WAITING FOR APPROVAL ── */}
      {isWaitingApproval && (
        <div className="space-y-6">
          {/* Shiprocket Booking Panel */}
          <div className="rounded-[18px] p-6 bg-paper border-2 border-berry/30 shadow-soft space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-brand">
              <div>
                <p className="font-label text-[11px] text-berry uppercase tracking-wider font-bold">
                  🚀 Courier Fulfillment (Shiprocket External API)
                </p>
                <p className="font-body text-xs text-ink/50 mt-0.5">
                  Check serviceability, select courier rate, and generate AWB &amp; Shipping Label
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="px-3.5 py-1.5 rounded-[9px] bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-label text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer"
              >
                Cancel Order
              </button>
            </div>

            {/* Package Dimension & Pickup Configuration */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pickup location */}
              <div>
                <label className="block font-label text-[9.5px] uppercase tracking-wider text-ink/50 font-semibold mb-1.5">
                  Pickup Warehouse
                </label>
                <select
                  value={selectedPickup}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand font-body text-xs text-ink focus:outline-none focus:border-berry"
                >
                  {pickupLocations.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} ({loc.pin})
                    </option>
                  ))}
                </select>
              </div>

              {/* Handover Method */}
              <div>
                <label className="block font-label text-[9.5px] uppercase tracking-wider text-ink/50 font-semibold mb-1.5">
                  Handover Method
                </label>
                <div className="grid grid-cols-2 gap-1 bg-surface p-1 rounded-[10px] border border-brand">
                  <button
                    type="button"
                    onClick={() => setHandoverMethod("dropoff")}
                    className={`py-1.5 rounded-[8px] font-label text-[10px] uppercase tracking-wider font-semibold transition-all ${
                      handoverMethod === "dropoff"
                        ? "bg-berry text-paper shadow-2xs"
                        : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    Drop-off
                  </button>
                  <button
                    type="button"
                    onClick={() => setHandoverMethod("pickup")}
                    className={`py-1.5 rounded-[8px] font-label text-[10px] uppercase tracking-wider font-semibold transition-all ${
                      handoverMethod === "pickup"
                        ? "bg-berry text-paper shadow-2xs"
                        : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    Pickup
                  </button>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block font-label text-[9.5px] uppercase tracking-wider text-ink/50 font-semibold mb-1.5">
                  Package Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.5)}
                  className="w-full px-3 py-2 rounded-[10px] bg-surface border border-brand font-mono text-xs text-ink focus:outline-none focus:border-berry"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block font-label text-[9.5px] uppercase tracking-wider text-ink/50 font-semibold mb-1.5">
                  Dimensions L × B × H (cm)
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-2 rounded-[8px] bg-surface border border-brand font-mono text-xs text-center text-ink"
                    placeholder="L"
                  />
                  <input
                    type="number"
                    value={breadthCm}
                    onChange={(e) => setBreadthCm(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-2 rounded-[8px] bg-surface border border-brand font-mono text-xs text-center text-ink"
                    placeholder="B"
                  />
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-2 rounded-[8px] bg-surface border border-brand font-mono text-xs text-center text-ink"
                    placeholder="H"
                  />
                </div>
              </div>
            </div>

            {/* Courier Serviceability Table */}
            <div className="space-y-3">
              <p className="font-label text-[10px] text-ink/50 uppercase tracking-wider font-semibold">
                Available Courier Partners ({couriers.length})
              </p>

              {isLoadingQuotes ? (
                <div className="p-8 text-center bg-surface/50 rounded-[12px] border border-brand font-body text-xs text-ink/50">
                  <span className="inline-block animate-spin mr-2">⏳</span> Fetching live courier rates and ETDs…
                </div>
              ) : quoteError ? (
                <div className="p-4 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-900 font-body text-xs">
                  {quoteError}
                </div>
              ) : couriers.length === 0 ? (
                <div className="p-6 text-center bg-surface/40 rounded-[12px] border border-brand font-body text-xs text-ink/40">
                  No couriers available. Check delivery pincode.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {couriers.map((c) => {
                    const isSelected = selectedCourierId === c.courier_company_id;
                    return (
                      <div
                        key={c.courier_company_id}
                        onClick={() => setSelectedCourierId(c.courier_company_id)}
                        className={`p-4 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-surface border-berry shadow-sm ring-1 ring-berry"
                            : "bg-surface/40 border-brand hover:border-brand/90 hover:bg-surface/70"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-xs font-semibold text-ink">
                              {c.courier_name}
                            </span>
                            {c.is_cheapest && (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label text-[8.5px] uppercase font-bold">
                                Cheapest
                              </span>
                            )}
                            {c.is_fastest && (
                              <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-label text-[8.5px] uppercase font-bold">
                                Fastest
                              </span>
                            )}
                          </div>
                          <p className="font-label text-[10px] text-ink/50">
                            Est. Delivery: <strong className="text-ink/80">{c.etd}</strong> · Rating: ★{c.rating || 4.5}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-label text-sm text-ink font-bold">
                            ₹{c.rate}
                          </p>
                          <span
                            className={`inline-block w-4 h-4 rounded-full border-2 transition-all mt-1 ${
                              isSelected
                                ? "border-berry bg-berry"
                                : "border-ink/30 bg-paper"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Booking Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-brand">
              <button
                type="button"
                onClick={() => setShowLocalDialog(true)}
                className="font-label text-[10.5px] text-ink/60 hover:text-ink uppercase tracking-wider font-medium text-left cursor-pointer"
              >
                🚗 Or approve as Local Delivery (skip Shiprocket)
              </button>

              <button
                type="button"
                onClick={handleApproveAndBook}
                disabled={isPending || !selectedCourierId || couriers.length === 0}
                className="px-6 py-3 rounded-[12px] bg-berry text-paper font-label text-[11px] uppercase tracking-wider font-bold shadow-md hover:bg-[#580118] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? "Booking & Generating AWB…" : "Approve & Book via Shiprocket →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION STAGE 2: IN TRANSIT / SHIPPED VIA SHIPROCKET ── */}
      {isShipped && !isLocal && (
        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-brand">
            <div>
              <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider font-semibold">
                Shiprocket Courier Tracking
              </p>
              <p className="font-body text-sm font-semibold text-ink mt-0.5">
                {forwardShipment?.courier_name || "Courier"} · AWB:{" "}
                <span className="font-mono text-berry font-bold">{order.tracking_number}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {forwardShipment?.label_url && (
                <a
                  href={forwardShipment.label_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-[10px] bg-surface hover:bg-brand font-label text-[10px] text-ink uppercase tracking-wider font-semibold border border-brand transition-colors"
                >
                  📄 Download Label
                </a>
              )}
              {order.tracking_number && (
                <a
                  href={`https://shiprocket.co/tracking/${order.tracking_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider font-semibold hover:bg-[#580118] transition-colors"
                >
                  Live Tracking ↗
                </a>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs font-body">
            <div>
              <span className="font-label text-[9.5px] text-ink/40 uppercase tracking-widest block">Handover</span>
              <p className="font-medium text-ink mt-0.5 capitalize">
                {forwardShipment?.handover_method === "pickup" ? "Courier Pickup" : "Direct Drop-off"}
              </p>
            </div>
            <div>
              <span className="font-label text-[9.5px] text-ink/40 uppercase tracking-widest block">Pickup Date</span>
              <p className="font-medium text-ink mt-0.5">
                {forwardShipment?.pickup_scheduled_for || "Scheduled"}
              </p>
            </div>
            <div>
              <span className="font-label text-[9.5px] text-ink/40 uppercase tracking-widest block">Expected Delivery</span>
              <p className="font-medium text-ink mt-0.5">
                {order.expected_delivery_date || "2-4 Business Days"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTION STAGE 3: LOCAL DELIVERY ── */}
      {isLocal && (
        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider font-semibold">
                Local Hand Delivery
              </p>
              <p className="font-body text-xs text-ink/60 mt-0.5">
                Delivered locally without external courier charges.
              </p>
            </div>

            {order.delivery_status !== "delivered" && (
              <button
                type="button"
                onClick={handleMarkLocalDelivered}
                disabled={isPending}
                className="px-4 py-2 rounded-[10px] bg-emerald-700 text-paper font-label text-[10px] uppercase tracking-wider font-semibold hover:bg-emerald-800 cursor-pointer disabled:opacity-40"
              >
                Mark Delivered ✓
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── ACTION STAGE 4: DELIVERED & COD REMITTANCE ── */}
      {isDelivered && (
        <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label text-[10px] text-emerald-800 uppercase tracking-wider font-semibold">
                Order Completed &amp; Delivered
              </p>
              <p className="font-body text-xs text-ink/60 mt-0.5">
                Delivered on {new Date(order.delivered_at || order.updated_at).toLocaleDateString("en-IN")}
              </p>
            </div>

            {order.payment_method === "cod" && order.payment_status === "cod" && (
              <button
                type="button"
                onClick={handleMarkCodRemitted}
                disabled={isPending}
                className="px-4 py-2 rounded-[10px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider font-semibold hover:bg-[#580118] cursor-pointer"
              >
                💰 Mark COD Remitted to Bank
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STATUS AUDIT TIMELINE (shipment_events) ── */}
      <div className="rounded-[18px] p-6 bg-paper border border-brand shadow-soft space-y-4">
        <p className="font-label text-[10px] text-ink/45 uppercase tracking-wider font-semibold">
          Tracking Timeline &amp; Events ({events.length})
        </p>

        {events.length === 0 ? (
          <p className="font-body text-xs text-ink/40">No carrier events recorded yet.</p>
        ) : (
          <div className="space-y-4 pl-3 border-l-2 border-brand">
            {events.map((ev: any) => (
              <div key={ev.id} className="relative pl-4 space-y-0.5">
                <div className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full bg-berry" />
                <p className="font-body text-xs font-semibold text-ink">
                  {ev.mapped_status.replace(/_/g, " ").toUpperCase()} ({ev.sr_status})
                </p>
                <p className="font-label text-[9.5px] text-ink/40">
                  {new Date(ev.occurred_at).toLocaleString("en-IN")} {ev.location ? `· ${ev.location}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CANCEL DIALOG MODAL ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-[20px] border border-brand p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="font-label text-base font-semibold text-ink">
              Cancel Order #{order.id.slice(0, 8).toUpperCase()}?
            </h3>
            <p className="font-body text-xs text-ink/65 leading-relaxed">
              Cancelling this order will automatically release reserved stock back into the available catalog pool.
              {isPaid ? " Payment was received via Razorpay; a full refund will be marked." : " This was a COD order."}
            </p>

            <div>
              <label className="block font-label text-[9.5px] uppercase tracking-wider text-ink/50 font-semibold mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="Customer request, address unreachable, etc."
                className="w-full p-2.5 rounded-[10px] bg-surface border border-brand font-body text-xs text-ink focus:outline-none focus:border-berry"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 rounded-[9px] bg-surface font-label text-[10px] uppercase tracking-wider font-semibold text-ink/70 hover:text-ink border border-brand"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isPending}
                className="px-4 py-2 rounded-[9px] bg-rose-700 text-paper font-label text-[10px] uppercase tracking-wider font-bold hover:bg-rose-800 disabled:opacity-40"
              >
                {isPending ? "Cancelling…" : "Confirm Cancel & Release Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOCAL DELIVERY MODAL ── */}
      {showLocalDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-[20px] border border-brand p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="font-label text-base font-semibold text-ink">
              Approve as Local Order
            </h3>
            <p className="font-body text-xs text-ink/65 leading-relaxed">
              This skips Shiprocket courier booking. Stock remains reserved while out for local delivery.
            </p>

            <div>
              <label className="block font-label text-[9.5px] uppercase tracking-wider text-ink/50 font-semibold mb-1">
                Delivery notes (rider, contact, vehicle):
              </label>
              <input
                type="text"
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                placeholder="Rider: Kumar (+91 98450 11223)"
                className="w-full p-2.5 rounded-[10px] bg-surface border border-brand font-body text-xs text-ink focus:outline-none focus:border-berry"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLocalDialog(false)}
                className="px-4 py-2 rounded-[9px] bg-surface font-label text-[10px] uppercase tracking-wider font-semibold text-ink/70 hover:text-ink border border-brand"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveLocal}
                disabled={isPending}
                className="px-4 py-2 rounded-[9px] bg-berry text-paper font-label text-[10px] uppercase tracking-wider font-bold hover:bg-[#580118] disabled:opacity-40"
              >
                {isPending ? "Approving…" : "Approve as Local"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
