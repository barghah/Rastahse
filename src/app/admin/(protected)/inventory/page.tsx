import { getProductOverrides } from "@/actions/admin";
import { loadAdminProducts } from "@/lib/catalog";
import { ProductCatalogManager } from "@/components/admin/ProductCatalogManager";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [{ products: allProducts }, overrides] = await Promise.all([
    loadAdminProducts(),
    hasSupabase ? getProductOverrides() : Promise.resolve({}),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="font-label text-xl sm:text-2xl text-ink font-semibold tracking-tight">
          Inventory
        </h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          {allProducts.length} total objects · Add new products, update images, adjust live inventory counts &amp; prices
        </p>
      </div>

      <ProductCatalogManager
        allProducts={allProducts}
        overrides={overrides}
      />
    </div>
  );
}
