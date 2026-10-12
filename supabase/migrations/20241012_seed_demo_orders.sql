-- ─────────────────────────────────────────────────────────────────────────────
-- Rastahse — Demo Orders Seed
-- Paste into Supabase SQL Editor to generate sample orders for testing.
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.orders (
  id, created_at, email, phone, status,
  items, subtotal, shipping_fee, total,
  shipping_address, tracking_number, notes
)
VALUES

-- 1. Fresh pending order
(
  gen_random_uuid(),
  now() - interval '2 hours',
  'priya.sharma@gmail.com',
  '+91 98400 11234',
  'pending',
  '[{"product_id":"koodai-bag","name":"Handwoven Koodai Bag","qty":1,"price":249900}]'::jsonb,
  249900, 0, 249900,
  '{"name":"Priya Sharma","line1":"14, Poes Garden","city":"Chennai","state":"Tamil Nadu","pincode":"600086","country":"India"}'::jsonb,
  NULL,
  'Please pack with care, gifting.'
),

-- 2. Paid, about to be processed
(
  gen_random_uuid(),
  now() - interval '6 hours',
  'aarav.mehta@outlook.com',
  '+91 97100 55678',
  'paid',
  '[{"product_id":"palmyra-weave","name":"Palmyra Leaf Weave","qty":2,"price":89900},{"product_id":"terracotta-pot","name":"Terracotta Pot Set","qty":1,"price":129900}]'::jsonb,
  309700, 9900, 319600,
  '{"name":"Aarav Mehta","line1":"Block 7, Koramangala","city":"Bengaluru","state":"Karnataka","pincode":"560034","country":"India"}'::jsonb,
  NULL,
  NULL
),

-- 3. Processing — packing in progress
(
  gen_random_uuid(),
  now() - interval '1 day',
  'fatima.noor@yahoo.com',
  '+91 93800 22345',
  'processing',
  '[{"product_id":"kolhapuri-sandal","name":"Kolhapuri Leather Sandals","qty":1,"price":349900}]'::jsonb,
  349900, 0, 349900,
  '{"name":"Fatima Noor","line1":"12-A, Banjara Hills","city":"Hyderabad","state":"Telangana","pincode":"500034","country":"India"}'::jsonb,
  NULL,
  'Size 6, please confirm before shipping.'
),

-- 4. Shipped — out for delivery
(
  gen_random_uuid(),
  now() - interval '3 days',
  'vikram.iyer@gmail.com',
  '+91 98200 33456',
  'shipped',
  '[{"product_id":"brass-lamp","name":"Etched Brass Lamp","qty":1,"price":189900},{"product_id":"incense-set","name":"Handmade Incense Set","qty":3,"price":49900}]'::jsonb,
  339600, 9900, 349500,
  '{"name":"Vikram Iyer","line1":"22, Adyar Nagar","city":"Chennai","state":"Tamil Nadu","pincode":"600020","country":"India"}'::jsonb,
  'SR4829301920',
  NULL
),

-- 5. Delivered successfully
(
  gen_random_uuid(),
  now() - interval '7 days',
  'meera.pillai@gmail.com',
  '+91 94400 44567',
  'delivered',
  '[{"product_id":"cane-basket","name":"Cane Storage Basket","qty":2,"price":159900}]'::jsonb,
  319800, 0, 319800,
  '{"name":"Meera Pillai","line1":"Flat 3B, Marine Drive","city":"Kochi","state":"Kerala","pincode":"682001","country":"India"}'::jsonb,
  'SR3748201018',
  NULL
),

-- 6. Delivered — large order
(
  gen_random_uuid(),
  now() - interval '10 days',
  'rajan.krishna@gmail.com',
  '+91 99000 55678',
  'delivered',
  '[{"product_id":"silk-stole","name":"Handloom Silk Stole","qty":1,"price":399900},{"product_id":"jute-tote","name":"Jute Tote Bag","qty":2,"price":129900},{"product_id":"clay-cups","name":"Clay Cup Set (6)","qty":1,"price":199900}]'::jsonb,
  859600, 0, 859600,
  '{"name":"Rajan Krishna","line1":"45, Besant Nagar","city":"Chennai","state":"Tamil Nadu","pincode":"600090","country":"India"}'::jsonb,
  'SR2091837465',
  NULL
),

-- 7. Cancelled by customer
(
  gen_random_uuid(),
  now() - interval '2 days',
  'simran.kaur@hotmail.com',
  '+91 97300 66789',
  'cancelled',
  '[{"product_id":"embroidered-kurti","name":"Phulkari Embroidered Kurti","qty":1,"price":479900}]'::jsonb,
  479900, 9900, 489800,
  '{"name":"Simran Kaur","line1":"B-12, Sector 17","city":"Chandigarh","state":"Punjab","pincode":"160017","country":"India"}'::jsonb,
  NULL,
  'Customer requested cancellation — wrong size.'
),

-- 8. Refunded
(
  gen_random_uuid(),
  now() - interval '14 days',
  'ananya.bose@gmail.com',
  '+91 98600 77890',
  'refunded',
  '[{"product_id":"dokra-figurine","name":"Dokra Metal Figurine","qty":1,"price":229900}]'::jsonb,
  229900, 0, 229900,
  '{"name":"Ananya Bose","line1":"23, Salt Lake Sector 5","city":"Kolkata","state":"West Bengal","pincode":"700091","country":"India"}'::jsonb,
  NULL,
  'Item arrived damaged — full refund processed via Razorpay.'
);
