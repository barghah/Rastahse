"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/types/product";
import { BrandLoader } from "@/components/ui/BrandLoader";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, closeCart } = useCartStore();

  // Ensure cart drawer is closed on checkout page
  useEffect(() => {
    closeCart();
  }, [closeCart]);

  const [formData, setFormData] = useState({
    firstName: "Rohan",
    lastName: "Verma",
    email: "rohan.verma@example.com",
    phone: "+91 98765 43210",
    address: "Flat 402, Shanti Niketan",
    locality: "Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    paymentMethod: "upi",
    notes: "Please leave package with building security if unattended.",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");

  const total = totalPrice();
  const shipping = total > 200000 ? 0 : 15000; // Free above ₹2,000
  const grandTotal = total + shipping;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);

    // Smooth, quiet transition to order placed state
    setTimeout(() => {
      const generatedId = `RST-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setIsSubmitting(false);
      setOrderPlaced(true);
      clearCart();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Minimal Aesthetic Order Confirmation Screen */}
      <AnimatePresence>
        {orderPlaced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[120] bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-paper rounded-[24px] max-w-lg w-full p-8 sm:p-10 text-center shadow-xl border border-brand/60 relative my-8"
            >
              {/* Minimalist fine-line checkmark medallion */}
              <div className="w-16 h-16 mx-auto rounded-full bg-surface border border-brand/80 flex items-center justify-center text-berry mb-6">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 40 40"
                  fill="none"
                  className="overflow-visible"
                >
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="#6c0222"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  <motion.path
                    d="M12 21 L18 27 L28 15"
                    stroke="#6c0222"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
                  />
                </svg>
              </div>

              <div>
                <p className="font-label text-[10px] text-berry uppercase tracking-[0.25em] font-medium">
                  Order Confirmed
                </p>
                <h2 className="font-hand text-3xl sm:text-4xl text-ink mt-2">
                  Thank you for keeping craft alive.
                </h2>
                <p className="font-body text-xs sm:text-sm text-ink/65 mt-2.5 max-w-md mx-auto leading-relaxed">
                  Your piece is being prepared with care in our studio, wrapped in unbleached paper and secured with natural twine.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="mt-6 p-4 sm:p-5 rounded-[16px] bg-surface/70 border border-brand text-left space-y-2.5 text-xs font-body">
                <div className="flex justify-between items-center pb-2.5 border-b border-brand/50">
                  <span className="font-label text-[10px] text-ink/50 uppercase tracking-wider">Order Reference</span>
                  <span className="font-label text-[11px] text-ink font-medium tracking-wide">{orderId}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-label text-[10px] text-ink/50 uppercase tracking-wider">Dispatch</span>
                  <span className="text-ink/80">Within 24 Hours &middot; Express Air</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-label text-[10px] text-ink/50 uppercase tracking-wider">Destination</span>
                  <span className="text-ink/80 truncate max-w-[200px]">{formData.city}, {formData.state}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-brand/50">
                  <span className="font-label text-[10px] text-ink/50 uppercase tracking-wider">Total</span>
                  <span className="font-label text-sm text-berry font-medium">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/shop" className="flex-1">
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    className="w-full py-3 rounded-[12px] bg-berry text-paper font-label text-[10px] uppercase tracking-widest hover:bg-[#580118] transition-colors shadow-soft"
                  >
                    Continue Browsing
                  </motion.button>
                </Link>
                <Link href="/" className="flex-1">
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    className="w-full py-3 rounded-[12px] bg-paper text-ink font-label text-[10px] uppercase tracking-widest hover:bg-surface transition-colors border border-brand"
                  >
                    Return Home
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-surface/50 border-b border-brand py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-[10px] text-ink/50">
            <Link href="/" className="hover:text-berry transition-colors">Home</Link>
            <span>/</span>
            <Link href="/cart" className="hover:text-berry transition-colors">Cart</Link>
            <span>/</span>
            <span className="text-ink font-medium">Checkout</span>
          </nav>
          <div className="flex items-center gap-2 font-label text-[9px] text-ink/60">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-emerald-600">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3.3 5.3l-4 4a.5.5 0 0 1-.7 0l-2-2a.5.5 0 1 1 .7-.7L7 9.3l3.6-3.6a.5.5 0 0 1 .7.7z" />
            </svg>
            256-bit Encrypted Checkout
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 && !orderPlaced ? (
          <div className="text-center py-20">
            <p className="font-hand text-3xl text-ink/60">Your cart is empty.</p>
            <p className="font-body text-xs text-ink/40 mt-2">Add some handcrafted objects before checkout.</p>
            <Link
              href="/shop"
              className="mt-6 inline-block px-6 py-2.5 rounded-[12px] bg-berry text-paper font-label text-[11px] uppercase tracking-wider"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Form: Shipping & Details */}
            <div className="lg:col-span-7 space-y-8">
              {/* Contact Information */}
              <div className="bg-paper p-6 rounded-[20px] border border-brand shadow-soft space-y-4">
                <h2 className="font-label text-xs uppercase tracking-wider text-ink font-semibold">
                  1. Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                    />
                  </div>
                  <div>
                    <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">
                      Phone Number (For Tracking SMS)
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-paper p-6 rounded-[20px] border border-brand shadow-soft space-y-4">
                <h2 className="font-label text-xs uppercase tracking-wider text-ink font-semibold">
                  2. Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                    />
                  </div>
                  <div>
                    <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">Address & House No.</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                    />
                  </div>
                  <div>
                    <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                    />
                  </div>
                  <div>
                    <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label text-[10px] text-ink/60 uppercase block mb-1">
                    Special Packaging or Delivery Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-[10px] bg-surface border border-brand text-xs font-body text-ink focus:outline-none focus:border-berry"
                  />
                </div>
              </div>

              {/* Payment Selection */}
              <div className="bg-paper p-6 rounded-[20px] border border-brand shadow-soft space-y-4">
                <h2 className="font-label text-xs uppercase tracking-wider text-ink font-semibold">
                  3. Payment Method
                </h2>
                <div className="space-y-2">
                  {[
                    { id: "upi", label: "Instant UPI (Google Pay / PhonePe / Paytm / BHIM)", badge: "Fastest" },
                    { id: "card", label: "Credit / Debit Card (Visa, Mastercard, RuPay)", badge: "Zero Fee" },
                    { id: "cod", label: "Cash on Delivery", badge: "Available" },
                  ].map((method) => (
                    <label
                      key={method.id}
                      onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                      className={`flex items-center justify-between p-3.5 rounded-[12px] border cursor-pointer transition-colors ${
                        formData.paymentMethod === method.id
                          ? "border-berry bg-berry/5"
                          : "border-brand hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={formData.paymentMethod === method.id}
                          onChange={() => {}}
                          className="accent-berry"
                        />
                        <span className="font-body text-xs text-ink font-medium">{method.label}</span>
                      </div>
                      <span className="font-label text-[9px] text-berry bg-berry/10 px-2 py-0.5 rounded-[6px]">
                        {method.badge}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-28 bg-paper p-6 rounded-[24px] border border-brand shadow-soft space-y-6">
                <h2 className="font-label text-xs uppercase tracking-wider text-ink font-semibold pb-3 border-b border-brand">
                  Order Summary ({items.length} {items.length === 1 ? "Craft" : "Crafts"})
                </h2>

                {/* Items List */}
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 items-center">
                      <div className="w-12 h-14 rounded-[8px] bg-surface overflow-hidden flex-shrink-0 border border-brand/50">
                        {item.imageUrl && (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            width={48}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-xs text-ink truncate font-medium">{item.name}</p>
                        <p className="font-label text-[9px] text-ink/50">{item.variantName} × {item.quantity}</p>
                      </div>
                      <span className="font-label text-xs text-ink font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div className="space-y-2 pt-4 border-t border-brand font-label text-xs">
                  <div className="flex justify-between text-ink/60">
                    <span>Subtotal</span>
                    <span className="text-ink">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-ink/60">
                    <span>Complimentary Express Shipping</span>
                    <span className="text-emerald-700 font-medium">
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-ink/60">
                    <span>Handmade Packaging</span>
                    <span className="text-ink/60">Complimentary</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-brand text-sm font-semibold text-ink">
                    <span>Total Amount</span>
                    <span className="text-berry font-bold">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Place Order CTA with Animated Click & Submit State */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-[14px] bg-berry text-paper font-label text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#580118] transition-all shadow-soft cursor-pointer disabled:opacity-80"
                >
                  {isSubmitting ? (
                    <BrandLoader size="sm" text="Securing Order..." light={true} />
                  ) : (
                    <span>Complete Order &middot; {formatPrice(grandTotal)}</span>
                  )}
                </motion.button>

                <p className="font-label text-[9px] text-center text-ink/40">
                  Backed by 7-Day Replacement Guarantee & Artisanal Provenance Certificate
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
