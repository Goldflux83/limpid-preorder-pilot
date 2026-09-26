import { openSession } from "./actions";
import { ui } from "@/config/content";
export default async function StoreLoginPage({
  params,
}: {
  params: Promise<{ station: string }>;
}) {
  const { station } = await params;
  return (
    <main className="page">
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
    </main>
  );
}
