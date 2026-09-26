import { verifyTotp } from "./actions";
import { ui } from "@/config/content";
export default function AdminMfaPage() {
  return (
    <main className="page">
      <p className="eyebrow">{ui.adminMfa.eyebrow}</p>
      <h1>{ui.adminMfa.title}</h1>
      <form action={verifyTotp}>
        <label>
          {ui.adminMfa.code}
          <input name="code" inputMode="numeric" required />
        </label>
        <button type="submit">{ui.adminMfa.submit}</button>
      </form>
    </main>
  );
}
