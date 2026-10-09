# QL-060 Ops Checklist — Controlled Activation Planning

Use this checklist only for planning review. Do not perform live activation work during QL-060.

## Confirm prerequisites

- [ ] QL-050 through QL-059 remain complete.
- [ ] QL-059 explicit go/no-go decision approved planning only.
- [ ] Evidence remains synthetic and redacted.
- [ ] Evidence remains `safeToPersist: false`.

## Confirm runtime locks

- [ ] Provider webhooks are not configured.
- [ ] Provider callbacks are disabled.
- [ ] Live phone webhooks are disabled.
- [ ] SMS sending is disabled.
- [ ] Call recording is disabled.
- [ ] AI drafts and AI auto-send are disabled.
- [ ] Persistence writes are disabled.
- [ ] Live customer reads and writes are disabled.
- [ ] Dry-run execution is disabled.
- [ ] Provider delivery is disabled.
- [ ] Archive writes are disabled.
- [ ] Retention policy writes are disabled.
- [ ] Provider account connection is disabled.
- [ ] Provider live-number attachment is disabled.
- [ ] Live pilot runtime is disabled.

## Plan later manual intervention

- [ ] Environment variable names are listed for later review.
- [ ] Service links are listed for later review.
- [ ] Application links are listed for later review.
- [ ] Provider account steps are documented without connecting the account.
- [ ] Live-number attachment steps are documented without attaching a number.
- [ ] Callback registration steps are documented without registering callbacks.
- [ ] Rollback and kill-switch owners are documented.
- [ ] Monitoring and alerting owners are documented.
- [ ] Operator checklist owner is documented.

## Production proof

- [ ] Exact branch CI passes `npm install`, `npm run check`, and `npm run build`.
- [ ] Exact `dev` promotion CI passes.
- [ ] Exact `main` push CI passes before declaring Production GREEN.
