export type Station = { id: string; code: string; name: string; ordering_enabled: boolean; opening_hours: Record<string, { open: string; close: string }> };
export type Product = { id: string; name: string };

const baseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function query<T>(path: string): Promise<T[]> {
  if (!baseUrl || !serviceKey) return [];
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
  return response.ok ? response.json() as Promise<T[]> : [];
}

export function getStations() { return query<Station>("stations?select=id,code,name,ordering_enabled,opening_hours&active=eq.true&order=code"); }
export function getProducts(stationId?: string) { return query<Product>(`products?select=id,name&active=eq.true${stationId ? `&station_id=eq.${stationId}` : ""}&order=position`); }
