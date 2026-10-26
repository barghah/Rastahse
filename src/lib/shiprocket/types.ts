/**
 * src/lib/shiprocket/types.ts
 * Type definitions matching Shiprocket External API v1 (apiv2.shiprocket.in/v1/external)
 */

export type DeliveryStatus =
  | "waiting_approval"
  | "pending_dropoff"
  | "in_transit"
  | "delivered"
  | "retrying"
  | "returned"
  | "return_in_transit"
  | "cancelled";

export type PaymentStatus = "awaiting_payment" | "paid" | "cod" | "refunded";
export type PaymentMethod = "razorpay" | "cod";
export type HandoverMethod = "pickup" | "dropoff";

export interface ShiprocketCourierPartner {
  courier_company_id: number;
  courier_name: string;
  rate: number; // in INR
  etd: string; // Estimated Delivery Date (e.g., "28 Oct 2026")
  etd_hours?: number;
  rating?: number;
  is_cheapest?: boolean;
  is_fastest?: boolean;
  cod_available: boolean;
}

export interface ServiceabilityResponse {
  success: boolean;
  couriers: ShiprocketCourierPartner[];
  recommended_courier_id?: number;
  error?: string;
}

export interface PickupLocation {
  id?: string;
  pickup_location: string;
  pin_code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email?: string;
  is_primary_location?: number | boolean;
}

export interface CreateShiprocketOrderPayload {
  order_id: string; // Our internal UUID / channel order ID
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: number;
    hsn?: string;
  }>;
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number; // in KG
}

export interface CreateShiprocketOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
}

export interface AssignAwbResponse {
  awb_code: string;
  courier_company_id: number;
  courier_name: string;
  freight_charge?: number;
  etd?: string;
}

export interface GeneratePickupResponse {
  pickup_status: number;
  response: {
    pickup_scheduled_date?: string;
    pickup_token_number?: string;
    message?: string;
  };
}

export interface GenerateLabelResponse {
  label_created: number;
  label_url: string;
}

export interface TrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  sr_status: string;
}

export interface TrackingResponse {
  tracking_data: {
    track_status: number;
    shipment_status: number;
    shipment_track?: TrackingActivity[];
    shipment_track_activities?: TrackingActivity[];
    track_url?: string;
    etd?: string;
  };
}
