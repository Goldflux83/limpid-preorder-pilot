import { NextResponse } from "next/server";
import { requireAdmin } from "@/modules/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createQrSheetPdf } from "@/modules/admin/qr_sheet";

export async function GET(request: Request) {
  await requireAdmin();
  const variant = new URL(request.url).searchParams.get("variant");
  let query = createSupabaseAdminClient().from("participant_codes").select("code,participant:participants!inner(variant)").eq("status", "active").order("issued_at");
  if (variant) query = query.eq("participants.variant", variant);
  const { data } = await query;
  const entries = (data ?? []).map((entry) => ({ code: entry.code, variant: (Array.isArray(entry.participant) ? entry.participant[0] : entry.participant)?.variant ?? "" }));
  const pdf = await createQrSheetPdf(entries);
  const body = new Uint8Array(pdf.byteLength);
  body.set(pdf);
  return new NextResponse(body.buffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=pilot-qr-codes.pdf", "Cache-Control": "no-store" } });
}
