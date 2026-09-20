export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rto";

export type TrackingStatus =
  | "placed"
  | "packed"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

export interface OrderAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  variantName?: string;
  price: number; // paise snapshot
  quantity: number;
  imageUrl?: string;
}

export interface TrackingEvent {
  id: string;
  status: TrackingStatus;
  description?: string;
  location?: string;
  occurredAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId?: string;
  awb?: string;
  courierName?: string;
  labelUrl?: string;
  pickupScheduled: boolean;
  status: string;
  eta?: string;
  events: TrackingEvent[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  phone?: string;
  status: OrderStatus;
  subtotal: number; // paise
  shippingCost: number; // paise
  total: number; // paise
  currency: string;
  address: OrderAddress;
  items: OrderItem[];
  shipment?: Shipment;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentMethod?: "razorpay" | "cod";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const TRACKING_STEPS: TrackingStatus[] = [
  "placed",
  "packed",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export const TRACKING_LABELS: Record<TrackingStatus, string> = {
  placed: "Order Placed",
  packed: "Packed",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};
