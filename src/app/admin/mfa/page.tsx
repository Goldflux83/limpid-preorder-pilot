import { verifyTotp } from "./actions";
import { ui } from "@/config/content";
import { AuthPageTemplate } from "@/components/templates/page-template";
export default function AdminMfaPage() {
  return (
    <AuthPageTemplate>
      <p className="eyebrow">{ui.adminMfa.eyebrow}</p>
      <h1>{ui.adminMfa.title}</h1>
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
