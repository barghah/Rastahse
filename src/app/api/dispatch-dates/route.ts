import { NextResponse } from "next/server";
import { getDeliverySettings } from "@/actions/delivery";
import { getNextDispatchDates } from "@/lib/dispatch";

// Cache for 10 minutes — admin rarely changes dispatch days mid-day
export const revalidate = 600;

export async function GET() {
  const settings = await getDeliverySettings();
  const dates = getNextDispatchDates(settings.activeDays, 2).map((d) =>
    d.toISOString()
  );
  return NextResponse.json({ dates }, { status: 200 });
}
