import { Footer, PilotShell } from "@/components/pilot-shell";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
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
        <PageHeader eyebrow={ui.signup.eyebrow} title={ui.signup.title} intro={ui.signup.intro} />
        <form className="form">
          <FormField label={ui.signup.email}>
            <input name="email" type="email" required />
          </FormField>
          <FormField label={ui.signup.station}>
            <select name="station" defaultValue={s?.toUpperCase()}>
              {stations.map((station) => (
                <option value={station.code} key={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </FormField>
          {!stations.length && <EmptyState>{ui.catalog.noStations}</EmptyState>}
          <FormField label={ui.signup.frequency}>
            <select name="frequency">
              {ui.signup.frequencies.map((frequency) => (
                <option key={frequency}>{frequency}</option>
              ))}
            </select>
          </FormField>
          <FormField label={ui.signup.when}>
            <textarea name="when" />
          </FormField>
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
