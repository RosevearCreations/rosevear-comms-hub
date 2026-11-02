# QL-311 — Unified Command Navigation & Optional Supabase Configuration Help

## What changed in the disabled preview

- The left navigation now has **Front End / Operator, Admin, I.T. / Connections, Management, Statistical, System Status** and a collapsed **Advanced / Historical** section. Every existing workspace is still available exactly once; search searches all sections, including history.
- Navigation groups have coloured identifiers and descriptive help; company choice remains scoped to Rosie Dazzlers, Devil n Dove, Yard Workers or iCamp. AI Data Platform and Rosevear AI Hub are supporting integrations, **not customer tenants**.
- A breadcrumb returns to Command home. The contextual **ⓘ About this area** help links to home, I.T. or Status without granting additional roles. These are real navigation actions, not illustration-only controls.
- Release remains a **disabled, synthetic-only preview**. Six integrations are `DISCONNECTED / HOLD`, phone/SMS/dispatch remain OFF and ACK delivery evidence stays `UNDER_REVIEW / PARKED_FOR_LATER`.

## Why these four messages appear

The optional **admin-login** screen reports the following if its build environment is intentionally incomplete:

| Configuration notice | Meaning | Required for public six-app proof handoff? |
| --- | --- | --- |
| `VITE_ENABLE_SUPABASE_CLIENT is not true.` | The admin Supabase browser client is switched off. | **No. Leave false.** |
| `VITE_ENABLE_HOSTED_DATABASE is not true.` | Hosted admin database mode is switched off. | **No. Leave false.** |
| `VITE_SUPABASE_URL is missing.` | No public project URL was compiled into the current browser build. | **No. May remain absent.** |
| `VITE_SUPABASE_PUBLISHABLE_KEY is missing.` | No browser-safe publishable key was compiled into the build. | **No. May remain absent.** |

**These notices are not four integration errors.** They describe a separate optional Supabase admin-login/reference-read capability in `app/src/supabase/client.ts`. They do not prevent reading six public source URLs or preparing nonsecret handoff cases. Do **not** add a key simply to remove the notices.

## Where and how to put the settings — only for a separately approved login task

1. **Local development on our computer:** In the cloned repository, open the `app` folder (the directory containing `vite.config.ts` and `package.json`). Create `app/.env.local` if it does not exist. For the existing disabled preview, these are safe defaults:

   ```dotenv
   VITE_ENABLE_SUPABASE_CLIENT=false
   VITE_ENABLE_HOSTED_DATABASE=false
   VITE_SUPABASE_URL=
   VITE_SUPABASE_PUBLISHABLE_KEY=
   ```

   Run or restart the Vite development server after editing; do not commit `.env.local`. The repository's root `.env.example` is an example, **not proof of values active in Cloudflare**.

2. **Cloudflare production (when explicitly approved):** Cloudflare Dashboard → **Workers & Pages → rosevear-comms-hub → Settings → Builds → Build variables and secrets**. Enter each `VITE_...` *name* and its separately approved browser-safe value, then trigger a new build. **Do not use the Worker Settings → Variables and secrets runtime page** on this static-assets deployment; runtime bindings and build-time values are different. The production preview currently needs no new Supabase variable.

3. **GitHub Actions / GitHub Pages preview (separate build):** GitHub → **RosevearCreations/rosevear-comms-hub → Settings → Secrets and variables → Actions → Variables**. Add the corresponding *public build-time* variable only when that preview workflow needs it. A GitHub Actions variable does **not** automatically appear in Cloudflare Builds.

4. **Where a future publishable key comes from:** Supabase Dashboard → select our project → **Project Settings → API Keys**. Copy the **Publishable key** (often beginning `sb_publishable_`) only after separately approving browser login. The known public project URL in the repository is `https://gxujcwpktaickcgzyvnu.supabase.co`; verify the project in the dashboard before using it. **Never** use the Supabase secret/service-role key, private Ed25519 source signing key, HMAC key, password, personal data or database URL in `VITE_` variables. Vite puts those values into public browser bundles.

5. **Do not turn the two flags on here.** Enabling a real admin client requires a separate owner-approved scope and review of auth, `app_admins`, RLS, allowed read model and deployment; it is **not part of QL-311**. The legacy `VITE_SUPABASE_ANON_KEY` and `VITE_QL_ENABLE_SUPABASE_READS` govern a different older synthetic-safe-read scaffold; do not confuse them with the current `PUBLISHABLE_KEY` admin setting or activate them by inference.

**If we are only doing six-app public proof handoff, the correct action is to leave all four settings as they are.** The visible help panel explains this and provides these steps when requested.

## Source references

- [Existing app-side configuration and exact four notices](../app/src/supabase/client.ts)
- [Existing QL-257 platform-specific variable placement decision](ROSEVEAR_QL257_SIX_RESPONSE_VARIABLE_PLACEMENT_OWNER_ACTIONS.md)
- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [GitHub Actions variables](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Vite environment variables and public `VITE_` exposure](https://vite.dev/guide/env-and-mode)
