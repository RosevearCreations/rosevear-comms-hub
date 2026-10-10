# Telephony Boundary — QL-080 First Safe Interaction Implementation

QL-080 implements a public preview interaction, not a telephony runtime interaction.

## Implemented

- Browser-local sample brand switcher.
- Synthetic preview content for Rosie Dazzlers and Devil n Dove.
- Public GitHub Pages disabled preview remains active.

## Not implemented

- Provider callbacks
- Live phone webhooks
- SMS sending
- Call runtime
- Call recording
- Provider delivery
- Callback registration
- Provider account connection
- Live number attachment
- AI send
- Persistence writes
- Live customer reads or writes
- Archive writes
- Retention writes
- Supabase runtime reads or writes
- Supabase migrations
- Supabase Edge Functions
- Live pilot runtime

## Telephony status

Telephony remains disabled. The brand switcher must never imply that a live number, provider, SMS path, call path, callback route, archive path, retention path, or live pilot path is available.
