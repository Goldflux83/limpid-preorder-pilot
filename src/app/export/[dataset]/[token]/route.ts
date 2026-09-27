import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isExportDataset } from "@/modules/admin/policy";

const selections = {
  stations: "id,code,name,active,ordering_enabled,slot_minutes,max_per_slot,order_min_minutes,order_max_minutes,created_at,updated_at",
  products: "id,station_id,name,options,active,position,created_at,updated_at",
  participants: "id,cohort,variant,station_id,origin,channel,status,can_preorder,created_at,updated_at",
  orders: "id,number,participant_id,station_id,product_id,options,slot_start,status,received_at,displayed_at,closed_at,smiley,open_answer,created_at,updated_at",
  redemptions: "id,participant_id,station_id,occurred_at,source,add_on,created_at,updated_at",
  daily_questions: "id,participant_id,local_date,collected,station_id,add_on,feeling,answered_at,created_at,updated_at",
  vouchers: "id,participant_id,waitlist_entry_id,station_id,kind,valid_until,redeemed_at,created_at,updated_at",
  events: "id,occurred_at,recorded_at,type,participant_id,station_id,order_id,voucher_id,actor_type,actor_id,request_id,schema_version,data,created_at,updated_at",
} as const;

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const value = (input: unknown) => {
    const text = input === null || input === undefined ? "" : typeof input === "object" ? JSON.stringify(input) : String(input);
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [keys.join(","), ...rows.map((row) => keys.map((key) => value(row[key])).join(","))].join("\n");
}

export async function GET(_: Request, { params }: { params: Promise<{ dataset: string; token: string }> }) {
  const { dataset, token } = await params;
  if (!isExportDataset(dataset)) return new NextResponse(null, { status: 404 });
  const admin = createSupabaseAdminClient();
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: grant } = await admin.from("export_tokens").select("id").eq("table_name", dataset).eq("token_hash", hash).eq("active", true).maybeSingle();
  if (!grant) return new NextResponse(null, { status: 404 });
  const exportClient = admin as unknown as { from: (table: string) => { select: (columns: string) => Promise<{ data: Record<string, unknown>[] | null }> } };
  const { data } = await exportClient.from(dataset).select(selections[dataset]);
  await admin.from("events").insert({ type: "export_accessed", actor_type: "anonymous", data: { dataset } });
  return new NextResponse(csv(data ?? []), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${dataset}.csv"`, "cache-control": "no-store" },
  });
}
