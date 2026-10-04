# Phone/SMS Test Number Purchase Review Gate

## Build

QL-024 — Phone/SMS Test Number Purchase Review Gate.

## Operator checklist

Before any manual purchase, confirm:

```text
[ ] QL-023 evidence is complete and non-secret.
[ ] Provider is chosen: VoIP.ms, Telnyx, or Twilio.
[ ] Target use is chosen: RosieDazzlers, DevilnDove, or shared hub testing.
[ ] CAD monthly/pay-as-you-go budget is approved.
[ ] Provider account exists outside the repository.
[ ] Account reference label contains no secrets and no phone number.
[ ] Credential storage location is known without recording credential values.
[ ] Provider portal purchase screen was reviewed.
[ ] Canadian test-number availability was reviewed.
[ ] SMS/compliance requirements were reviewed.
[ ] Candidate number is recorded only by region/type label, not by actual number.
[ ] Expected capability is confirmed.
[ ] Estimated monthly CAD cost is within approved budget.
[ ] Estimated setup CAD cost is recorded.
[ ] Owner approval is recorded.
[ ] Evidence documents are stored outside the repository.
```

## Required locks

These must remain true during QL-024:

```text
existing numbers protected
no porting
no forwarding
no phone webhooks
no SMS sending
no call recording
no AI auto-send
no repository-stored credentials
no repository-stored actual phone number
```

## If the gate passes

The owner may manually purchase one new disposable Canadian test number in the provider portal.

Do not paste the number into GitHub, chat, docs, environment examples, or source files.

## If the gate does not pass

Do not purchase. Resolve the blocker using only non-secret evidence.

## After purchase

Proceed to QL-025 to record redacted, non-secret purchase evidence.
