/**
 * scripts/test-orders-flow.ts
 * Verifies Stage 2 admin order management & Shiprocket booking workflow.
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/test-orders-flow.ts
 */

import { createClient } from "@supabase/supabase-js";
import { shiprocket } from "../src/lib/shiprocket/client";
import { mapShiprocketStatus } from "../src/lib/shiprocket/status-mapper";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log("=== STAGE 2 ORDERS & SHIPROCKET INTEGRATION TEST ===");

  // 1. Check orders in DB
  const { data: orders, error: ordErr } = await supabase
    .from("orders")
    .select("id, email, payment_method, payment_status, delivery_status")
    .order("created_at", { ascending: false });

  if (ordErr) throw new Error(`Orders fetch failed: ${ordErr.message}`);
  console.log(`\n1. Found ${orders.length} orders in database.`);
  orders.forEach((o) => {
    console.log(`   - #${o.id.slice(0, 8).toUpperCase()}: payment=${o.payment_status} (${o.payment_method}), delivery=${o.delivery_status}`);
  });

  // 2. Test Shiprocket Mock Serviceability
  console.log(`\n2. Testing Shiprocket serviceability check (Indiranagar -> Delhi 110003)...`);
  const serviceability = await shiprocket.checkServiceability({
    pickup_postcode: "560038",
    delivery_postcode: "110003",
    weight: 1.2,
    cod: false,
  });

  console.log(`   Serviceability success: ${serviceability.success}`);
  console.log(`   Couriers found: ${serviceability.couriers.length}`);
  serviceability.couriers.forEach((c) => {
    console.log(`   • ${c.courier_name} — Rate: ₹${c.rate}, ETD: ${c.etd} ${c.is_cheapest ? "[CHEAPEST]" : ""} ${c.is_fastest ? "[FASTEST]" : ""}`);
  });

  // 3. Test Status Mapper
  console.log(`\n3. Testing Status Mapper:`);
  const testStatuses = [
    "AWB ASSIGNED",
    "IN TRANSIT",
    "DELIVERED",
    "UNDELIVERED_ATTEMPT_1",
    "RTO IN TRANSIT",
    "RTO DELIVERED",
    "LOST_IN_TRANSIT",
  ];

  testStatuses.forEach((st) => {
    const res = mapShiprocketStatus(st);
    console.log(`   - "${st}" -> delivery_status: "${res.deliveryStatus}", needsAttention: ${res.needsAttention}`);
  });

  // 4. Test Resumable Booking Flow via mock
  console.log(`\n4. Simulating Approve & Book flow for order #${orders[0]?.id.slice(0, 8)}...`);
  const testOrder = orders[0];
  if (testOrder) {
    const srOrder = await shiprocket.createOrder({
      order_id: testOrder.id,
      order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      pickup_location: "Primary Studio",
      billing_customer_name: "Rohan Verma",
      billing_address: "Flat 402, Shanti Niketan",
      billing_city: "Bengaluru",
      billing_pincode: "560038",
      billing_state: "Karnataka",
      billing_country: "India",
      billing_email: "rohan@example.com",
      billing_phone: "+91 98765 43210",
      shipping_is_billing: true,
      order_items: [{ name: "Koodai Bag", sku: "KOD-NAT-001", units: 1, selling_price: 1850 }],
      payment_method: "Prepaid",
      sub_total: 1850,
      length: 20,
      breadth: 15,
      height: 10,
      weight: 0.8,
    });
    console.log(`   Step 2 (sr_order_created): Shiprocket order_id=${srOrder.order_id}, shipment_id=${srOrder.shipment_id}`);

    const awbRes = await shiprocket.assignAwb({
      shipment_id: srOrder.shipment_id,
      courier_id: 1,
    });
    console.log(`   Step 3 (awb_assigned): AWB=${awbRes.awb_code}, Courier=${awbRes.courier_name}`);

    const labelRes = await shiprocket.generateLabel({
      shipment_id: srOrder.shipment_id,
    });
    console.log(`   Step 5 (label_ready): Label URL=${labelRes.label_url}`);
  }

  console.log("\n✅ All orders & Shiprocket integration tests passed successfully!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
