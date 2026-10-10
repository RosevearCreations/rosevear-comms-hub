# Telephony Boundary — QL-090 Browser-Safe Supabase Read-Only Client Scaffold

QL-090 is not a telephony enablement build.

## Allowed

- Browser-safe read-only Supabase scaffold.
- Public synthetic read-only views.
- Local synthetic fallback samples.
- Visible preview status for env/readiness gates.

## Blocked

- Phone provider callbacks.
- SMS provider callbacks.
- Outbound SMS.
- Outbound calls.
- Call recordings.
- Voicemail transcription.
- Live customer records.
- Provider payload records.
- Archive writes.
- Retention writes.
- AI-generated send paths.
- Live pilot runtime.

## Next safe step

QL-091 should review the QL-090 scaffold before any expansion beyond synthetic public reads.
