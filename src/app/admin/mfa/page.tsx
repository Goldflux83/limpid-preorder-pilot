import { verifyTotp } from "./actions";
import { ui } from "@/config/content";
import { AuthPageTemplate } from "@/components/templates/page-template";
import { requireActiveAdmin } from "@/modules/auth/admin";
import { redirect } from "next/navigation";
export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { supabase } = await requireActiveAdmin();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (!factors?.totp.some((factor) => factor.status === "verified")) redirect("/admin/mfa/enroll");
  const { error } = await searchParams;
  const errorMessage =
    error === "challenge"
      ? ui.adminMfa.errors.challenge
      : error === "invalid"
      ? ui.adminMfa.errors.invalid
      : null;
  return (
    <AuthPageTemplate>
      <p className="eyebrow">{ui.adminMfa.eyebrow}</p>
      <h1>{ui.adminMfa.title}</h1>
      {errorMessage && (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      )}
      <form action={verifyTotp}>
        <label>
          {ui.adminMfa.code}
          <input name="code" inputMode="numeric" required />
        </label>
        <button type="submit">{ui.adminMfa.submit}</button>
      </form>
    </AuthPageTemplate>
  );
}
