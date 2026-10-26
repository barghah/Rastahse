import { createClient } from "@/lib/supabase/server";
import {
  getCustomerOrdersAction,
  getCustomerAddressesAction,
  getCustomerSession,
} from "@/actions/customer-auth";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { CustomerAuthCard } from "@/components/account/CustomerAuthCard";

export const dynamic = "force-dynamic";

/**
 * /account — Collector Sanctuary.
 * Renders inline login & account creation if unauthenticated.
 * Renders decoupled orders, live tracking, multi-address manager (max 3),
 * and bag management if authenticated.
 */
export default async function AccountPage() {
  const sessionUser = await getCustomerSession();

  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-16">
        <CustomerAuthCard />
      </div>
    );
  }

  // Fetch customer orders (with shipments & live tracking events)
  const orders = await getCustomerOrdersAction();

  // Fetch saved customer addresses (max 3, DB enforced)
  const addresses = await getCustomerAddressesAction();

  return (
    <AccountDashboard
      user={sessionUser}
      orders={orders}
      addresses={addresses}
    />
  );
}
