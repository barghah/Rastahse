import type { Metadata } from "next";
import { getPublicProducts, getAllTags } from "@/lib/catalog";
import { getVisibleCategories } from "@/lib/products";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "The Full Collection — Rastahse",
  description: "Browse every handmade object in the Rastahse catalogue.",
};

export const revalidate = 60;

export default async function ShopPage() {
  const [allProducts, allTags, categories] = await Promise.all([
    getPublicProducts(),
    getAllTags(),
    getVisibleCategories(),
  ]);
  return (
    <ShopClient
      allProducts={allProducts}
      categories={categories}
      allTags={allTags}
    />
  );
}
