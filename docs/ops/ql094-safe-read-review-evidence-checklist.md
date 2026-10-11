# QL-094 Ops Checklist — Safe Read Review and Evidence

## Pre-promotion checks

- Confirm `app/src/operator/ql094SafeReadReviewEvidence.ts` imports only the QL-093 safe-read result type.
- Confirm the existing QL-093 loader remains the only browser safe-read execution path.
- Confirm approved read targets remain limited to `public.ql_public_synthetic_conversations` and `public.ql_public_system_status`.
- Confirm QL-094 does not create browser writes, storage uploads, RPC mutations, provider sends, callbacks, live phone/SMS runtime, AI send, archives, or retention writes.
- Confirm evidence is limited to bounded counts, source labels, fallback text, approved target names, and lockout statements.

## Promotion evidence

- App CI should pass.
- Supabase Preview should pass.
- GitHub Pages disabled preview should pass when posted.
- `Workers Builds: rosevear-comms-hub` should pass on final `main`.

## Manual rollback note

If the public disabled preview ever shows unexpected live/private data, disable `VITE_QL_ENABLE_SUPABASE_READS`, redeploy, and keep the local fallback preview active while the source is reviewed.
