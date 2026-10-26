/**
 * scripts/migrate-catalog.ts
 *
 * Migrates content/products.json → Supabase (categories, products,
 * product_variants, product_images) and uploads local product images
 * from public/products/ into the "product-media" Supabase Storage bucket.
 *
 * USAGE:
 *   # 1. Copy .env.example → .env.local and fill in your keys.
 *   # 2. Run:
 *   npx tsx scripts/migrate-catalog.ts
 *
 *   # Dry-run (no writes to Supabase):
 *   npx tsx scripts/migrate-catalog.ts --dry-run
 *
 *   # Skip image upload (useful if bucket not ready):
 *   npx tsx scripts/migrate-catalog.ts --skip-images
 *
 * SAFETY:
 *   • All inserts use UPSERT (on conflict do update) — safe to re-run.
 *   • product_overrides rows (from old patch table) are applied on top.
 *   • content/products.json and product_overrides table are NOT deleted.
 *     Delete them only after you confirm data in Supabase looks correct.
 *
 * WHAT HAPPENS TO IMAGES:
 *   For each product image with a local path like /products/p2_koodai-bag.jpeg:
 *   1. Read the file from public/products/
 *   2. Upload to Supabase Storage bucket "product-media" at products/<filename>
 *   3. Get the public URL from Supabase
 *   4. Store that URL in product_images.url
 *
 *   For images with external http URLs, they are stored as-is (no upload).
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { createClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = "product-media";

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_IMAGES = process.argv.includes("--skip-images");
const REPO_ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const JSON_PATH = path.join(REPO_ROOT, "content", "products.json");

// ─── Logging helpers ──────────────────────────────────────────────────────────

const log = {
  info:    (msg: string) => console.log(`\x1b[36m[INFO]\x1b[0m  ${msg}`),
  ok:      (msg: string) => console.log(`\x1b[32m[OK]\x1b[0m    ${msg}`),
  warn:    (msg: string) => console.log(`\x1b[33m[WARN]\x1b[0m  ${msg}`),
  error:   (msg: string) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  section: (msg: string) => console.log(`\n\x1b[1m\x1b[35m═══ ${msg} ═══\x1b[0m`),
  dry:     (msg: string) => console.log(`\x1b[90m[DRY-RUN]\x1b[0m ${msg}`),
};

// ─── Types matching content/products.json ─────────────────────────────────────

interface JsonCategory {
  slug: string;
  name: string;
  description?: string;
  iconPath?: string;
  fruitColor?: string;
  visible: boolean;
  sortOrder: number;
}

interface JsonVariant {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold: number;
}

interface JsonImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

interface JsonProduct {
  id: string;
  slug: string;
  name: string;
  origin?: string;
  description: string;
  story: string;
  curatorNote?: string;
  price: number;
  comparePrice?: number | null;
  categorySlug: string;
  tags: string[];
  images: JsonImage[];
  variants: JsonVariant[];
  curated: boolean;
  curatedOrder?: number;
  visible: boolean;
  oneOfOne: boolean;
  createdAt?: string;
}

interface MigrationReport {
  categories: { upserted: number };
  products:   { upserted: number; overridesApplied: number };
  variants:   { upserted: number };
  images:     { uploaded: number; skipped: number; failed: number };
  overrides:  { applied: number };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log.section("Rastahse Catalog Migration");

  if (DRY_RUN) log.warn("DRY-RUN mode — no writes will be made.");
  if (SKIP_IMAGES) log.warn("--skip-images — image uploads will be skipped.");

  // Validate env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log.error(
      "Missing environment variables.\n" +
      "  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n" +
      "  Copy .env.example → .env.local and fill in your keys, then re-run.\n" +
      "  Or prefix the command: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/migrate-catalog.ts"
    );
    process.exit(1);
  }

  // Read JSON
  if (!fs.existsSync(JSON_PATH)) {
    log.error(`products.json not found at ${JSON_PATH}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(JSON_PATH, "utf8")) as {
    categories: JsonCategory[];
    products: JsonProduct[];
  };

  log.info(`Loaded ${raw.categories.length} categories and ${raw.products.length} products from JSON.`);

  // Supabase client (service role — bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report: MigrationReport = {
    categories: { upserted: 0 },
    products:   { upserted: 0, overridesApplied: 0 },
    variants:   { upserted: 0 },
    images:     { uploaded: 0, skipped: 0, failed: 0 },
    overrides:  { applied: 0 },
  };

  // ── 1. Fetch or load existing product_overrides ──────────────────────────────
  log.section("Loading existing product_overrides");

  let overridesMap: Record<string, {
    price_override?: number | null;
    description_override?: string | null;
    in_stock: boolean;
    is_hidden: boolean;
    is_deleted: boolean;
  }> = {};

  const { data: overrides, error: overridesErr } = await supabase
    .from("product_overrides")
    .select("*");

  if (overridesErr) {
    log.warn(`Could not read product_overrides: ${overridesErr.message} — continuing without them.`);
  } else if (overrides && overrides.length > 0) {
    for (const o of overrides) {
      overridesMap[o.product_id] = o;
    }
    log.info(`Found ${overrides.length} existing overrides to apply.`);
  } else {
    log.info("No existing product_overrides found.");
  }

  // ── 2. Ensure "product-media" bucket exists ───────────────────────────────────
  if (!SKIP_IMAGES && !DRY_RUN) {
    log.section("Storage Bucket");
    const { data: bucket, error: bucketErr } = await supabase.storage.getBucket(BUCKET_NAME);
    if (bucketErr || !bucket) {
      log.info(`Creating bucket "${BUCKET_NAME}"...`);
      const { error: createErr } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      });
      if (createErr) {
        log.error(`Failed to create bucket: ${createErr.message}`);
        log.warn("Continuing without image upload. Run again after creating bucket manually.");
      } else {
        log.ok(`Bucket "${BUCKET_NAME}" created.`);
      }
    } else {
      log.ok(`Bucket "${BUCKET_NAME}" exists.`);
    }
  }

  // ── 3. Upsert Categories ──────────────────────────────────────────────────────
  log.section("Categories");

  // First pass: get IDs for slug lookup later
  const categoryIdBySlug: Record<string, string> = {};

  for (const cat of raw.categories) {
    const payload = {
      slug:       cat.slug,
      name:       cat.name,
      description: cat.description ?? null,
      icon_path:  cat.iconPath ?? null,
      fruit_color: cat.fruitColor ?? null,
      sort_order: cat.sortOrder,
      is_visible: cat.visible,
    };

    if (DRY_RUN) {
      log.dry(`Would upsert category: ${cat.slug}`);
      continue;
    }

    const { data, error } = await supabase
      .from("categories")
      .upsert(payload, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (error) {
      log.error(`Category "${cat.slug}": ${error.message}`);
    } else if (data) {
      categoryIdBySlug[data.slug] = data.id;
      log.ok(`Category: ${cat.slug} → ${data.id}`);
      report.categories.upserted++;
    }
  }

  // If dry run, skip rest
  if (DRY_RUN) {
    log.section("Dry Run Complete");
    log.warn("No data was written. Remove --dry-run to execute.");
    return;
  }

  // Fetch all categories again to build slug→id map (handles pre-existing rows)
  const { data: allCats } = await supabase.from("categories").select("id, slug");
  if (allCats) {
    for (const c of allCats) categoryIdBySlug[c.slug] = c.id;
  }

  // ── 4. Upsert Products, Variants, Images ─────────────────────────────────────
  log.section("Products");

  for (const p of raw.products) {
    const override = overridesMap[p.id];

    // Apply overrides: price, description, visibility, deleted
    const finalPrice       = override?.price_override != null
      ? Math.round(override.price_override * 100) // DB stored as paise; override in rupees
      : p.price;
    const finalDescription = override?.description_override ?? p.description;
    const isHidden         = override?.is_hidden ?? !p.visible;
    const isDeleted        = override?.is_deleted ?? false;
    const baseStock        = override?.in_stock === false ? 0 : undefined; // handled per-variant below
    const categoryId       = categoryIdBySlug[p.categorySlug] ?? null;

    if (!categoryId) {
      log.warn(`Product "${p.id}" has unknown categorySlug "${p.categorySlug}" — category_id will be null.`);
    }

    // Generate a SKU from the first variant's SKU or from the product id
    const primarySku = p.variants[0]?.sku ?? p.id.replace("prod_", "RST-") + "-001";

    const productPayload = {
      id:           p.id,
      sku:          primarySku,
      slug:         p.slug,
      name:         p.name,
      origin:       p.origin ?? null,
      artisan_name: null,               // not in JSON; must be filled via admin UI
      description:  finalDescription,
      story:        p.story,
      curator_note: p.curatorNote ?? null,
      category_id:  categoryId,
      base_price:   finalPrice,
      compare_price: p.comparePrice ?? null,
      cost_price:   null,               // not in JSON; fill via admin UI
      gst_rate:     0,                  // not in JSON; fill via admin UI
      hsn_code:     null,
      barcode:      null,
      weight_grams: null,               // not in JSON; fill via admin UI
      length_cm:    null,
      breadth_cm:   null,
      height_cm:    null,
      tags:         p.tags,
      status:       "active" as const,
      is_curated:   p.curated,
      curated_order: p.curatedOrder ?? null,
      is_one_of_one: p.oneOfOne,
      is_hidden:    isHidden,
      is_deleted:   isDeleted,
      created_at:   p.createdAt ?? new Date().toISOString(),
    };

    const { error: prodErr } = await supabase
      .from("products")
      .upsert(productPayload, { onConflict: "id" });

    if (prodErr) {
      log.error(`Product "${p.id}" (${p.slug}): ${prodErr.message}`);
      continue;
    }

    report.products.upserted++;

    if (override) {
      report.overrides.applied++;
      log.ok(`Product: ${p.id} (${p.slug}) [override applied]`);
    } else {
      log.ok(`Product: ${p.id} (${p.slug})`);
    }

    // ── 4a. Variants ────────────────────────────────────────────────────────────
    for (let vi = 0; vi < p.variants.length; vi++) {
      const v = p.variants[vi];

      // If override says out of stock, force all variant stock to 0
      const stockTotal = (baseStock !== undefined) ? baseStock : v.stock;

      const variantPayload = {
        // Use old variant ID as the natural key for upsert matching
        // We store it in a 'legacy_id' concept via sku (old id was not a uuid)
        sku:                 v.sku ?? `${p.id}-var-${vi + 1}`,
        product_id:          p.id,
        variant_name:        v.name,
        price_delta:         0,
        total_stock:         stockTotal,
        withheld_stock:      0,
        low_stock_threshold: v.lowStockThreshold,
      };

      const { error: varErr } = await supabase
        .from("product_variants")
        .upsert(variantPayload, { onConflict: "sku" });

      if (varErr) {
        log.error(`  Variant "${v.sku}" for ${p.id}: ${varErr.message}`);
      } else {
        report.variants.upserted++;

        // Write initial stock_movements entry
        const { data: varRow } = await supabase
          .from("product_variants")
          .select("id")
          .eq("sku", variantPayload.sku)
          .single();

        if (varRow && stockTotal > 0) {
          await supabase.from("stock_movements").upsert({
            variant_id:    varRow.id,
            order_id:      null,
            delta_total:   stockTotal,
            delta_withheld: 0,
            reason:        "initial",
            actor:         "migration",
            note:          "Seeded from products.json",
          }, { ignoreDuplicates: true });
        }
      }
    }

    // ── 4b. Images ──────────────────────────────────────────────────────────────
    // Delete existing images for this product first (safe on re-run)
    await supabase.from("product_images").delete().eq("product_id", p.id);

    for (let ii = 0; ii < p.images.length; ii++) {
      const img = p.images[ii];
      let finalUrl = img.url;

      if (!SKIP_IMAGES && img.url.startsWith("/")) {
        // LOCAL image — upload to Supabase Storage
        const localFile = path.join(PUBLIC_DIR, img.url);

        if (!fs.existsSync(localFile)) {
          log.warn(`  Image not found locally: ${localFile} — using original URL.`);
          report.images.skipped++;
        } else {
          const ext       = path.extname(img.url).toLowerCase().replace(".", "");
          const mimeType  = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          const storePath = `products/${path.basename(img.url)}`;
          const fileBytes = fs.readFileSync(localFile);

          const { error: uploadErr } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storePath, fileBytes, {
              contentType:  mimeType,
              upsert:       true,           // safe to re-run
            });

          if (uploadErr) {
            log.error(`  Upload failed for ${img.url}: ${uploadErr.message}`);
            report.images.failed++;
          } else {
            const { data: publicData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(storePath);

            finalUrl = publicData.publicUrl;
            log.ok(`  Image: ${img.url} → ${finalUrl}`);
            report.images.uploaded++;
          }
        }
      } else if (img.url.startsWith("http")) {
        // External URL — keep as-is
        report.images.skipped++;
      }

      // Insert image row
      const { error: imgErr } = await supabase.from("product_images").insert({
        product_id: p.id,
        url:        finalUrl,
        alt_text:   img.alt,
        width:      img.width ?? null,
        height:     img.height ?? null,
        sort_order: ii,
        is_primary: ii === 0,
      });

      if (imgErr) {
        log.error(`  Image row insert failed for ${p.id}: ${imgErr.message}`);
      }
    }
  }

  // ── 5. Print Report ───────────────────────────────────────────────────────────
  log.section("Migration Complete");

  console.log(`
  ┌───────────────────────────────────────────────┐
  │          MIGRATION REPORT                     │
  ├───────────────────────────────────────────────┤
  │  Categories upserted   : ${String(report.categories.upserted).padEnd(5)}               │
  │  Products upserted     : ${String(report.products.upserted).padEnd(5)}               │
  │  Overrides applied     : ${String(report.overrides.applied).padEnd(5)}               │
  │  Variants upserted     : ${String(report.variants.upserted).padEnd(5)}               │
  │  Images uploaded       : ${String(report.images.uploaded).padEnd(5)}               │
  │  Images kept (ext/miss): ${String(report.images.skipped).padEnd(5)}               │
  │  Image upload failures : ${String(report.images.failed).padEnd(5)}               │
  └───────────────────────────────────────────────┘
  `);

  if (report.images.failed > 0) {
    log.warn("Some images failed to upload. Re-run the script to retry them (uploads are idempotent).");
  }

  log.warn(
    "\ncontent/products.json and the product_overrides table have NOT been deleted.\n" +
    "Verify the data in Supabase looks correct, then:\n" +
    "  1. Remove the @content/products.json import from src/lib/products.ts\n" +
    "  2. Drop the product_overrides table (create a new migration for that)\n"
  );
}

main().catch((err) => {
  log.error(`Unhandled error: ${err}`);
  process.exit(1);
});
