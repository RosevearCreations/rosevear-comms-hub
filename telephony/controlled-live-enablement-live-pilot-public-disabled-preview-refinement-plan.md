# QL-077 Telephony Boundary — Public Disabled Preview Refinement Plan

QL-077 does not change the live telephony boundary.

## Public preview state

The GitHub Pages disabled preview is the current public review surface:

```text
https://rosevearcreations.github.io/rosevear-comms-hub/
```

The preview remains static and disabled.

## Telephony runtime status

The following remain disabled:

- Provider account connection.
- Live-number attachment.
- Callback registration.
- Provider callbacks.
- Live phone webhooks.
- SMS sending.
- Call runtime.
- Recording and transcripts.
- AI send.
- Persistence writes.
- Live customer reads and writes.
- Archive writes.
- Retention policy writes.
- Live pilot runtime.

## QL-077 approved direction

QL-077 may plan visible refinements for the public disabled preview only:

- Clearer locked-control labels.
- Clearer disabled-state explanations.
- More obvious public-preview safety messaging.
- Help notes that explain what proof is required before Phone/SMS runtime can ever be enabled.
- A future browser-safe synthetic-only interaction.

## Next boundary

Any future interactive work must remain local/synthetic until a later explicit build proves a safe backend boundary.
