# QL-090 — Public Disabled Preview Browser-Safe Supabase Read-Only Client Scaffold

Status: in promotion.

## Scope

QL-090 adds the first guarded browser-safe Supabase read-only client scaffold for the public disabled preview.

## Implementation

- Added browser-safe Supabase read-only client wrapper.
- Added explicit env gate requiring the expected Supabase URL, anon key, and `VITE_QL_ENABLE_SUPABASE_READS=true`.
- Added public synthetic-only views for read-only browser access.
- Updated public disabled preview copy to show scaffold status and safety boundaries.
- Added guard, contract fixture, source doc, ops checklist, remote-operator note, and telephony boundary note.

## Verification target

- App scaffold CI install/check/build.
- Supabase Preview success.
- GitHub Pages disabled preview build/deploy success.
- Cloudflare Worker build success.

## Safety boundary

No writes, live customer reads, provider payload reads, phone/SMS runtime, archives, retention writes, AI sending, or live pilot runtime are enabled.
