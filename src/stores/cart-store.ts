"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
import type { Product, ProductVariant } from "@/types/product";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  addItem: {
    (item: CartItem): void;
    (product: Product, variant: ProductVariant, quantity?: number): void;
  };
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (itemOrProduct: CartItem | Product, variant?: ProductVariant, quantity: number = 1) =>
        set((state) => {
          let newItem: CartItem;
          if ("productId" in itemOrProduct) {
            newItem = itemOrProduct as CartItem;
          } else {
            const product = itemOrProduct as Product;
            const v = variant || product.variants[0];
            newItem = {
              productId: product.id,
              variantId: v?.id || "default",
              name: product.name,
              variantName: v?.name,
              price: product.price,
              quantity: quantity,
              imageUrl: product.images[0]?.url,
              slug: product.slug,
              maxStock: v?.stock ?? 10,
            };
          }

          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
          );
          if (existing) {
            const newQty = Math.min(existing.quantity + newItem.quantity, newItem.maxStock);
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.variantId === newItem.variantId
                  ? { ...i, quantity: newQty }
                  : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, newItem], isOpen: true };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.variantId === variantId)
                )
              : state.items.map((i) =>
                  i.productId === productId && i.variantId === variantId
                    ? { ...i, quantity: Math.min(quantity, i.maxStock) }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "rastah-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isOpen = false;
      },
    }
  )
);
