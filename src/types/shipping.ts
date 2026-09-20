export interface ServiceabilityResult {
  serviceable: boolean;
  etaDays?: number;
  etaDate?: string;
  courierName?: string;
  error?: string;
}

export interface RateParams {
  originPincode: string;
  destPincode: string;
  weightGrams: number;
  codEnabled: boolean;
}

export interface ShippingRate {
  provider: string;
  courierName: string;
  rate: number; // paise
  etaDays: number;
}

export interface ShipmentResult {
  providerOrderId: string;
  awb: string;
  courierName: string;
  labelUrl?: string;
}

export interface TrackingUpdate {
  awb: string;
  status: string;
  description?: string;
  location?: string;
  occurredAt: string;
}

export interface ShippingProvider {
  checkServiceability(
    pincode: string,
    params?: { weightGrams?: number }
  ): Promise<ServiceabilityResult>;
  getRate(params: RateParams): Promise<ShippingRate>;
  createShipment(orderId: string, orderData: Record<string, unknown>): Promise<ShipmentResult>;
  cancelShipment(shipmentId: string): Promise<void>;
  getLabel(awb: string): Promise<string>;
  parseWebhook(payload: unknown, signature: string): TrackingUpdate;
}
