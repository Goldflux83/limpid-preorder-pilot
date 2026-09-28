import { redirect } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export async function requireActiveAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await createSupabaseAdminClient()
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (!profile) redirect("/admin/login?error=not-authorized");
  return { supabase, user };
}

export async function requireAdmin() {
  const { supabase, user } = await requireActiveAdmin();
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") redirect("/admin/mfa");
  return user;
}
