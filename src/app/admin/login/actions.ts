"use server";
import { redirect } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) redirect("/admin/login?error=invalid");
  const { data: profile } = await createSupabaseAdminClient()
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", data.user.id)
    .eq("active", true)
    .maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-authorized");
  }
  const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
  if (factorError) redirect("/admin/login?error=mfa-unavailable");
  if (!factors?.totp.some((factor) => factor.status === "verified")) {
    redirect("/admin/mfa/enroll");
  }
  redirect("/admin/mfa");
}
