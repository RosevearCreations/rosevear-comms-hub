# Remote Operator Checklist — QL-021 Phone/SMS Provider Test Decision

## No manual setup required for QL-021

This build is documentation and decision-gate only.

## Manual setup needed later

Before QL-022 or any real provider setup:

```text
1. Choose one candidate to test first: VoIP.ms, Telnyx, or Twilio.
2. Confirm the account exists or can be created.
3. Confirm the first number is a new test number only.
4. Confirm no existing number will be ported or forwarded.
5. Confirm the test budget.
6. Confirm whether the test is for RosieDazzlers, DevilnDove, or shared hub validation.
7. Keep provider API keys, SIP passwords, auth tokens, webhook secrets, and documents out of chat and out of the repo.
```

## Keep disabled

```text
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```
