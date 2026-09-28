import { redirect } from "next/navigation";
import { AuthPageTemplate } from "@/components/templates/page-template";
import { ui } from "@/config/content";
import { requireActiveAdmin } from "@/modules/auth/admin";
import { MfaEnrollmentForm } from "./enrollment-form";

export default async function AdminMfaEnrollmentPage() {
  const { supabase } = await requireActiveAdmin();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp.some((factor) => factor.status === "verified")) redirect("/admin/mfa");
  return <AuthPageTemplate>
    <p className="eyebrow">{ui.adminMfa.eyebrow}</p>
    <h1>{ui.adminMfa.enrollmentTitle}</h1>
    <p>{ui.adminMfa.enrollmentIntro}</p>
    <MfaEnrollmentForm />
  </AuthPageTemplate>;
}
