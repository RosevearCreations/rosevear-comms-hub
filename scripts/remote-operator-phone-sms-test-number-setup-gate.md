# Remote Operator Checklist — QL-022 Phone/SMS Test Number Setup Gate

## No provider setup performed by this repository build

QL-022 is a setup gate only. It does not buy a phone number and does not connect a provider.

## Manual setup needed after QL-022

Before the next phone/SMS build, collect these decisions outside the repository:

```text
1. First provider: VoIP.ms, Telnyx, or Twilio.
2. First use: RosieDazzlers, DevilnDove, or shared hub testing.
3. Monthly/pay-as-you-go CAD test budget.
4. Confirmation that only one new test number will be used.
5. Confirmation that no existing number will be ported or forwarded.
```

## Safe setup steps

When ready to do the real provider setup:

```text
1. Sign in to the chosen provider directly.
2. Confirm Canadian number availability and voice/SMS capability.
3. Confirm recurring monthly and per-use costs.
4. Create or use the provider account outside GitHub.
5. Purchase only one new disposable test number after budget approval.
6. Store credentials and webhook secrets outside the repository.
7. Keep all phone/SMS webhooks disabled until the later webhook test build.
```

## Never share or commit

```text
API token
SIP username
SIP password
account recovery codes
payment details
webhook secret
phone-number ownership documents
real customer call/SMS content
```

## QL-022 safe state

```text
PHONE_SMS_TEST_NUMBER_SETUP_GATE_STATUS=blocked_pending_manual_setup
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_TARGET_USE=undecided
PHONE_SMS_TEST_ACCOUNT_CREATED=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```
