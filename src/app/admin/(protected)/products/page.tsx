import { getProductOverrides } from "@/actions/admin";
import { getPublicProducts } from "@/lib/products";
import { ProductOverrideForm } from "@/components/admin/ProductOverrideForm";

export default async function AdminProductsPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const allProducts = getPublicProducts();
  const overrides = hasSupabase ? await getProductOverrides() : {};

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="font-label text-2xl text-ink font-semibold tracking-tight">Products & Inventory</h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          {allProducts.length} products · Override price, description, or toggle stock availability
        </p>
      </div>

      <div className="space-y-3">
        {allProducts.map((product) => {
          const override = overrides[product.id];
          return (
            <ProductOverrideForm
              key={product.id}
              product={product}
              override={override}
            />
          );
        })}
      </div>
    </div>
  );
}
