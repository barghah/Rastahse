/**
 * scripts/test-stock-concurrency.ts
 *
 * Verifies Stage 1 acceptance criterion:
 * "Concurrency test: two simultaneous reservations of the last unit, exactly one succeeds."
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/test-stock-concurrency.ts
 */

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:8000";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("=== STOCK CONCURRENCY TEST ===");
  console.log(`Connecting to: ${SUPABASE_URL}`);

  const testId = `test_conc_${Date.now()}`;
  const testSku = `CONC-${Date.now().toString().slice(-6)}`;
  const orderId1 = crypto.randomUUID();
  const orderId2 = crypto.randomUUID();

  try {
    // 1. Create a test product with exactly 1 unit of available stock
    console.log(`\n1. Creating test product with total_stock = 1, available = 1...`);
    const { error: prodErr } = await supabase.from("products").insert({
      id: testId,
      sku: testSku,
      slug: `concurrency-test-${Date.now()}`,
      name: "Concurrency Test Artisan Vase",
      base_price: 150000,
      status: "active",
      is_one_of_one: true,
    });
    if (prodErr) throw new Error(`Failed to create test product: ${prodErr.message}`);

    const { data: variant, error: varErr } = await supabase
      .from("product_variants")
      .insert({
        product_id: testId,
        sku: `${testSku}-001`,
        variant_name: "Original",
        total_stock: 1,
        withheld_stock: 0,
      })
      .select("id, total_stock, withheld_stock, available_stock")
      .single();

    if (varErr || !variant) throw new Error(`Failed to create variant: ${varErr?.message}`);
    console.log(`   Variant created: ${variant.id}`);
    console.log(`   Initial stock: total=${variant.total_stock}, withheld=${variant.withheld_stock}, available=${variant.available_stock}`);

    if (variant.available_stock !== 1) {
      throw new Error(`Expected available_stock to be 1, got ${variant.available_stock}`);
    }

    // 2. Launch two simultaneous reservation attempts for the last 1 unit
    console.log(`\n2. Firing 2 simultaneous reserve_stock() RPC requests for order 1 and order 2...`);

    const p1 = supabase.rpc("reserve_stock", {
      p_order_id: orderId1,
      p_items_json: [{ variant_id: variant.id, qty: 1 }],
      p_actor: "buyer_1",
    });

    const p2 = supabase.rpc("reserve_stock", {
      p_order_id: orderId2,
      p_items_json: [{ variant_id: variant.id, qty: 1 }],
      p_actor: "buyer_2",
    });

    const [res1, res2] = await Promise.all([p1, p2]);

    console.log("\n3. Results received:");
    console.log("   Attempt 1:", res1.error ? `FAILED (${res1.error.message})` : "SUCCESS (Stock Reserved)");
    console.log("   Attempt 2:", res2.error ? `FAILED (${res2.error.message})` : "SUCCESS (Stock Reserved)");

    const successCount = [res1, res2].filter((r) => !r.error).length;
    const failCount = [res1, res2].filter((r) => !!r.error).length;

    console.log(`\n   Success count: ${successCount}`);
    console.log(`   Failed count:  ${failCount}`);

    if (successCount === 1 && failCount === 1) {
      console.log("\n✅ Concurrency test PASSED: Exactly 1 reservation succeeded, 1 was rejected!");
    } else {
      throw new Error(`❌ Concurrency test FAILED: Expected 1 success and 1 failure, got ${successCount} successes and ${failCount} failures`);
    }

    // 4. Verify post-reservation database stock state
    const { data: updatedVariant } = await supabase
      .from("product_variants")
      .select("total_stock, withheld_stock, available_stock")
      .eq("id", variant.id)
      .single();

    console.log(`\n4. Post-reservation variant state in Postgres:`);
    console.log(`   total_stock:    ${updatedVariant?.total_stock} (expected: 1)`);
    console.log(`   withheld_stock: ${updatedVariant?.withheld_stock} (expected: 1)`);
    console.log(`   available_stock: ${updatedVariant?.available_stock} (expected: 0)`);

    if (updatedVariant?.available_stock !== 0 || updatedVariant?.withheld_stock !== 1) {
      throw new Error("Invalid stock counts after reservation");
    }

    // 5. Verify audit ledger
    const { data: movements } = await supabase
      .from("stock_movements")
      .select("reason, delta_withheld, delta_total, actor")
      .eq("variant_id", variant.id);

    console.log(`\n5. Audit ledger entries in stock_movements (${movements?.length} entries):`);
    movements?.forEach((m) => {
      console.log(`   - Reason: ${m.reason}, delta_withheld: ${m.delta_withheld}, actor: ${m.actor}`);
    });

    // 6. Test release_stock
    console.log(`\n6. Testing release_stock for cancelled order...`);
    const successfulOrderId = !res1.error ? orderId1 : orderId2;
    const { error: relErr } = await supabase.rpc("release_stock", {
      p_order_id: successfulOrderId,
      p_items_json: [{ variant_id: variant.id, qty: 1 }],
      p_actor: "buyer_cancelled",
    });
    if (relErr) throw new Error(`release_stock failed: ${relErr.message}`);

    const { data: releasedVariant } = await supabase
      .from("product_variants")
      .select("total_stock, withheld_stock, available_stock")
      .eq("id", variant.id)
      .single();

    console.log(`   After release: total=${releasedVariant?.total_stock}, withheld=${releasedVariant?.withheld_stock}, available=${releasedVariant?.available_stock}`);
    if (releasedVariant?.available_stock !== 1 || releasedVariant?.withheld_stock !== 0) {
      throw new Error("Failed to release stock properly");
    }
    console.log("✅ Stock release PASSED: Available stock restored to 1.");

  } finally {
    // Cleanup test data
    console.log(`\n7. Cleaning up test record ${testId}...`);
    await supabase.from("products").delete().eq("id", testId);
    console.log("🧹 Cleanup complete.");
  }
}

main().catch((err) => {
  console.error("\n❌ Test execution error:", err);
  process.exit(1);
});
