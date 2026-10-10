# QL-087 — Public Disabled Preview Synthetic Conversation Detail Tabs Review

## Purpose

QL-087 reviews the QL-086 browser-local detail tabs and adds practical Cloudflare/Supabase readiness so rosevear-comms-hub can begin safe application testing instead of only static theory.

## Review result

The Overview, Draft, Timeline, and Safety tabs remain understandable, visually clear, and browser-local. The tab state is React state only and the selected content remains synthetic.

## Cloudflare readiness

Cloudflare account: `jfrosevear@gmail.com`

Connected Worker target: `https://rosevear-comms-hub.jfrosevear.workers.dev/`

Repository requirements added:

- `package.json` at the repo root.
- `wrangler.jsonc` at the repo root.
- Worker static assets directory: `./app/dist`.
- SPA fallback: `single-page-application`.

After QL-087 is promoted, Cloudflare can build the app with `npm run build` and deploy with `npx wrangler deploy` or `npm run deploy`.

## Supabase readiness

Supabase project: `rosevearcreations`

Project URL: `https://gxujcwpktaickcgzyvnu.supabase.co`

Repository requirements added:

- `supabase/config.toml`.
- `supabase/migrations/20261010154500_ql087_app_foundation.sql`.
- `supabase/functions/ql-status/index.ts`.

The migration creates read-only synthetic testing tables with RLS. It does not enable live Phone/SMS runtime, provider callbacks, recordings, archive writes, retention writes, or live pilot runtime.

## Supabase dashboard settings after promotion

In Supabase → Settings → Integrations → GitHub:

- Repository: `RosevearCreations/rosevear-comms-hub`.
- Working directory: `.`.
- Production branch: `main`.
- Then click **Enable integration**.

Supabase requires the working directory to be the path containing the `supabase/` folder, so `.` is correct once this build lands on `main`.

## Safety boundary

Still disabled:

- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Recordings.
- AI auto-send.
- Live customer records.
- Archive writes.
- Retention writes.
- Live pilot runtime.

## Next queued build

QL-088 — Cloudflare and Supabase Live Readiness Review.
