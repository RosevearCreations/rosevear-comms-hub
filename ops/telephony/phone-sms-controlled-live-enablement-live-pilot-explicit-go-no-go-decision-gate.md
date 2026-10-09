# Ops Checklist — QL-059 Explicit Go/No-Go Decision Gate

## Required review

- Confirm QL-050 through QL-058 are complete.
- Confirm owner-reviewed go/no-go evidence is synthetic and redacted.
- Confirm the decision is limited to QL-060 controlled activation planning.
- Confirm website section help is present and includes the manual intervention guide.

## Manual intervention steps before any later activation planning

1. Variables: keep provider credentials, webhook secrets, Supabase service credentials, callback secrets, and phone numbers outside git.
2. Services: verify Supabase, hosting, DNS, GitHub Actions, deployment dashboard, and phone/SMS provider dashboard.
3. Application links: collect redacted links for the production app, provider console, Supabase project, GitHub workflow run, and deployment dashboard.
4. Evidence: retain only synthetic/redacted evidence in source-controlled fixtures.
5. Runtime: do not enable provider callbacks, phone webhooks, SMS send, call recording, AI auto-send, persistence writes, archive writes, retention writes, or live pilot runtime.

## Production closure

Production is GREEN only after the exact `main` commit passes:

- `npm install`
- `npm run check`
- `npm run build`
