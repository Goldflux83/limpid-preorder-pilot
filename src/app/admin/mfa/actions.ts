"use server";
import { redirect } from "next/navigation";
import { ui } from "@/config/content";
import { requireActiveAdmin } from "@/modules/auth/admin";

export type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export type MfaEnrollmentError = { error: "enroll" | "challenge" | "invalid" };

export async function startTotpEnrollment(): Promise<TotpEnrollment | MfaEnrollmentError> {
  const { supabase } = await requireActiveAdmin();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const unverifiedFactors = factors?.all.filter(
    (factor) => factor.factor_type === "totp" && factor.status === "unverified",
  ) ?? [];
  await Promise.all(unverifiedFactors.map((factor) => supabase.auth.mfa.unenroll({ factorId: factor.id })));
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: ui.adminMfa.factorName,
    issuer: ui.adminMfa.factorName,
  });
  if (error || !data.totp) return { error: "enroll" };
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyTotpEnrollment(
  _: MfaEnrollmentError | null,
  formData: FormData,
): Promise<MfaEnrollmentError | null> {
  const { supabase } = await requireActiveAdmin();
  const factorId = String(formData.get("factorId") ?? "");
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.all.find(
    (item) => item.id === factorId && item.factor_type === "totp" && item.status === "unverified",
  );
  if (!factor) redirect("/admin/mfa/enroll?error=challenge");
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) return { error: "challenge" };
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: String(formData.get("code") ?? ""),
  });
  if (error) return { error: "invalid" };
  redirect("/admin");
}

export async function verifyTotp(formData: FormData) {
  const { supabase } = await requireActiveAdmin();
  const { data } = await supabase.auth.mfa.listFactors();
  const factorId = data?.totp.find(
    (factor) => factor.status === "verified"
  )?.id;
  if (!factorId) redirect("/admin/mfa/enroll");
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
