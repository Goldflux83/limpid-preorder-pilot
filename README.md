# Limpid Preorder Pilot

Mobiel-eerste pilot voor kaartgebruik, koffie vooruitbestellen en wachtlijstinschrijvingen. De app is voorbereid op Vercel Frankfurt en Supabase EU Central.

## Lokaal starten

1. Kopieer `.env.example` naar `.env.local`.
2. Installeer afhankelijkheden met `npm install`.
3. Start met `npm run dev`.

De demo werkt zonder secrets. Voor productie wordt de migratie in `supabase/migrations` op een afzonderlijk test- en productieproject toegepast; `supabase/seed.sql` geeft AMF/GD en voorbeeldproducten een herhaalbare startpositie.

## Privacy en toegang

`participants.id` is de onveranderlijke UUID. Publieke codes staan met historie in `participant_codes`; geen andere tabel koppelt op code. De `events`-tabel is append-only en bevat geen naam of e-mail. Er bestaan standaard geen browser-RLS-policies: serverroutes moeten eerst toegang valideren.

## Deployment

GitHub Actions verifieert pull requests en `main`. Een handmatig beschermde production-workflow accepteert alleen de eerder geteste commit-SHA. Configureer Vercel- en Supabase-secrets in GitHub Environments voordat deployments worden geactiveerd.
