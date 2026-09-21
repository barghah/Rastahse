/**
 * types/supabase.ts
 * Generated database types for Supabase.
 * Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts`
 * to regenerate after schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          email: string;
          phone: string | null;
          status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          items: Json;
          subtotal: number;
          shipping_fee: number;
          total: number;
          shipping_address: Json;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          shiprocket_order_id: string | null;
          tracking_number: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          email: string;
          phone?: string | null;
          status?: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          items: Json;
          subtotal: number;
          shipping_fee: number;
          total: number;
          shipping_address: Json;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          shiprocket_order_id?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          email?: string;
          phone?: string | null;
          status?: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
          items?: Json;
          subtotal?: number;
          shipping_fee?: number;
          total?: number;
          shipping_address?: Json;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          shiprocket_order_id?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          created_at: string;
          display_name: string | null;
          phone: string | null;
          is_admin: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
        };
        Relationships: [];
      };

      product_overrides: {
        Row: {
          product_id: string;
          price_override: number | null;
          description_override: string | null;
          in_stock: boolean;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          price_override?: number | null;
          description_override?: string | null;
          in_stock?: boolean;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          price_override?: number | null;
          description_override?: string | null;
          in_stock?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };

      wishlists: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          product_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          product_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          product_id?: string;
        };
        Relationships: [];
      };

      contact_messages: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          replied: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          replied?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          replied?: boolean;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: {
      order_status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
    };
  };
}

// ─── Convenience row types ────────────────────────────────────────────────────
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type WishlistRow = Database["public"]["Tables"]["wishlists"]["Row"];
export type ContactMessageRow = Database["public"]["Tables"]["contact_messages"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProductOverrideRow = Database["public"]["Tables"]["product_overrides"]["Row"];
