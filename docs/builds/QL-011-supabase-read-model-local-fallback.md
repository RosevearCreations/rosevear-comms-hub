# QL-011 — Supabase Read Model and Local Fallback

## Status

Complete.

## Scope

- Add safe Supabase reference-read model.
- Keep app local-first by default.
- Load only `brands` and the signed-in admin profile after verified login.
- Keep customer-data reads and writes disabled.
- Document exact setup details for the remote operator.

## Files changed

```text
app/src/supabase/readModel.ts
app/src/auth/AdminSessionGate.tsx
README.md
docs/08_BUILD_SEQUENCE.md
docs/24_SUPABASE_READ_MODEL_LOCAL_FALLBACK.md
docs/builds/QL-011-supabase-read-model-local-fallback.md
scripts/remote-operator-supabase-read-model-checklist.md
```

## Green criteria

- App still runs local-only when Supabase flags are missing or false.
- Admin gate can still verify owner/admin login when Supabase is configured.
- Reference read model reads only `brands` and self/admin allowlist status.
- No live customer-data reads are implemented.
- No live customer-data writes are implemented.
- Repo name and setup URLs are clearly documented.
- No secrets are committed.

## Next build

QL-012 — Website Intake Integration Draft.
