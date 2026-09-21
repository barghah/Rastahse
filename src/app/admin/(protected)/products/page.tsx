import { getProductOverrides } from "@/actions/admin";
import { getPublicProducts } from "@/lib/products";
import { ProductCatalogManager } from "@/components/admin/ProductCatalogManager";

export default async function AdminProductsPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const allProducts = getPublicProducts();
  const overrides = hasSupabase ? await getProductOverrides() : {};

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="font-label text-2xl text-ink font-semibold tracking-tight">
          Products & Inventory
        </h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          {allProducts.length} total objects · Hide, archive, adjust prices, or toggle stock availability
        </p>
      </div>

      <ProductCatalogManager
        allProducts={allProducts}
        overrides={overrides}
      />
    </div>
  );
}
