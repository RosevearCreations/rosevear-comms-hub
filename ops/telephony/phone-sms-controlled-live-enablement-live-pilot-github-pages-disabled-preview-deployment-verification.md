# Ops — QL-073 GitHub Pages Disabled Preview Deployment Verification

## Verify after main promotion

1. Confirm App scaffold CI on `main` is green.
2. Confirm the `GitHub Pages Disabled Preview` workflow appeared on the `main` push.
3. If `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW=true`, confirm the workflow deployed static `app/dist` output.
4. If the workflow skipped, confirm the skip was caused by the enablement gate and not a build failure.
5. Confirm the public URL is expected at `https://rosevearcreations.github.io/rosevear-comms-hub/`.
6. Confirm the deployed preview remains static and disabled.

## Blocked runtime paths

- Provider callbacks remain disabled.
- Phone webhooks remain disabled.
- SMS sending remains disabled.
- Call runtime remains disabled.
- Recording remains disabled.
- AI auto-send remains disabled.
- Persistence writes remain disabled.
- Live customer access remains disabled.
- Archive writes remain disabled.
- Retention policy writes remain disabled.
- Live pilot runtime remains disabled.
