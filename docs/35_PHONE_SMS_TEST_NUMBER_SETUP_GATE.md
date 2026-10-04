# 35 — Phone/SMS Test Number Setup Gate

## Build

QL-022 — Phone/SMS Test Number Setup Gate.

## Result

QL-022 turns the QL-021 phone/SMS decision into a safe setup gate for one new disposable test number.

This build does **not** connect a provider account. It does **not** buy a number. It does **not** port or forward existing numbers. It does **not** enable phone webhooks, SMS, call recording, or AI auto-send.

The production-safe state is still blocked until the manual setup details are supplied.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/deployment/phoneSmsTestNumberSetupGate.ts
api/contracts/phone-sms-test-number-setup-gate.example.json
docs/35_PHONE_SMS_TEST_NUMBER_SETUP_GATE.md
docs/builds/QL-022-phone-sms-test-number-setup-gate.md
ops/telephony/phone-sms-test-number-setup-gate.md
telephony/test-number-setup-gate.md
scripts/remote-operator-phone-sms-test-number-setup-gate.md
```

## Gate decision

The first phone/SMS setup path remains:

```text
new test number first
```

The first provider is not selected in this repository build because selecting a provider requires manual account, cost, and availability checks.

Allowed first-provider candidates:

```text
VoIP.ms
Telnyx
Twilio
```

Deferred PBX candidates:

```text
FreePBX/Asterisk
3CX
```

## Default setup state

```text
PHONE_SMS_TEST_NUMBER_SETUP_GATE_STATUS=blocked_pending_manual_setup
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_TARGET_USE=undecided
PHONE_SMS_TEST_BUDGET_CAD_MONTHLY=
PHONE_SMS_TEST_ACCOUNT_CREATED=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

## Manual inputs required before provider setup

```text
1. Pick exactly one first provider: VoIP.ms, Telnyx, or Twilio.
2. Choose the first test-number use: RosieDazzlers, DevilnDove, or shared hub testing.
3. Confirm a small monthly/pay-as-you-go CAD test budget.
4. Confirm the test uses one new number only.
5. Confirm no existing business, personal, Bell Fibe, RosieDazzlers, or DevilnDove number will be ported or forwarded.
6. Create or use the provider account outside this repository.
7. Store credentials only in the deployment provider or password manager, never in GitHub files or chat.
```

## Setup blockers

QL-022 remains blocked until these are resolved:

```text
selected provider is undecided
target use is undecided
test budget is not confirmed
```

The blockers are intentional. They prevent accidentally connecting a live provider or spending money before the test-number path is clear.

## Production GREEN definition

For QL-022, production GREEN means:

```text
main contains the test-number setup gate helper and docs
provider account setup is still manual
no provider credentials are committed
no phone number is purchased by code
existing numbers remain unported and unforwarded
phone webhooks remain disabled
SMS remains disabled
call recording remains disabled
AI auto-send remains disabled
setup is blocked until provider, target use, and budget are confirmed
```

## Non-goals

- Do not port any number.
- Do not forward any existing number.
- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms automatically.
- Do not buy a number through repository code.
- Do not enable phone/SMS webhooks.
- Do not enable call recording.
- Do not auto-send AI replies.
- Do not enter real production customer data.
- Do not commit provider tokens, API keys, SIP credentials, webhook secrets, or phone-number ownership documents.

## Next build

QL-023 — Phone/SMS Test Number Manual Setup Evidence Intake.

Goal:

- Capture the manual provider choice, account-created evidence, and safe setup notes.
- Keep credentials out of the repository.
- Prepare the first test-number purchase review without enabling live webhooks.
