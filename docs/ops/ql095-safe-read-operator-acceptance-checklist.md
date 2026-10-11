# QL-095 Safe Read Operator Acceptance Checklist

Use this checklist for QL-095 review only. It is not a live enablement checklist.

1. Open the public disabled preview Safe Reads panel.
2. Select Rosie Dazzlers and confirm the visible rows remain synthetic/public safe-read rows.
3. Select Devil n Dove and confirm the visible rows remain synthetic/public safe-read rows.
4. Confirm the active source label is understandable: local fallback, validated Supabase synthetic reads, or mixed fallback.
5. Confirm fallback text and rejected-row diagnostics do not expose raw private payloads.
6. Confirm the approved read target list names only `public.ql_public_synthetic_conversations` and `public.ql_public_system_status`.
7. Confirm the blocked runtime list still covers browser writes, acceptance persistence, live reads, Phone/SMS runtime, callbacks, archives, consent/audit/retention writes, AI send/generation, and live pilot runtime.
8. Record operator acceptance outside the preview if the plan is acceptable. Do not treat the preview itself as a sign-off storage system.

QL-095 passes only when the final `main` checks are green and the Cloudflare Workers production check is green.
