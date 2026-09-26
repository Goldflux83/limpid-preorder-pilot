"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function verifyTotp(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factorId = data?.totp.find(
    (factor) => factor.status === "verified"
  )?.id;
  if (!factorId) redirect("/admin/login?error=mfa-not-enrolled");
  const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
  if (!challenge) redirect("/admin/mfa?error=challenge");
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: String(formData.get("code")),
  });
  if (error) redirect("/admin/mfa?error=invalid");
  redirect("/admin");
}
