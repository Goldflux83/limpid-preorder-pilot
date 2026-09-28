import { signIn } from "./actions";
import { ui } from "@/config/content";
import { AuthPageTemplate } from "@/components/templates/page-template";
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage =
    error === "invalid"
      ? ui.adminLogin.errors.invalid
      : error === "email-not-confirmed"
      ? ui.adminLogin.errors.emailNotConfirmed
      : error === "auth-unavailable"
      ? ui.adminLogin.errors.authUnavailable
      : error === "configuration"
      ? ui.adminLogin.errors.configuration
      : error === "not-authorized"
      ? ui.adminLogin.errors.notAuthorized
      : error === "mfa-not-enrolled"
      ? ui.adminLogin.errors.mfaNotEnrolled
      : error === "mfa-unavailable"
      ? ui.adminLogin.errors.mfaUnavailable
      : null;
  return (
    <AuthPageTemplate>
      <p className="eyebrow">{ui.adminLogin.eyebrow}</p>
      <h1>{ui.adminLogin.title}</h1>
      {errorMessage && (
        <p className="error-message" role="alert">
          {errorMessage}
        </p>
      )}
      <form action={signIn}>
        <label>
          {ui.adminLogin.email}
          <input name="email" type="email" required />
        </label>
        <label>
          {ui.adminLogin.password}
          <input name="password" type="password" required />
        </label>
        <button type="submit">{ui.adminLogin.submit}</button>
      </form>
    </AuthPageTemplate>
  );
}
