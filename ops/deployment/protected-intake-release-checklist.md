# Protected Intake Release Checklist

Use this checklist before enabling real website intake.

## Repository

- [ ] `main` contains QL-015 readiness docs.
- [ ] Runtime wrapper exists for the selected deployment target.
- [ ] Endpoint remains disabled until final review.

## Environment

- [ ] `ENABLE_PROTECTED_INTAKE_ENDPOINT=false` by default.
- [ ] `ENABLE_INTAKE_PERSISTENCE=false` by default.
- [ ] `ALLOWED_INTAKE_ORIGINS` includes only approved live domains and named previews.
- [ ] `INTAKE_SHARED_SECRET` is server-side only.
- [ ] No server secrets use the `VITE_` prefix.

## Security

- [ ] No anonymous Supabase table write policy is added.
- [ ] Public websites cannot write directly to Supabase app tables.
- [ ] Origin checks are verified.
- [ ] Shared secret checks are verified.
- [ ] Rate limiting or abuse controls are present.
- [ ] Idempotency / duplicate-submission controls are present.

## Functional dry run

- [ ] RosieDazzlers quote payload validates.
- [ ] DevilnDove custom-order payload validates.
- [ ] Invalid brand is rejected.
- [ ] Invalid intake type is rejected.
- [ ] Missing email/phone is rejected.
- [ ] Missing secret is rejected.
- [ ] Unexpected origin is rejected.
- [ ] Dry-run response contains no secrets.

## Operational

- [ ] Logs avoid secret values.
- [ ] Logs avoid unnecessary customer private details.
- [ ] Admin review remains required before any reply.
- [ ] Rollback plan is documented.
