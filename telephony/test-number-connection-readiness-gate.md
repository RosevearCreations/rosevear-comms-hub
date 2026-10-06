# Test Number Connection Readiness Gate

Build: QL-026

The first phone/SMS path remains provider-neutral and disabled by default.

```text
new test number
→ disabled/dry-run connection plan
→ inbound event review
→ contact/conversation/task evidence
→ human review
→ no auto-send
```

## Provider candidates

- VoIP.ms
- Telnyx
- Twilio

## QL-026 boundary

QL-026 only reviews readiness for a later disabled/dry-run connection plan. It does not connect a provider or enable callbacks.

## Required safety posture

- Actual purchased number stored outside the repository.
- Credentials and webhook secrets stored outside the repository.
- Webhooks disabled.
- SMS sending disabled.
- Call recording disabled.
- AI drafts disabled.
- AI auto-send disabled.
- Existing numbers protected.

## Later work

QL-027 may draft the disabled/dry-run connection plan, still without enabling live phone/SMS behavior.
