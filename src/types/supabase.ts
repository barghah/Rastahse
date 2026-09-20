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
