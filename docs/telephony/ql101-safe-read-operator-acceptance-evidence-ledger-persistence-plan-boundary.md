# QL-101 Telephony and Runtime Boundary

QL-101 does not enable telephony.

Blocked runtime remains:

- Phone/SMS provider callbacks
- Live calls
- SMS/MMS sending
- Recordings
- Callback registration
- Consent writes
- Audit/admin/retention writes
- Provider delivery
- AI generation or send
- Live pilot runtime

Any later persistence implementation must preserve these lockouts until a separate reviewed enablement build exists.
