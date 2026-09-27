import { NextResponse } from "next/server";
import { markOverdueOrdersUnknown } from "@/modules/store/orders";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }
  const count = await markOverdueOrdersUnknown();
  return NextResponse.json({ count });
}
