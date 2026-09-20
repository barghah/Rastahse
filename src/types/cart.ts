export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  price: number; // paise
  quantity: number;
  imageUrl?: string;
  slug: string;
  /** Max stock available — enforced in UI */
  maxStock: number;
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}
