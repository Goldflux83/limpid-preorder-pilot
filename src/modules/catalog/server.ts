import { normalizeSupabaseUrl } from "@/lib/supabase/server";
export type Station = { id: string; code: string; name: string; ordering_enabled: boolean; sound_enabled: boolean; daily_log_url: string | null; opening_hours: Record<string, { open: string; close: string }>; slot_minutes: number; max_per_slot: number; order_min_minutes: number; order_max_minutes: number };
export type Product = { id: string; name: string; options: string[] };

const configuredUrl = process.env.SUPABASE_URL;
const baseUrl = configuredUrl && normalizeSupabaseUrl(configuredUrl);
const serviceKey = process.env.SUPABASE_SECRET_KEY;

async function query<T>(path: string): Promise<T[]> {
  if (!baseUrl || !serviceKey) return [];
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
  return response.ok ? response.json() as Promise<T[]> : [];
}

export function getStations() { return query<Station>("stations?select=id,code,name,ordering_enabled,sound_enabled,daily_log_url,opening_hours,slot_minutes,max_per_slot,order_min_minutes,order_max_minutes&active=eq.true&order=code"); }
export function getProducts(stationId?: string) { return query<Product>(`products?select=id,name,options&active=eq.true${stationId ? `&station_id=eq.${stationId}` : ""}&order=position`); }
