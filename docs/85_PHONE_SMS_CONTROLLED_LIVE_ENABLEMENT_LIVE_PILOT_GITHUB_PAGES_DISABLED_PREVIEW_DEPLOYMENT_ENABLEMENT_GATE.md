# QL-072 — GitHub Pages Disabled Preview Deployment Enablement Gate

## Result

QL-072 adds the repository-side enablement gate for the Quo-lite static disabled preview on GitHub Pages.

The planned public review URL remains:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

The Vite base path for the Pages build is:

```text
/rosevear-comms-hub/
```

## What changed

- Added `app` script `pages:build` to build the static preview with the correct GitHub Pages base path.
- Added `.github/workflows/pages-disabled-preview.yml`.
- The workflow is intentionally gated by the repository Actions variable `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true`.
- Updated the visible floating interface preview to QL-072 state.
- Added a typed QL-072 guard and contract fixture.

## Manual setup required before the URL works

1. Open GitHub.
2. Open `RosevearCreations/rosevear-comms-hub`.
3. Open **Settings**.
4. Open **Pages**.
5. Under **Build and deployment**, set **Source** to **GitHub Actions**.
6. Open **Settings → Secrets and variables → Actions → Variables**.
7. Add this variable only when ready to allow the static disabled preview workflow to deploy:
   - `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW = true`
8. Optionally add only these public browser variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Values that must not be added to browser variables

Do not add service-role keys, provider credentials, callback tokens, live phone numbers, live message bodies, transcripts, recordings, or live customer data to browser-visible variables.

## Runtime boundary

QL-072 does not enable provider callbacks, phone webhooks, SMS sending, call runtime, call recording, AI auto-send, persistence writes, live customer reads, live customer writes, archive writes, retention policy writes, provider account connection, live-number attachment, callback registration, Supabase migrations, Supabase Edge Functions, Vercel, Cloudflare Pages, or live pilot runtime.

## Expected behavior

- If `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW` is not set to `true`, the GitHub Pages workflow remains skipped.
- If the variable is set to `true` and GitHub Pages Source is set to GitHub Actions, the workflow can publish the static disabled preview to the public review URL.

## Next queued build

QL-073 — GitHub Pages Disabled Preview Deployment Verification.
