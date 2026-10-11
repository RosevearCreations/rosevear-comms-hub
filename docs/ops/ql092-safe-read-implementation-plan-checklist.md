# QL-092 ops checklist

Use this checklist before promoting QL-092.

## Code checks

- `app/src/operator/ql092SafeReadImplementationPlan.ts` compiles without importing live runtime code.
- QL-092 remains plan-only and does not call `loadSyntheticConversationRows` or `loadSyntheticSystemStatusRows` from the UI.
- Existing QL-090 env/project/read-enable gates are unchanged.
- Allowed sources remain limited to synthetic public views.
- Blocked sources still exclude live contacts, conversations, messages, calls, SMS, provider payloads, consent logs, app admins, audits, archives, and retention records.

## Validation checks for the next build

- Conversation rows require validated display-only strings before hydration.
- System status rows require `ready`, `blocked`, or `planned` status before hydration.
- Unknown brands, unknown samples, unexpected shapes, and oversized strings fall back locally.
- Remote read errors surface as display-only fallback reasons.
- Browser state remains non-mutating and non-persistent.

## Promotion checks

- Feature PR app-build passes install, check, and build.
- `dev` promotion app-build passes install, check, and build.
- Final `main` App scaffold CI is green.
- Final `main` Supabase Preview is green.
- Final `main` GitHub Pages disabled-preview checks are green when they post.
- Final `main` Cloudflare Worker build is green.

## Runtime lockouts

- No live Phone/SMS runtime.
- No provider callback runtime.
- No live customer reads or writes.
- No archive or retention writes.
- No AI send.
- No live pilot runtime.
