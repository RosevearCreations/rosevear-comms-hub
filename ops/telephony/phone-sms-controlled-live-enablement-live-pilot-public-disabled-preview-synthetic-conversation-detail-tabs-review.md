# QL-087 Ops Checklist — Detail Tabs Review + Cloudflare/Supabase Readiness

## Cloudflare

- Worker name: `rosevear-comms-hub`.
- Worker URL: `https://rosevear-comms-hub.jfrosevear.workers.dev/`.
- Repo config: `wrangler.jsonc`.
- Assets directory: `./app/dist`.
- SPA fallback: `single-page-application`.

If Cloudflare still shows no build command after QL-087 lands, set:

```text
npm run build
```

Keep deploy command:

```text
npx wrangler deploy
```

## Supabase

- Project URL: `https://gxujcwpktaickcgzyvnu.supabase.co`.
- GitHub integration working directory: `.`.
- Production branch: `main`.
- Root folder expected by Supabase: `supabase/`.

After QL-087 lands on `main`, it is safe to click **Enable integration**.

## Still blocked

- Provider callbacks.
- SMS sending.
- Calls.
- Recordings.
- Live customer data.
- Archive writes.
- Retention writes.
- Live pilot runtime.
