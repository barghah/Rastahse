/**
 * src/lib/shiprocket/mock.ts
 * High-fidelity mock adapter for local development and staging testing.
 * Simulates Shiprocket external API v1 responses with zero network calls and zero fees.
 */

import type {
  PickupLocation,
  ServiceabilityResponse,
  ShiprocketCourierPartner,
  CreateShiprocketOrderPayload,
  CreateShiprocketOrderResponse,
  AssignAwbResponse,
  GeneratePickupResponse,
  GenerateLabelResponse,
  TrackingResponse,
} from "./types";

const MOCK_LOCATIONS: PickupLocation[] = [
  {
    pickup_location: "Primary Studio",
    pin_code: "560038",
    address: "100ft Road, Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    phone: "+91 98765 43210",
    is_primary_location: 1,
  },
  {
    pickup_location: "Fort Kochi Warehouse",
    pin_code: "682001",
    address: "Calvathy Rd, Fort Kochi",
    city: "Kochi",
    state: "Kerala",
    country: "India",
    phone: "+91 98451 22334",
    is_primary_location: 0,
  },
];

export class ShiprocketMockAdapter {
  async getPickupLocations(): Promise<PickupLocation[]> {
    return [...MOCK_LOCATIONS];
  }

  async addPickupLocation(loc: PickupLocation): Promise<PickupLocation> {
    const existing = MOCK_LOCATIONS.find((l) => l.pickup_location === loc.pickup_location);
    if (existing) return existing;
    MOCK_LOCATIONS.push(loc);
    return loc;
  }

  async checkServiceability(params: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number; // in kg
    cod: boolean;
  }): Promise<ServiceabilityResponse> {
    const wt = Math.max(0.5, params.weight || 0.5);
    const baseRate = Math.round(95 + wt * 60);

    const couriers: ShiprocketCourierPartner[] = [
      {
        courier_company_id: 1,
        courier_name: "Delhivery Surface 500gm",
        rate: baseRate,
        etd: "3-4 Business Days",
        etd_hours: 72,
        rating: 4.6,
        is_cheapest: true,
        cod_available: true,
      },
      {
        courier_company_id: 2,
        courier_name: "Blue Dart Air Priority",
        rate: baseRate + 85,
        etd: "1-2 Business Days",
        etd_hours: 36,
        rating: 4.9,
        is_fastest: true,
        cod_available: true,
      },
      {
        courier_company_id: 3,
        courier_name: "Shadowfax Local & Regional",
        rate: baseRate + 25,
        etd: "2-3 Business Days",
        etd_hours: 48,
        rating: 4.4,
        cod_available: true,
      },
      {
        courier_company_id: 4,
        courier_name: "DTDC Premium Express",
        rate: baseRate + 45,
        etd: "2-3 Business Days",
        etd_hours: 50,
        rating: 4.5,
        cod_available: true,
      },
    ];

    return {
      success: true,
      couriers,
      recommended_courier_id: 1,
    };
  }

  async createOrder(payload: CreateShiprocketOrderPayload): Promise<CreateShiprocketOrderResponse> {
    const orderIdNum = Math.floor(10000000 + Math.random() * 89999999);
    const shipmentIdNum = Math.floor(20000000 + Math.random() * 89999999);

    return {
      order_id: orderIdNum,
      shipment_id: shipmentIdNum,
      status: "NEW",
      status_code: 1,
    };
  }

  async assignAwb(params: {
    shipment_id: number | string;
    courier_id?: number;
  }): Promise<AssignAwbResponse> {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
    const awb = `SR${randomDigits}IN`;

    const courierNames: Record<number, string> = {
      1: "Delhivery Surface 500gm",
      2: "Blue Dart Air Priority",
      3: "Shadowfax Local & Regional",
      4: "DTDC Premium Express",
    };

    const courierName = (params.courier_id && courierNames[params.courier_id]) || "Delhivery Surface 500gm";

    return {
      awb_code: awb,
      courier_company_id: params.courier_id || 1,
      courier_name: courierName,
      freight_charge: 145.0,
      etd: "3-4 Days",
    };
  }

  async generatePickup(params: {
    shipment_id: number | string;
    pickup_date?: string;
  }): Promise<GeneratePickupResponse> {
    return {
      pickup_status: 1,
      response: {
        pickup_scheduled_date: params.pickup_date || new Date().toISOString().split("T")[0],
        pickup_token_number: `PKP-${Math.floor(100000 + Math.random() * 900000)}`,
        message: "Pickup scheduled successfully via courier agent.",
      },
    };
  }

  async generateLabel(params: {
    shipment_id: number | string;
  }): Promise<GenerateLabelResponse> {
    return {
      label_created: 1,
      label_url: "https://apiv2.shiprocket.in/sample_shipping_label.pdf",
    };
  }

  async trackByAwb(awb: string): Promise<TrackingResponse> {
    const now = new Date().toISOString();
    return {
      tracking_data: {
        track_status: 1,
        shipment_status: 17,
        track_url: `https://shiprocket.co/tracking/${awb}`,
        etd: "3 Days",
        shipment_track_activities: [
          {
            date: now,
            status: "IN TRANSIT",
            activity: "Shipment arrived at Bangalore Sorting Center",
            location: "Bengaluru, KA",
            sr_status: "IN TRANSIT",
          },
          {
            date: new Date(Date.now() - 86400000).toISOString(),
            status: "PICKED UP",
            activity: "Shipment handed over to courier agent",
            location: "Indiranagar Hub, Bengaluru",
            sr_status: "PICKED UP",
          },
        ],
      },
    };
  }

  async cancelShiprocketOrder(sr_order_id: string | number): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Shiprocket order #${sr_order_id} cancelled.`,
    };
  }
}
