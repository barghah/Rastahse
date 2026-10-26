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
          is_hidden: boolean;
          is_deleted: boolean;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          price_override?: number | null;
          description_override?: string | null;
          in_stock?: boolean;
          is_hidden?: boolean;
          is_deleted?: boolean;
          updated_at?: string;
        };
        Update: {
          product_id?: string;
          price_override?: number | null;
          description_override?: string | null;
          in_stock?: boolean;
          is_hidden?: boolean;
          is_deleted?: boolean;
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

      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon_path: string | null;
          fruit_color: string | null;
          sort_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon_path?: string | null;
          fruit_color?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon_path?: string | null;
          fruit_color?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      products: {
        Row: {
          id: string;
          sku: string;
          slug: string;
          name: string;
          origin: string | null;
          artisan_name: string | null;
          description: string;
          story: string;
          curator_note: string | null;
          category_id: string | null;
          base_price: number;
          compare_price: number | null;
          cost_price: number | null;
          gst_rate: number;
          hsn_code: string | null;
          barcode: string | null;
          weight_grams: number | null;
          length_cm: number | null;
          breadth_cm: number | null;
          height_cm: number | null;
          tags: string[];
          status: "draft" | "active" | "archived";
          is_curated: boolean;
          curated_order: number | null;
          is_one_of_one: boolean;
          is_hidden: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          sku: string;
          slug: string;
          name: string;
          origin?: string | null;
          artisan_name?: string | null;
          description?: string;
          story?: string;
          curator_note?: string | null;
          category_id?: string | null;
          base_price: number;
          compare_price?: number | null;
          cost_price?: number | null;
          gst_rate?: number;
          hsn_code?: string | null;
          barcode?: string | null;
          weight_grams?: number | null;
          length_cm?: number | null;
          breadth_cm?: number | null;
          height_cm?: number | null;
          tags?: string[];
          status?: "draft" | "active" | "archived";
          is_curated?: boolean;
          curated_order?: number | null;
          is_one_of_one?: boolean;
          is_hidden?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          slug?: string;
          name?: string;
          origin?: string | null;
          artisan_name?: string | null;
          description?: string;
          story?: string;
          curator_note?: string | null;
          category_id?: string | null;
          base_price?: number;
          compare_price?: number | null;
          cost_price?: number | null;
          gst_rate?: number;
          hsn_code?: string | null;
          barcode?: string | null;
          weight_grams?: number | null;
          length_cm?: number | null;
          breadth_cm?: number | null;
          height_cm?: number | null;
          tags?: string[];
          status?: "draft" | "active" | "archived";
          is_curated?: boolean;
          curated_order?: number | null;
          is_one_of_one?: boolean;
          is_hidden?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };

      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          variant_name: string;
          price_delta: number;
          total_stock: number;
          withheld_stock: number;
          available_stock: number;
          low_stock_threshold: number;
          weight_grams: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          variant_name: string;
          price_delta?: number;
          total_stock?: number;
          withheld_stock?: number;
          low_stock_threshold?: number;
          weight_grams?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          variant_name?: string;
          price_delta?: number;
          total_stock?: number;
          withheld_stock?: number;
          low_stock_threshold?: number;
          weight_grams?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };

      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string;
          width: number | null;
          height: number | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt_text?: string;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };

      stock_movements: {
        Row: {
          id: string;
          variant_id: string;
          order_id: string | null;
          delta_total: number;
          delta_withheld: number;
          reason: "initial" | "manual_adjustment" | "order_reserved" | "order_released" | "order_delivered" | "return_restocked" | "rto_restocked" | "write_off";
          actor: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          order_id?: string | null;
          delta_total: number;
          delta_withheld: number;
          reason: "initial" | "manual_adjustment" | "order_reserved" | "order_released" | "order_delivered" | "return_restocked" | "rto_restocked" | "write_off";
          actor?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          order_id?: string | null;
          delta_total?: number;
          delta_withheld?: number;
          reason?: "initial" | "manual_adjustment" | "order_reserved" | "order_released" | "order_delivered" | "return_restocked" | "rto_restocked" | "write_off";
          actor?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: {
      reserve_stock: {
        Args: {
          p_order_id: string;
          p_items_json: Json;
          p_actor?: string;
        };
        Returns: void;
      };
      release_stock: {
        Args: {
          p_order_id: string;
          p_items_json: Json;
          p_actor?: string;
        };
        Returns: void;
      };
      complete_stock: {
        Args: {
          p_order_id: string;
          p_items_json: Json;
          p_actor?: string;
        };
        Returns: void;
      };
      restock_variant: {
        Args: {
          p_variant_id: string;
          p_qty: number;
          p_reason: string;
          p_actor?: string;
          p_note?: string;
          p_order_id?: string;
        };
        Returns: void;
      };
    };

    Enums: {
      order_status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
      product_status: "draft" | "active" | "archived";
      stock_movement_reason: "initial" | "manual_adjustment" | "order_reserved" | "order_released" | "order_delivered" | "return_restocked" | "rto_restocked" | "write_off";
    };
  };
}

// ─── Convenience row types ────────────────────────────────────────────────────
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type WishlistRow = Database["public"]["Tables"]["wishlists"]["Row"];
export type ContactMessageRow = Database["public"]["Tables"]["contact_messages"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProductOverrideRow = Database["public"]["Tables"]["product_overrides"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type StockMovementRow = Database["public"]["Tables"]["stock_movements"]["Row"];
