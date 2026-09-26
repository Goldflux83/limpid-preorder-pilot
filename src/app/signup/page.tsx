import { PublicPageTemplate } from "@/components/templates/page-template";
import { ui } from "@/config/content";
import { getStations } from "@/modules/catalog/server";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { submitSignup } from "./actions";
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; p?: string; status?: "duplicate" | "invalid" | "rate_limited" }>;
}) {
  const { s, p, status } = await searchParams;
  const stations = await getStations();
  return (
    <PublicPageTemplate>
        <PageHeader eyebrow={ui.signup.eyebrow} title={ui.signup.title} intro={ui.signup.intro} />
        <form className="form" action={submitSignup}>
          {status && <p className="hint">{ui.signup.messages[status]}</p>}
          <input type="hidden" name="poster" value={p ?? ""} />
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
          <FormField label={ui.signup.price}>
            <select name="price">{ui.signup.priceOptions.map((option) => <option key={option}>{option}</option>)}</select>
          </FormField>
          <FormField label={ui.signup.priceOther}><input name="priceOther" /></FormField>
          <fieldset><legend>{ui.signup.formats}</legend>{ui.signup.formatOptions.map((option) => <label className="check" key={option}><input type="checkbox" name="formats" value={option} /> {option}</label>)}</fieldset>
          <fieldset><legend>{ui.signup.trial}</legend><label className="check"><input type="radio" name="wantsToJoin" value="yes" required /> {ui.signup.yes}</label><label className="check"><input type="radio" name="wantsToJoin" value="no" required /> {ui.signup.no}</label></fieldset>
          <input
            className="honeypot"
            tabIndex={-1}
            aria-hidden="true"
            name="company"
          />
          <label className="check">
            <input type="checkbox" name="consent" value="yes" required /> {ui.signup.consent}
          </label>
          <button type="submit">{ui.signup.submit}</button>
        </form>
    </PublicPageTemplate>
  );
}
