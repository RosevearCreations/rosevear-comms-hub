# QL-088 Telephony Boundary — Cloudflare and Supabase Readiness Review

QL-088 is not a live telephony build.

## Allowed

- Review Cloudflare Worker deployment checks.
- Review Supabase GitHub integration readiness.
- Review synthetic preview copy and disabled controls.
- Plan a future browser-safe Supabase read-only client path.

## Not allowed

- SMS sending.
- Outbound calls.
- Inbound call handling.
- Provider callback registration.
- Live customer lookup.
- Provider account connection.
- Phone number attachment.
- Call recording.
- Transcript archive writes.
- Retention writes.
- AI-generated live replies.
- Live pilot runtime.

QL-088 must remain safe even when Cloudflare and Supabase infrastructure checks are green.
