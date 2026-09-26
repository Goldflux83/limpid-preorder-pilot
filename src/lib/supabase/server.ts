import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function config() {
  const configuredUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const url = configuredUrl && normalizeSupabaseUrl(configuredUrl);
  if (!url || !key) throw new Error("Supabase is not configured");
  return { url, key };
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, key } = config();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) =>
        items.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
    },
  });
}

export function createSupabaseAdminClient() {
  const configuredUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const url = configuredUrl && normalizeSupabaseUrl(configuredUrl);
  if (!url || !key) throw new Error("Supabase service role is not configured");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
