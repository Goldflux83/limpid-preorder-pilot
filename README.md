# Limpid Preorder Pilot

Mobile-first webapp for pilot preorder drinks and signup waiting list with Next.js on Vercel Frankfurt and Supabase EU Central.

## To start

1. Kopieer `.env.example` naar `.env.local`.
2. Installeer afhankelijkheden met `npm install`.
3. Start met `npm run dev`.

Voor de database in Supabase:
```
npx supabase@2.118.0 init
npx supabase@2.118.0 start
npx supabase@2.118.0 db reset
```

`db reset` voert alle migraties én automatisch `supabase/seed.sql` uit. Daarna toont supabase status de lokale URL en keys. Zet die in .env.local:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<anon/publishable key uit supabase status>
SUPABASE_SECRET_KEY=<service_role/secret key uit supabase status>
```

Maak pas na klantakkoord een afzonderlijk Limpid-productieproject in Frankfurt.

Voor beheer is TOTP-MFA verplicht. Schakel in elk Supabase-project **MFA TOTP enrollment** en **MFA TOTP verification** in. Nieuwe actieve beheerders stellen hun authenticator in via `/admin`; bij toestelverlies verwijdert technisch beheer de MFA-factor in Supabase waarna de beheerder deze opnieuw instelt.

## Privacy en toegang

`participants.id` is de onveranderlijke UUID. Publieke codes staan met historie in `participant_codes`; geen andere tabel koppelt op code. De `events`-tabel is append-only en bevat geen naam of e-mail. Er bestaan standaard geen browser-RLS-policies: serverroutes moeten eerst toegang valideren.

## Deployment

GitHub Actions verifieert pull requests en `main`. Pas daarna wordt dezelfde SHA naar Vercel `tst` gedeployed. De handmatige, door GitHub Environment `prd` beschermde workflow promoot uitsluitend die bestaande Vercel-deployment; productie wordt niet opnieuw gebouwd.

Vercel project bevat twee EU/Frankfurt-omgevingen:
- Vercel Preview als `tst`, gekoppeld aan de Goldflux testdatabase, en
- Vercel Production (`prd`), gekoppeld aan een afzonderlijke Goldflux productiedatabase.

Configureer deze app-variabelen rechtstreeks in beide Vercel-omgevingen:

```dotenv
NEXT_PUBLIC_APP_URL=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_JWT_SIGNING_KEY_ID=
SUPABASE_JWT_SIGNING_PRIVATE_KEY=
STORE_RATE_LIMIT_SALT=
WAITLIST_RATE_LIMIT_SALT=
GOLDFLUX_TELEMETRY_ENDPOINT=
GOLDFLUX_TELEMETRY_TOKEN=
```

`RESEND_API_KEY` en `EMAIL_FROM` blijven afwezig totdat e-mail is goedgekeurd. Configureer in de GitHub Environments `tst` en `prd` uitsluitend `VERCEL_TOKEN`, `VERCEL_ORG_ID` en `VERCEL_PROJECT_ID`; Supabase- en appsecrets horen niet in GitHub. SQL-migraties worden bewust niet door een Vercel-deployment uitgevoerd: pas ze gecontroleerd toe op `tst` en na review op `prd`.

Gebruik daarvoor de handmatige workflow **Apply database migrations**. Voeg in GitHub Environment `tst` en `prd` elk een eigen `SUPABASE_DB_URL` secret toe: gebruik de Session Pooler-connection string uit Supabase Connect, inclusief wachtwoord. Kies `tst` en typ `APPLY_TST` voor de testdatabase, of kies `prd` en typ `APPLY_PRD`; de `prd`-environment houdt de bestaande GitHub approval aan. De workflow voert eerst alle migrations uit en daarna de idempotente `supabase/seed.sql`.

Gebruik de moderne Supabase API-keys: `SUPABASE_PUBLISHABLE_KEY` voor browser/SSR en `SUPABASE_SECRET_KEY` uitsluitend op de server. `SUPABASE_URL` is de project-root (`https://<project-ref>.supabase.co`), niet `/rest/v1`. Realtime voor winkels vereist daarnaast een in Supabase geregistreerde RSA signing key; zet de bijbehorende `kid` en base64-gecodeerde PKCS#8 private key alleen in server-secrets.

Optionele Goldflux operationele telemetry gebruikt uitsluitend `GOLDFLUX_TELEMETRY_ENDPOINT` en `GOLDFLUX_TELEMETRY_TOKEN` als server-secrets. Berichten bevatten alleen technische levenssignalen, actie-uitkomst, omgeving en release; geen pilot- of persoonsgegevens. Verzending is best-effort en blokkeert geen appflow.
