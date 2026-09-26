<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Content and data boundaries

- Keep all user-visible copy, labels, messages, and accessible text in `src/config/content.ts`; route and UI components must reference that configuration and must not contain literal user-facing text.
- Keep operational data (stations, products, opening hours, participant records, orders, and settings) in Supabase. SQL migrations and seed files define the initial database state; never duplicate that data in the frontend content configuration.
- Keep developer-only infrastructure and secrets in environment variables. Do not put functional pilot settings in `NEXT_PUBLIC_*` variables.
