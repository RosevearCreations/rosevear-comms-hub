# Provider Test Decision

## QL-021 decision

The first phone/SMS provider experiment will use a new test number only.

```text
Selected approach: new_test_number_first
Selected provider: undecided
Port existing numbers: no
Forward existing numbers: no
Enable phone webhooks: no
Enable SMS: no
Enable call recording: no
```

## Why

The hub needs to prove call/SMS workflow handling before any known customer-facing number is placed at risk.

The first useful proof is not provider lock-in. The first useful proof is:

```text
new test number
→ inbound call or SMS event
→ contact/conversation/task evidence
→ human review
→ no auto-send
```

## Candidates

Shortlist:

- VoIP.ms
- Telnyx
- Twilio

Deferred PBX paths:

- FreePBX/Asterisk
- 3CX

## Existing number protection rule

Do not port or forward any existing number until the test number path is proven and reversible.
