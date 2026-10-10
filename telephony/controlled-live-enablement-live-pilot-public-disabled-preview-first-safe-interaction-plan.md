# Telephony Boundary — QL-079 Public Disabled Preview First Safe Interaction Plan

QL-079 is not a telephony enablement build.

## Selected preview-only interaction

The selected next interaction is a sample brand switcher in the public disabled preview.

## Telephony remains disabled

The following remain disabled and out of scope:

- provider callbacks;
- live phone webhooks;
- SMS delivery;
- call runtime;
- recordings;
- callback token use;
- live number attachment;
- provider delivery;
- real phone numbers;
- real message bodies;
- transcripts;
- live pilot runtime.

## Backend remains disabled

The selected interaction must not use Supabase runtime, persistence writes, archive writes, retention writes, or live customer access.

## Next build constraint

QL-080 may implement the sample brand switcher only if it remains synthetic-data-only and browser-local-state-only.
