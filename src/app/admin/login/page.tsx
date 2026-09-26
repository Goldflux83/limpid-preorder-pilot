import { signIn } from "./actions";
import { ui } from "@/config/content";
export default function AdminLoginPage() {
  return (
    <main className="page">
      <p className="eyebrow">{ui.adminLogin.eyebrow}</p>
      <h1>{ui.adminLogin.title}</h1>
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
    </main>
  );
}
