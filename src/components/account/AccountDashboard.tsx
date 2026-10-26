"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { customerSignOutAction, type CustomerAddress, type CustomerOrder } from "@/actions/customer-auth";
import { CustomerOrdersList } from "./CustomerOrdersList";
import { CustomerAddressManager } from "./CustomerAddressManager";
import { CustomerBagView } from "./CustomerBagView";
import { useCartStore } from "@/stores/cart-store";

interface AccountDashboardProps {
  user: {
    id: string;
    email?: string;
    displayName: string;
    phone?: string | null;
  };
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
}

export function AccountDashboard({ user, orders, addresses }: AccountDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "bag">("orders");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const cartItemsCount = useCartStore((s) => s.totalItems());

  async function handleSignOut() {
    setIsSigningOut(true);
    await customerSignOutAction();
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper pb-24">
      {/* Collector Sanctuary Top Banner */}
      <section className="bg-surface/60 border-b border-brand py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-full bg-paper border border-brand flex items-center justify-center shadow-soft shrink-0">
              <Image
                src="/brand/logos/stone-only.png"
                alt="Rastah"
                width={28}
                height={28}
                className="w-7 h-7 object-contain opacity-70"
              />
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-ink/40 font-medium">
                Collector Sanctuary
              </p>
              <h1 className="font-hand text-3xl sm:text-4xl text-ink">
                Welcome, {user.displayName}
              </h1>
              <p className="font-body text-xs text-ink/50 mt-0.5">
                {user.email} {user.phone ? `· ${user.phone}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="px-4 py-2 rounded-[10px] bg-paper border border-brand font-label text-[10px] uppercase tracking-wider text-ink/60 hover:text-ink hover:border-ink/40 transition-all shadow-soft cursor-pointer"
          >
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      </section>

      {/* Main Tabbed Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-brand overflow-x-auto gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`pb-3 px-3 font-label text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "orders"
                ? "border-berry text-berry font-semibold"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            <span>Orders & Live Tracking</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] ${
                activeTab === "orders" ? "bg-berry/10 text-berry" : "bg-surface text-ink/50"
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            className={`pb-3 px-3 font-label text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "addresses"
                ? "border-berry text-berry font-semibold"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            <span>Saved Addresses</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] ${
                activeTab === "addresses" ? "bg-berry/10 text-berry" : "bg-surface text-ink/50"
              }`}
            >
              {addresses.length}/3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bag")}
            className={`pb-3 px-3 font-label text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === "bag"
                ? "border-berry text-berry font-semibold"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            <span>My Bag</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] ${
                activeTab === "bag" ? "bg-berry/10 text-berry" : "bg-surface text-ink/50"
              }`}
            >
              {cartItemsCount}
            </span>
          </button>
        </div>

        {/* Tab Views */}
        <div>
          {activeTab === "orders" && <CustomerOrdersList orders={orders} />}
          {activeTab === "addresses" && <CustomerAddressManager addresses={addresses} />}
          {activeTab === "bag" && <CustomerBagView />}
        </div>
      </div>
    </div>
  );
}
