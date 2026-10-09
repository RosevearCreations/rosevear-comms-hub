# Remote Operator Checklist — QL-068 Disabled Interface Pathway Decision Gate

## Operator decision

QL-068 is a planning decision gate only.

Select:

- GitHub Pages as a future disabled static interface candidate.
- Supabase Edge Functions as a future backend boundary for secrets and callbacks.

Reject for this phase:

- Vercel hosting.
- Cloudflare Pages hosting.
- Any live phone/SMS runtime.

## Do not perform

Do not:

- create or enable GitHub Pages,
- add a GitHub Pages workflow,
- add Vercel or Cloudflare Pages,
- add Supabase migrations,
- create Supabase Edge Functions,
- add provider secrets to browser variables,
- connect a provider account,
- attach a live number,
- register callback routes,
- enable webhooks,
- send SMS,
- start calls,
- persist evidence,
- read or write live customer data,
- archive data,
- write retention policy,
- start a live pilot.

## Safe manual note for later

When a later build actually implements a disabled interface plan, only the public Supabase URL and anon key may be considered browser variables. Service-role keys and provider secrets must stay server-side only.
