# QL-087 Cloudflare new-account redeploy handoff

Status: redeploy trigger only.

Target Cloudflare account confirmed by the operator: `devilndovelive@gmail.com`.

Purpose:
- Re-run the QL-087 Cloudflare Worker static-assets deployment through the newly connected Cloudflare account/project.
- Keep the application code unchanged from the last GREEN QL-087 production commit.
- Trigger a fresh `main` push so the new Cloudflare GitHub connection can build and deploy the Worker.

Expected GitHub-side evidence:
- App scaffold CI remains green.
- Cloudflare Workers build check appears on the final `main` commit.
- Worker deployment uses the existing root `package.json` postinstall fallback, `wrangler.jsonc`, and `app/dist` static assets configuration.

Safety boundary:
- No live Phone/SMS runtime is enabled.
- No provider callbacks are enabled.
- No live customer access, archive writes, retention writes, or live pilot runtime is enabled.
- Supabase remains scaffold/test-only.
