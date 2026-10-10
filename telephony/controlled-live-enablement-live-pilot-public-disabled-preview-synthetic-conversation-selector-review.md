# Telephony Boundary — QL-084

## Scope

QL-084 reviews the public disabled preview synthetic conversation selector.

## Telephony state

Telephony remains disabled.

The selector does not use:

- Phone provider calls
- SMS provider messages
- Callback URLs
- Webhooks
- DTMF
- Recordings
- Transcripts
- Live numbers
- Live customer records
- Provider account connections

## Selector behavior

The selector uses only hard-coded sample conversations and browser-local React state.

Selecting a sample changes only:

- Synthetic summary text
- Draft-only sample copy
- Synthetic timeline text
- Review labels

## Explicitly blocked

- SMS send
- Outbound call
- Inbound call handling
- Phone/SMS webhook receipt
- Callback registration
- Recording playback
- Transcript processing
- AI reply generation for live outbound use
- Archive or retention writes
- Supabase runtime reads/writes
- Live pilot activation

## Next boundary

QL-085 may plan browser-local synthetic conversation detail tabs only. It must not enable telephony runtime.
