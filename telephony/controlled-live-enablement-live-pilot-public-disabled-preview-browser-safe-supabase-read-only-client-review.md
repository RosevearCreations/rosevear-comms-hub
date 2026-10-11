# Telephony Boundary — QL-091 Browser-Safe Supabase Read-Only Client Review

QL-091 does not enable telephony.

## Allowed in QL-091

- Review the browser-safe Supabase read-only client scaffold.
- Keep synthetic local fallback samples.
- Confirm allowed read-only sources are synthetic public views only.
- Confirm expected project and read-enable gates remain required.

## Not allowed in QL-091

- Phone calls
- SMS or MMS sending
- Provider webhooks
- Callback registration
- Live customer reads
- Provider payload reads
- Archive writes
- Retention writes
- AI send
- Live pilot runtime

## Boundary outcome

The QL-091 review confirms the application can continue toward safe read planning only. It does not authorize live communication or live customer data use.
