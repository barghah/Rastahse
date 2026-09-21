"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  upsertProductOverride,
  toggleProductVisibility,
  deleteProduct,
  restoreProduct,
  toggleProductStock,
  type ProductOverride,
} from "@/actions/admin";
import type { Product } from "@/types/product";

interface Props {
  product: Product;
  override?: ProductOverride;
}

/**
 * ProductOverrideForm — inline interactive product manager.
 * Supports:
 * - Hiding / Unhiding product from storefront
 * - Soft Deleting / Archiving & Restoring product
 * - In Stock / Out of Stock toggle
 * - Custom Price and Description overrides
 */
export function ProductOverrideForm({ product, override }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Form states
  const [priceStr, setPriceStr] = useState(
    override?.price_override !== undefined ? String(override.price_override) : ""
  );
  const [description, setDescription] = useState(
    override?.description_override ?? ""
  );
  const [inStock, setInStock] = useState(override?.in_stock ?? true);
  const [isHidden, setIsHidden] = useState(override?.is_hidden ?? false);
  const [isDeleted, setIsDeleted] = useState(override?.is_deleted ?? false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasPriceOverride = override?.price_override !== undefined;
  const hasDescOverride = Boolean(override?.description_override);

  // Quick Action: Toggle Visibility
  function handleToggleVisibility(e: React.MouseEvent) {
    e.stopPropagation();
    const nextHidden = !isHidden;
    setIsHidden(nextHidden);
    setErrorMsg(null);
    setSuccessMsg(nextHidden ? "Product hidden from store" : "Product visible on store");

    startTransition(async () => {
      const res = await toggleProductVisibility(product.id, nextHidden);
      if (!res.success) {
        setIsHidden(!nextHidden); // rollback
        setErrorMsg(res.error || "Failed to toggle visibility.");
      } else if (res.error) {
        setErrorMsg(res.error); // column missing notice
      } else {
        router.refresh();
      }
    });
  }

  // Quick Action: Toggle Stock
  function handleToggleStock(e: React.MouseEvent) {
    e.stopPropagation();
    const nextStock = !inStock;
    setInStock(nextStock);
    setErrorMsg(null);
    setSuccessMsg(nextStock ? "Marked as In Stock" : "Marked as Out of Stock");

    startTransition(async () => {
      const res = await toggleProductStock(product.id, nextStock);
      if (!res.success) {
        setInStock(!nextStock); // rollback
        setErrorMsg(res.error || "Failed to toggle stock.");
      } else {
        router.refresh();
      }
    });
  }

  // Quick Action: Delete / Archive
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setConfirmDelete(false);
    setIsDeleted(true);
    setIsHidden(true);
    setErrorMsg(null);
    setSuccessMsg("Product moved to archive");

    startTransition(async () => {
      const res = await deleteProduct(product.id);
      if (!res.success) {
        setIsDeleted(false);
        setIsHidden(false);
        setErrorMsg(res.error || "Failed to delete product.");
      } else if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.refresh();
      }
    });
  }

  // Quick Action: Restore
  function handleRestore(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDeleted(false);
    setIsHidden(false);
    setErrorMsg(null);
    setSuccessMsg("Product restored to active catalog");

    startTransition(async () => {
      const res = await restoreProduct(product.id);
      if (!res.success) {
        setIsDeleted(true);
        setIsHidden(true);
        setErrorMsg(res.error || "Failed to restore product.");
      } else if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.refresh();
      }
    });
  }

  // Full form save
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const price = priceStr ? parseFloat(priceStr) : undefined;
    if (priceStr && (isNaN(price!) || price! < 0)) {
      setErrorMsg("Please enter a valid price.");
      return;
    }

    startTransition(async () => {
      const res = await upsertProductOverride(product.id, {
        price_override: price,
        description_override: description || undefined,
        in_stock: inStock,
        is_hidden: isHidden,
        is_deleted: isDeleted,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to save overrides.");
      } else {
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg("Saved changes successfully");
        }
        router.refresh();
      }
    });
  }

  return (
    <div
      className={`rounded-[18px] border transition-all duration-200 overflow-hidden ${
        isDeleted
          ? "bg-surface/50 border-red-200 opacity-80"
          : isHidden
          ? "bg-paper border-amber-200 shadow-soft"
          : open
          ? "bg-paper border-berry/40 shadow-md"
          : "bg-paper border-brand hover:border-ink/20 shadow-soft"
      }`}
    >
      {/* ── Main Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
        {/* Left: Thumbnail & Details */}
        <div
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer select-none"
        >
          <div className="w-13 h-13 rounded-[12px] bg-surface overflow-hidden shrink-0 flex items-center justify-center border border-brand/60 relative">
            {product.images?.[0]?.url ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                width={52}
                height={52}
                className={`w-full h-full object-cover transition-opacity ${
                  isDeleted || isHidden ? "grayscale contrast-75" : ""
                }`}
              />
            ) : (
              <span className="text-ink/30 text-xs">—</span>
            )}
            {isDeleted && (
              <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                <span className="text-[10px] text-paper font-semibold">✕</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-body text-sm font-semibold truncate ${
                  isDeleted ? "line-through text-ink/50" : "text-ink"
                }`}
              >
                {product.name}
              </h3>

              {/* Status Badges */}
              {isDeleted ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-label text-[9px] uppercase tracking-wider font-semibold">
                  Archived / Deleted
                </span>
              ) : isHidden ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-label text-[9px] uppercase tracking-wider font-semibold">
                  Hidden from Store
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-label text-[9px] uppercase tracking-wider font-medium">
                  Live on Store
                </span>
              )}

              {!inStock && !isDeleted && (
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 font-label text-[9px] uppercase tracking-wider font-medium">
                  Out of Stock
                </span>
              )}

              {hasPriceOverride && (
                <span className="px-2 py-0.5 rounded-full bg-berry/10 text-berry border border-berry/20 font-label text-[9px] uppercase tracking-wider font-semibold">
                  Price Overridden
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-label text-[11px] text-ink/50 mt-1">
              <span>
                Original: <strong className="text-ink font-medium">₹{product.price.toLocaleString("en-IN")}</strong>
              </span>
              {override?.price_override !== undefined && (
                <span className="text-berry font-semibold">
                  → Active: ₹{override.price_override.toLocaleString("en-IN")}
                </span>
              )}
              <span>· {product.categorySlug}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand/50 justify-between sm:justify-end">
          {/* Hide / Show Toggle Button */}
          {!isDeleted && (
            <button
              type="button"
              onClick={handleToggleVisibility}
              disabled={isPending}
              title={isHidden ? "Click to show on store" : "Click to hide from store"}
              className={`px-3 py-1.5 rounded-[10px] font-label text-[10.5px] uppercase tracking-wider font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                isHidden
                  ? "bg-amber-500 text-paper border-amber-600 shadow-xs hover:bg-amber-600"
                  : "bg-surface hover:bg-surface/80 text-ink/70 border-brand hover:text-ink"
              }`}
            >
              <span>{isHidden ? "🙈" : "👁️"}</span>
              <span>{isHidden ? "Hidden" : "Visible"}</span>
            </button>
          )}

          {/* Quick In/Out Stock Button */}
          {!isDeleted && (
            <button
              type="button"
              onClick={handleToggleStock}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-[10px] font-label text-[10.5px] uppercase tracking-wider font-medium transition-all cursor-pointer border ${
                inStock
                  ? "bg-surface hover:bg-surface/80 text-ink/70 border-brand hover:text-ink"
                  : "bg-stone-200 text-stone-700 border-stone-300"
              }`}
            >
              {inStock ? "Stock: In" : "Stock: Out"}
            </button>
          )}

          {/* Delete / Restore Button */}
          {isDeleted ? (
            <button
              type="button"
              onClick={handleRestore}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-paper font-label text-[10.5px] uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer"
            >
              ↩ Restore
            </button>
          ) : confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-1.5 rounded-[10px] bg-red-600 hover:bg-red-700 text-paper font-label text-[10px] uppercase tracking-wider font-bold transition-all shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="px-2 py-1.5 text-xs text-ink/50 hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              disabled={isPending}
              title="Archive / Delete item"
              className="px-3 py-1.5 rounded-[10px] bg-surface hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-brand text-ink/50 font-label text-[10.5px] uppercase tracking-wider font-medium transition-all cursor-pointer"
            >
              🗑️ Delete
            </button>
          )}

          {/* Edit Accordion Toggle */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-[10px] hover:bg-surface border border-transparent hover:border-brand text-ink/40 hover:text-ink transition-colors cursor-pointer text-xs"
            title="Expand edit form"
          >
            {open ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Instant Notification Banner */}
      {(successMsg || errorMsg) && (
        <div
          className={`px-5 py-2 text-xs font-body font-medium flex items-center justify-between border-t ${
            errorMsg ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <span>{errorMsg ?? `✓ ${successMsg}`}</span>
          <button
            type="button"
            onClick={() => {
              setSuccessMsg(null);
              setErrorMsg(null);
            }}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Expandable Override Form ── */}
      {open && (
        <form
          onSubmit={handleSave}
          className="px-6 pb-6 pt-3 space-y-4 border-t border-brand bg-surface/30"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Price override */}
            <div>
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
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

            {/* Visibility & Stock Flags */}
            <div className="space-y-2">
              <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
                Storefront Controls
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsHidden((h) => !h)}
                  className={`px-3.5 py-2 rounded-[8px] font-label text-[10px] uppercase tracking-wider transition-all cursor-pointer font-medium ${
                    isHidden
                      ? "bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
                      : "bg-paper text-ink/70 border border-brand hover:border-ink/20"
                  }`}
                >
                  {isHidden ? "🙈 Hidden from Store" : "👁️ Visible on Store"}
                </button>

                <button
                  type="button"
                  onClick={() => setInStock((s) => !s)}
                  className={`px-3.5 py-2 rounded-[8px] font-label text-[10px] uppercase tracking-wider transition-all cursor-pointer font-medium ${
                    inStock
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold"
                      : "bg-stone-200 text-stone-700 border border-stone-300"
                  }`}
                >
                  {inStock ? "✓ In Stock" : "✕ Out of Stock"}
                </button>
              </div>
            </div>
          </div>

          {/* Description override */}
          <div>
            <label className="font-label text-[10.5px] text-ink/60 uppercase tracking-wider block mb-1.5 font-semibold">
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

          <div className="flex items-center justify-between pt-2">
            <p className="font-body text-xs text-ink/45">
              Changes reflect immediately on the storefront catalog and search.
            </p>

            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-berry text-paper font-label text-[10.5px] uppercase tracking-widest rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer font-medium"
            >
              {isPending ? "Saving…" : "Save All Overrides"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
