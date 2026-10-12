# Telephony Boundary — QL-103

QL-103 does not enable Phone/SMS runtime.

The implementation plan keeps these systems disabled:

- outbound calls
- inbound callback registration
- SMS/MMS send or receive processing
- provider delivery
- call recordings
- archive writes
- consent writes
- audit/admin writes
- retention jobs
- AI generation and send
- live pilot runtime

Future persistence planning must remain separate from telephony activation. Any telephony activation requires its own reviewed build, explicit owner approval, and production checks.
