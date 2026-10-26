/**
 * src/lib/shiprocket/client.ts
 * Server-only Shiprocket External API v1 Client with automatic JWT caching,
 * 401 retry, and unified mock/live mode dispatch.
 * Base URL: https://apiv2.shiprocket.in/v1/external
 */

import { ShiprocketMockAdapter } from "./mock";
import type {
  PickupLocation,
  ServiceabilityResponse,
  CreateShiprocketOrderPayload,
  CreateShiprocketOrderResponse,
  AssignAwbResponse,
  GeneratePickupResponse,
  GenerateLabelResponse,
  TrackingResponse,
} from "./types";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

class ShiprocketClient {
  private mode: "mock" | "live";
  private mockAdapter: ShiprocketMockAdapter;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.mode = (process.env.SHIPROCKET_MODE as "mock" | "live") || "mock";
    this.mockAdapter = new ShiprocketMockAdapter();
  }

  get isMock(): boolean {
    return this.mode === "mock";
  }

  /**
   * Internal auth with JWT caching (10-day validity, Shiprocket standard is 10 days).
   */
  private async getAuthToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "[Shiprocket] Missing SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in environment. Switch to SHIPROCKET_MODE=mock or provide credentials."
      );
    }

    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`[Shiprocket Auth Failed] ${err.message || res.statusText}`);
    }

    const data = await res.json();
    this.token = data.token;
    // Cache for 9 days to be safe
    this.tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return this.token!;
  }

  /**
   * Internal fetch wrapper with auto-reauth on 401
   */
  private async request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    const token = await this.getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401 && !isRetry) {
      // Invalidate token and retry once
      this.token = null;
      this.tokenExpiresAt = 0;
      return this.request<T>(path, options, true);
    }

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const msg = errorJson.message || errorJson.error || res.statusText;
      throw new Error(`Shiprocket API Error (${res.status}): ${msg}`);
    }

    return res.json() as Promise<T>;
  }

  // ─── Unified Public Methods ──────────────────────────────────────────────────

  async getPickupLocations(): Promise<PickupLocation[]> {
    if (this.mode === "mock") return this.mockAdapter.getPickupLocations();

    const data = await this.request<{ data: { shipping_address: PickupLocation[] } }>(
      "/settings/company/pickup"
    );
    return data?.data?.shipping_address || [];
  }

  async addPickupLocation(loc: PickupLocation): Promise<PickupLocation> {
    if (this.mode === "mock") return this.mockAdapter.addPickupLocation(loc);

    const res = await this.request<{ address: PickupLocation }>(
      "/settings/company/addpickup",
      {
        method: "POST",
        body: JSON.stringify(loc),
      }
    );
    return res.address || loc;
  }

  async checkServiceability(params: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number; // kg
    cod: boolean;
  }): Promise<ServiceabilityResponse> {
    if (this.mode === "mock") return this.mockAdapter.checkServiceability(params);

    const query = new URLSearchParams({
      pickup_postcode: params.pickup_postcode,
      delivery_postcode: params.delivery_postcode,
      weight: String(params.weight),
      cod: params.cod ? "1" : "0",
    });

    const data = await this.request<any>(`/courier/serviceability/?${query.toString()}`);
    const availableCouriers = data?.data?.available_courier_companies || [];

    const couriers = availableCouriers.map((c: any) => ({
      courier_company_id: c.courier_company_id,
      courier_name: c.courier_name,
      rate: Number(c.rate || c.freight_charge || 0),
      etd: c.etd || "2-3 Days",
      etd_hours: c.estimated_delivery_days ? c.estimated_delivery_days * 24 : undefined,
      rating: Number(c.rating || 4.5),
      cod_available: Boolean(c.cod),
    }));

    return {
      success: true,
      couriers,
      recommended_courier_id: data?.data?.recommended_courier_company_id,
    };
  }

  async createOrder(payload: CreateShiprocketOrderPayload): Promise<CreateShiprocketOrderResponse> {
    if (this.mode === "mock") return this.mockAdapter.createOrder(payload);

    return this.request<CreateShiprocketOrderResponse>("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async assignAwb(params: {
    shipment_id: number | string;
    courier_id?: number;
  }): Promise<AssignAwbResponse> {
    if (this.mode === "mock") return this.mockAdapter.assignAwb(params);

    const data = await this.request<any>("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: params.shipment_id,
        courier_id: params.courier_id,
      }),
    });

    const resData = data?.response?.data;
    if (!resData?.awb_code) {
      throw new Error(data?.message || "Failed to assign AWB from courier.");
    }

    return {
      awb_code: resData.awb_code,
      courier_company_id: resData.courier_company_id,
      courier_name: resData.courier_name,
      freight_charge: resData.freight_charge,
      etd: resData.etd,
    };
  }

  async generatePickup(params: {
    shipment_id: number | string;
    pickup_date?: string;
  }): Promise<GeneratePickupResponse> {
    if (this.mode === "mock") return this.mockAdapter.generatePickup(params);

    return this.request<GeneratePickupResponse>("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: [params.shipment_id],
        pickup_date: params.pickup_date,
      }),
    });
  }

  async generateLabel(params: {
    shipment_id: number | string;
  }): Promise<GenerateLabelResponse> {
    if (this.mode === "mock") return this.mockAdapter.generateLabel(params);

    return this.request<GenerateLabelResponse>("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({
        shipment_id: [params.shipment_id],
      }),
    });
  }

  async trackByAwb(awb: string): Promise<TrackingResponse> {
    if (this.mode === "mock") return this.mockAdapter.trackByAwb(awb);

    return this.request<TrackingResponse>(`/courier/track/awb/${encodeURIComponent(awb)}`);
  }

  async cancelShiprocketOrder(sr_order_id: string | number): Promise<{ success: boolean; message: string }> {
    if (this.mode === "mock") return this.mockAdapter.cancelShiprocketOrder(sr_order_id);

    return this.request<{ success: boolean; message: string }>("/orders/cancel", {
      method: "POST",
      body: JSON.stringify({ ids: [sr_order_id] }),
    });
  }
}

// Export singleton instance
export const shiprocket = new ShiprocketClient();
