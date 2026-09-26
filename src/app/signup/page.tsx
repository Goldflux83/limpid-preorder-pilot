import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const stations = await getStations();
  return (
    <PilotShell>
      <main className="page">
        <p className="eyebrow">{ui.signup.eyebrow}</p>
        <h1>{ui.signup.title}</h1>
        <p>{ui.signup.intro}</p>
        <form className="form">
          <label>
            {ui.signup.email}
            <input name="email" type="email" required />
          </label>
          <label>
            {ui.signup.station}
            <select name="station" defaultValue={s?.toUpperCase()}>
              {stations.map((station) => (
                <option value={station.code} key={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </label>
          {!stations.length && <p>{ui.catalog.noStations}</p>}
          <label>
            {ui.signup.frequency}
            <select name="frequency">
              {ui.signup.frequencies.map((frequency) => (
                <option key={frequency}>{frequency}</option>
              ))}
            </select>
          </label>
          <label>
            {ui.signup.when}
            <textarea name="when" />
          </label>
          <input
            className="honeypot"
            tabIndex={-1}
            aria-hidden="true"
            name="company"
          />
          <label className="check">
            <input type="checkbox" required /> {ui.signup.consent}
          </label>
          <button type="submit">{ui.signup.submit}</button>
        </form>
      </main>
      <Footer />
    </PilotShell>
  );
}
