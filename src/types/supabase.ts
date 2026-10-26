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
          payment_method: "razorpay" | "cod";
          payment_status: "awaiting_payment" | "paid" | "cod" | "refunded";
          delivery_status: "waiting_approval" | "pending_dropoff" | "in_transit" | "delivered" | "retrying" | "returned" | "return_in_transit" | "cancelled";
          fulfillment_mode: "shiprocket" | "local" | null;
          needs_attention: boolean;
          delivered_at: string | null;
          expected_delivery_date: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
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
          payment_method?: "razorpay" | "cod";
          payment_status?: "awaiting_payment" | "paid" | "cod" | "refunded";
          delivery_status?: "waiting_approval" | "pending_dropoff" | "in_transit" | "delivered" | "retrying" | "returned" | "return_in_transit" | "cancelled";
          fulfillment_mode?: "shiprocket" | "local" | null;
          needs_attention?: boolean;
          delivered_at?: string | null;
          expected_delivery_date?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
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
          payment_method?: "razorpay" | "cod";
          payment_status?: "awaiting_payment" | "paid" | "cod" | "refunded";
          delivery_status?: "waiting_approval" | "pending_dropoff" | "in_transit" | "delivered" | "retrying" | "returned" | "return_in_transit" | "cancelled";
          fulfillment_mode?: "shiprocket" | "local" | null;
          needs_attention?: boolean;
          delivered_at?: string | null;
          expected_delivery_date?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
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

      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          sku: string;
          name: string;
          unit_price: number;
          qty: number;
          image: string | null;
          weight_grams: number | null;
          length_cm: number | null;
          breadth_cm: number | null;
          height_cm: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          sku?: string;
          name: string;
          unit_price: number;
          qty: number;
          image?: string | null;
          weight_grams?: number | null;
          length_cm?: number | null;
          breadth_cm?: number | null;
          height_cm?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          sku?: string;
          name?: string;
          unit_price?: number;
          qty?: number;
          image?: string | null;
          weight_grams?: number | null;
          length_cm?: number | null;
          breadth_cm?: number | null;
          height_cm?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };

      shipments: {
        Row: {
          id: string;
          order_id: string;
          kind: "forward" | "return";
          sr_order_id: string | null;
          sr_shipment_id: string | null;
          awb: string | null;
          courier_id: string | null;
          courier_name: string | null;
          freight_charge: number | null;
          pickup_location_name: string | null;
          pickup_pincode: string | null;
          handover_method: "pickup" | "dropoff";
          pickup_scheduled_for: string | null;
          label_url: string | null;
          manifest_url: string | null;
          tracking_url: string | null;
          etd: string | null;
          booking_step: "serviceability_checked" | "sr_order_created" | "awb_assigned" | "pickup_requested" | "label_ready" | "done";
          status: "waiting_approval" | "pending_dropoff" | "in_transit" | "delivered" | "retrying" | "returned" | "return_in_transit" | "cancelled";
          last_sr_status: string | null;
          last_sr_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          kind?: "forward" | "return";
          sr_order_id?: string | null;
          sr_shipment_id?: string | null;
          awb?: string | null;
          courier_id?: string | null;
          courier_name?: string | null;
          freight_charge?: number | null;
          pickup_location_name?: string | null;
          pickup_pincode?: string | null;
          handover_method?: "pickup" | "dropoff";
          pickup_scheduled_for?: string | null;
          label_url?: string | null;
          manifest_url?: string | null;
          tracking_url?: string | null;
          etd?: string | null;
          booking_step?: "serviceability_checked" | "sr_order_created" | "awb_assigned" | "pickup_requested" | "label_ready" | "done";
          status?: "waiting_approval" | "pending_dropoff" | "in_transit" | "delivered" | "retrying" | "returned" | "return_in_transit" | "cancelled";
          last_sr_status?: string | null;
          last_sr_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          kind?: "forward" | "return";
          sr_order_id?: string | null;
          sr_shipment_id?: string | null;
          awb?: string | null;
          courier_id?: string | null;
          courier_name?: string | null;
          freight_charge?: number | null;
          pickup_location_name?: string | null;
          pickup_pincode?: string | null;
          handover_method?: "pickup" | "dropoff";
          pickup_scheduled_for?: string | null;
          label_url?: string | null;
          manifest_url?: string | null;
          tracking_url?: string | null;
          etd?: string | null;
          booking_step?: "serviceability_checked" | "sr_order_created" | "awb_assigned" | "pickup_requested" | "label_ready" | "done";
          status?: "waiting_approval" | "pending_dropoff" | "in_transit" | "delivered" | "retrying" | "returned" | "return_in_transit" | "cancelled";
          last_sr_status?: string | null;
          last_sr_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };

      shipment_events: {
        Row: {
          id: string;
          shipment_id: string;
          sr_status: string;
          mapped_status: string;
          location: string | null;
          occurred_at: string;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          sr_status: string;
          mapped_status: string;
          location?: string | null;
          occurred_at?: string;
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          sr_status?: string;
          mapped_status?: string;
          location?: string | null;
          occurred_at?: string;
          payload?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey";
            columns: ["shipment_id"];
            isOneToOne: false;
            referencedRelation: "shipments";
            referencedColumns: ["id"];
          }
        ];
      };

      ndr_cases: {
        Row: {
          id: string;
          shipment_id: string;
          attempt_no: number;
          reason: string | null;
          resolved: boolean;
          action_taken: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          attempt_no?: number;
          reason?: string | null;
          resolved?: boolean;
          action_taken?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shipment_id?: string;
          attempt_no?: number;
          reason?: string | null;
          resolved?: boolean;
          action_taken?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      shop_settings: {
        Row: {
          id: number;
          cod_enabled: boolean;
          cod_max_amount: number;
          cod_blocked_pincodes: string[];
          default_pickup_location_name: string;
          ndr_max_attempts: number;
          return_window_days: number;
          updated_at: string;
        };
        Insert: {
          id?: number;
          cod_enabled?: boolean;
          cod_max_amount?: number;
          cod_blocked_pincodes?: string[];
          default_pickup_location_name?: string;
          ndr_max_attempts?: number;
          return_window_days?: number;
          updated_at?: string;
        };
        Update: {
          id?: number;
          cod_enabled?: boolean;
          cod_max_amount?: number;
          cod_blocked_pincodes?: string[];
          default_pickup_location_name?: string;
          ndr_max_attempts?: number;
          return_window_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      pickup_locations: {
        Row: {
          id: string;
          name: string;
          pin: string;
          address: string;
          city: string;
          state: string;
          phone: string;
          is_default: boolean;
          synced_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          pin: string;
          address: string;
          city: string;
          state: string;
          phone: string;
          is_default?: boolean;
          synced_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          pin?: string;
          address?: string;
          city?: string;
          state?: string;
          phone?: string;
          is_default?: boolean;
          synced_at?: string;
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
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
export type ShipmentEventRow = Database["public"]["Tables"]["shipment_events"]["Row"];
export type NdrCaseRow = Database["public"]["Tables"]["ndr_cases"]["Row"];
export type ShopSettingsRow = Database["public"]["Tables"]["shop_settings"]["Row"];
export type PickupLocationRow = Database["public"]["Tables"]["pickup_locations"]["Row"];
