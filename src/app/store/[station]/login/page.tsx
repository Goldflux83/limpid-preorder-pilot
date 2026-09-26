import { openSession } from "./actions";
import { ui } from "@/config/content";
import { AuthPageTemplate } from "@/components/templates/page-template";
export default async function StoreLoginPage({
  params,
}: {
  params: Promise<{ station: string }>;
}) {
  const { station } = await params;
  return (
    <AuthPageTemplate>
      <p className="eyebrow">{ui.storeLogin.eyebrow}</p>
      <h1>{station.toUpperCase()}</h1>
      <form action={openSession}>
        <input type="hidden" name="station" value={station.toUpperCase()} />
        <label>
          {ui.storeLogin.pin}
          <input name="pin" inputMode="numeric" pattern="[0-9]{4}" required />
        </label>
        <button type="submit">{ui.storeLogin.submit}</button>
      </form>
    </AuthPageTemplate>
  );
}
