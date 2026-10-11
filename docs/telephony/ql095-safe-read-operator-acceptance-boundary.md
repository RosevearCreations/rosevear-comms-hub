# Telephony Boundary — QL-095 Safe Read Operator Acceptance Plan

QL-095 does not enable telephony.

## Still blocked

- inbound or outbound live calls;
- SMS/MMS sending;
- provider callbacks;
- DTMF handling;
- recordings;
- transcript or archive writes;
- consent, audit, admin, or retention writes;
- live pilot runtime;
- AI generation or AI send;
- customer/contact/provider payload reads.

## Allowed

The disabled preview may display operator acceptance prompts derived from QL-094 evidence. These prompts reference only synthetic/public read targets, counts, labels, fallback text, bounded rejected-row reasons, and lockout statements.

Any future telephony work must be planned in a separate build after operator acceptance review is complete.
