# QL-072 Ops Checklist — GitHub Pages Disabled Preview Deployment Enablement Gate

## Operator setup

1. GitHub → `RosevearCreations/rosevear-comms-hub`.
2. Settings → Pages.
3. Build and deployment → Source → GitHub Actions.
4. Settings → Secrets and variables → Actions → Variables.
5. Add `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW = true` only when ready for the static disabled preview workflow to deploy.
6. Optional public variables only:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Do not add

- `SUPABASE_SERVICE_ROLE_KEY`
- Provider API keys or secrets
- Webhook signing secrets
- Callback tokens
- Live phone numbers
- Live customer data
- Message bodies from live customers
- Transcripts or recordings

## Validation

- Confirm app CI remains green.
- Confirm the Pages workflow is skipped when the gate variable is absent.
- Confirm the Pages workflow publishes only `app/dist` if the gate variable is true.
- Confirm all Phone/SMS controls remain disabled in the UI.

## Rollback

Set `ENABLE_GITHUB_PAGES_DISABLED_PREVIEW` to any value other than `true` or delete the variable. The Pages workflow will stop deploying while the app CI remains unaffected.
