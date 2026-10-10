# QL-087 Telephony Boundary — Detail Tabs Review + Infrastructure Readiness

QL-087 prepares deployment infrastructure without enabling live telephony.

## Allowed

- Static app deployment to GitHub Pages.
- Static app deployment to Cloudflare Worker static assets.
- Supabase synthetic-data migration testing.
- Supabase `ql-status` function reachability testing.

## Blocked

- Provider callback registration.
- Live phone webhooks.
- SMS sending.
- Call placement.
- Call recording.
- AI-generated live replies.
- Live customer data reads/writes.
- Archive writes.
- Retention-policy writes.
- Live pilot runtime.

## Next review

QL-088 should verify Cloudflare and Supabase deployments from their dashboards before any runtime expansion.
