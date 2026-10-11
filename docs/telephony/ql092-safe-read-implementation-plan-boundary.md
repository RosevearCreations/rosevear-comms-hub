# QL-092 telephony boundary

QL-092 does not enable telephony.

## Still disabled

- Live inbound phone webhooks
- Live outbound calls
- Call recording
- SMS/MMS send or receive runtime
- Provider callback registration
- Provider account connection
- Live number attachment
- STOP/START/HELP consent processing runtime
- AI auto-send
- Archive and retention writes

## Safe-read boundary

The QL-092 safe-read plan is limited to synthetic public Supabase views for the disabled browser preview. It must not read phone numbers, call records, SMS messages, provider payloads, consent ledgers, recordings, or live communication histories.

## Next build guardrail

Any future implementation must keep telephony actions visually locked and must hydrate only display-only synthetic rows after validation.
