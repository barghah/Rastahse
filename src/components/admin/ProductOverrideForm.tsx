"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upsertProductOverride } from "@/actions/admin";
import type { Product } from "@/types/product";

interface Override {
  price_override?: number;
  description_override?: string;
  in_stock: boolean;
}

interface Props {
  product: Product;
  override?: Override;
}

/**
 * ProductOverrideForm — inline accordion form per product.
 * Collapsed by default, expands on click to edit price/desc/stock.
 */
export function ProductOverrideForm({ product, override }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [priceStr, setPriceStr] = useState(
    override?.price_override !== undefined ? String(override.price_override) : ""
  );
  const [description, setDescription] = useState(
    override?.description_override ?? ""
  );
  const [inStock, setInStock] = useState(override?.in_stock ?? true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasOverride =
    override?.price_override !== undefined ||
    override?.description_override ||
    override?.in_stock === false;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const price = priceStr ? parseFloat(priceStr) : undefined;
    if (priceStr && (isNaN(price!) || price! < 0)) {
      setError("Enter a valid price.");
      return;
    }

    startTransition(async () => {
      try {
        await upsertProductOverride(product.id, {
          price_override: price,
          description_override: description || undefined,
          in_stock: inStock,
        });
        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  return (
    <div
      className={`rounded-[16px] border bg-paper shadow-soft overflow-hidden transition-colors ${
        open ? "border-berry/40" : "border-brand"
      }`}
    >
      {/* Header row — click to expand */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left bg-paper hover:bg-surface/50 transition-colors"
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-[10px] bg-surface overflow-hidden shrink-0 flex items-center justify-center border border-brand/60">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt=""
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-ink/30 text-xs">—</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-ink font-medium truncate">{product.name}</p>
          <p className="font-label text-[11px] text-ink/50 mt-0.5">
            ₹{product.price.toLocaleString("en-IN")}
            {override?.price_override !== undefined && (
              <span className="text-berry ml-2 font-semibold">→ ₹{override.price_override.toLocaleString("en-IN")}</span>
            )}
            {!inStock && <span className="text-red-600 ml-2 font-medium">· Out of stock</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasOverride && (
            <span className="px-2.5 py-0.5 rounded-full bg-berry/10 border border-berry/20 text-berry font-label text-[9.5px] uppercase tracking-wider font-semibold">
              Overridden
            </span>
          )}
          <span className="text-ink/40 text-xs font-mono">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expandable form */}
      {open && (
        <form
          onSubmit={handleSave}
          className="px-6 pb-6 pt-2 space-y-4 border-t border-brand bg-surface/30"
        >
          <div className="grid sm:grid-cols-2 gap-4 pt-3">
            {/* Price override */}
            <div>
              <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
                Price Override (₹) <span className="text-ink/35 normal-case font-normal">· leave blank to use original</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={`Original: ₹${product.price}`}
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-paper border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all"
              />
            </div>

            {/* Stock toggle */}
            <div>
              <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
                Stock Status
              </label>
              <div className="flex gap-3 pt-1">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setInStock(val)}
                    className={`px-4 py-2 rounded-[8px] font-label text-[10px] uppercase tracking-wider transition-all cursor-pointer font-medium ${
                      inStock === val
                        ? val
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"
                          : "bg-red-50 text-red-800 border border-red-300 shadow-xs"
                        : "text-ink/50 bg-paper border border-brand hover:border-ink/20"
                    }`}
                  >
                    {val ? "In Stock" : "Out of Stock"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description override */}
          <div>
            <label className="font-label text-[10px] text-ink/60 uppercase tracking-wider block mb-1.5 font-medium">
              Description Override <span className="text-ink/35 normal-case font-normal">· leave blank to use original</span>
            </label>
            <textarea
              rows={3}
              placeholder={product.description ?? "Original description…"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[10px] font-body text-sm text-ink bg-paper border border-brand outline-none focus:border-berry focus:bg-paper placeholder:text-ink/30 transition-all resize-none"
            />
          </div>

          {success && <p className="font-body text-xs text-emerald-700 font-medium">✓ Saved successfully.</p>}
          {error && <p className="font-body text-xs text-red-600 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer font-medium"
          >
            {isPending ? "Saving…" : "Save Override"}
          </button>
        </form>
      )}
    </div>
  );
}
