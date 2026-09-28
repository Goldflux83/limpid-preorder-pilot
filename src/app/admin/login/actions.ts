"use server";
import { redirect } from "next/navigation";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import {
  classifyAdminLoginFailure,
  type AdminLoginFailure,
} from "@/modules/auth/login-failure";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";

function reportLoginFailure(reason: AdminLoginFailure) {
  console.warn("Admin login rejected", { reason });
  void reportOperationalTelemetry({
    type: "server_action",
    action: "admin_login",
    outcome: "rejected",
    reason,
  });
}

export async function signIn(formData: FormData) {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    reportLoginFailure("configuration");
    redirect("/admin/login?error=configuration");
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) {
    const reason = classifyAdminLoginFailure(error);
    reportLoginFailure(reason);
    redirect(`/admin/login?error=${reason}`);
  }
  let profile: { user_id: string } | null;
  try {
    const { data: profileData, error: profileError } = await createSupabaseAdminClient()
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", data.user.id)
      .eq("active", true)
      .maybeSingle();
    if (profileError) throw profileError;
    profile = profileData;
  } catch {
    reportLoginFailure("configuration");
    redirect("/admin/login?error=configuration");
  }
  if (!profile) {
    await supabase.auth.signOut();
    void reportOperationalTelemetry({ type: "server_action", action: "admin_login", outcome: "rejected" });
    redirect("/admin/login?error=not-authorized");
  }
  const { data: factors, error: factorError } =
    await supabase.auth.mfa.listFactors();
  if (factorError) {
    console.warn("Admin MFA lookup failed");
    void reportOperationalTelemetry({ type: "server_action", action: "admin_login", outcome: "failed" });
    redirect("/admin/login?error=mfa-unavailable");
  }
  void reportOperationalTelemetry({ type: "server_action", action: "admin_login", outcome: "success" });
  if (!factors?.totp.some((factor) => factor.status === "verified")) {
    redirect("/admin/mfa/enroll");
  }
  redirect("/admin/mfa");
}
