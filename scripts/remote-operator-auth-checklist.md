# Remote Operator Auth Checklist

Use this when the operator cannot run Bash locally.

## QL-008B manual Supabase steps

1. Open Supabase project `gxujcwpktaickcgzyvnu`.
2. Open SQL Editor.
3. Review `database/migrations/0006_auth_admin_access_policies.sql`.
4. Run it once.
5. Add the owner allowlist row privately with the real owner email.
6. Run policy verification queries from `docs/21_AUTH_SAFE_ADMIN_ACCESS_DECISION.md`.
7. Do not paste secrets into chat.
8. Paste only non-secret verification summaries.

## Do not do yet

- Do not connect frontend live reads/writes.
- Do not add anonymous policies.
- Do not add customer login.
- Do not enable phone/SMS webhooks.
- Do not enable AI sending.
