# QL-073 — GitHub Pages Disabled Preview Deployment Verification

QL-073 verifies the static GitHub Pages disabled preview deployment path after QL-072 added the gated workflow.

## Target public review URL

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

## Verification decision

QL-073 is a verification build only. It does not enable Phone/SMS runtime, providers, callbacks, persistence writes, archive writes, retention writes, AI sends, or live pilot behavior.

The GitHub Pages workflow has three acceptable verification outcomes:

1. `deployed` — the workflow ran because `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true` and GitHub Pages Source is set to GitHub Actions.
2. `skipped_by_gate` — the workflow safely skipped because the enablement variable is absent or not `true`.
3. `pending_external_setting` — the repository still needs manual Pages/variable setup before the URL can work.

## Required checks

- Main app CI must pass `npm install`, `npm run check`, and `npm run build`.
- The Pages workflow must be observed on the main push.
- The Pages workflow must respect the `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW` gate.
- The static build must use Vite base path `/rosevear-comms-hub/`.
- Browser output must remain static review assets only.
- Browser output must not expose service-role keys, provider credentials, callback tokens, live phone numbers, live message bodies, transcripts, recordings, or live customer data.

## Runtime locks

The following remain disabled:

- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Call recording.
- AI auto-send.
- Persistence writes.
- Live customer reads and writes.
- Dry-run execution.
- Provider delivery.
- Archive writes.
- Retention policy writes.
- Provider account connection.
- Provider live-number attachment.
- Callback registration.
- Live pilot runtime.

## Next path

If the Pages workflow deploys successfully, the next build should perform an operator visual review of the public static disabled preview.

If the Pages workflow skips, the next manual step remains:

1. GitHub repository Settings → Pages → Source: GitHub Actions.
2. Settings → Secrets and variables → Actions → Variables.
3. Add or correct `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true`.
4. Re-run the Pages workflow or run the next verification build.
