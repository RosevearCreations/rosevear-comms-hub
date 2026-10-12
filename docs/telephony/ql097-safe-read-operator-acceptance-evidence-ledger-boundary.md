# Telephony Boundary — QL-097 Evidence Ledger Plan

QL-097 does not change telephony status.

Still blocked:

- inbound calls;
- outbound calls;
- SMS/MMS send and receive runtime;
- provider callbacks;
- DTMF handling;
- recordings and transcripts;
- archive writes;
- consent, audit, admin, and retention writes;
- AI generation, AI send, and provider delivery;
- live customer/contact/provider reads;
- live pilot runtime.

The evidence ledger plan may reference telephony lockout categories only as bounded proof text. It must not store call metadata, SMS/MMS content, recordings, provider callback payloads, or delivery receipts.
