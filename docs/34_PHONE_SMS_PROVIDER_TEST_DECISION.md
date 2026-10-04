# 34 — Phone/SMS Provider Test Decision

## Build

QL-021 — Phone/SMS Provider Test Decision.

## Result

QL-021 chooses the safest first phone/SMS experiment path:

```text
new_test_number_first
```

No existing business, personal, Bell Fibe, RosieDazzlers, or DevilnDove number should be ported or forwarded during this stage.

This build does **not** connect a provider account. It does **not** buy a number. It does **not** enable phone webhooks, SMS, call recording, AI answering, or AI auto-send.

## Repository

```text
RosevearCreations/rosevear-comms-hub
```

## Files added

```text
api/deployment/phoneSmsProviderTestDecision.ts
api/contracts/phone-sms-provider-test-decision.example.json
docs/34_PHONE_SMS_PROVIDER_TEST_DECISION.md
docs/builds/QL-021-phone-sms-provider-test-decision.md
ops/telephony/phone-sms-provider-test-decision.md
telephony/provider-test-decision.md
scripts/remote-operator-phone-sms-provider-test-decision.md
```

## Decision

The first live phone/SMS experiment must use one new test number only.

```text
Selected approach: new_test_number_first
Selected provider: none yet
Existing numbers: protected
Porting: prohibited
Forwarding: prohibited
Phone webhooks: disabled
SMS: disabled
Call recording: disabled
```

## Candidate comparison

### Shortlist for the first test-number account

```text
VoIP.ms
Telnyx
Twilio
```

These remain candidates only. They are not connected, and no account credentials belong in the repository or chat.

### PBX candidates deferred

```text
FreePBX/Asterisk
3CX
```

These remain useful later for PBX, routing, and softphone scenarios, but they are not the first low-risk step because the hub still needs to prove the basic call/SMS intake workflow with one disposable test number.

## Source review notes

Official/provider documentation reviewed for this decision build:

- VoIP.ms documents SMS/MMS setup for supported US/Canada DIDs through its portal and message centre.
- Twilio documents phone numbers for voice/messaging use and separate toll-free verification requirements for US/Canada messaging.
- Telnyx documents US/Canada toll-free messaging and global number-type support including voice/SMS/MMS capabilities.
- 3CX documents configuration/API integration and SIP/SMS provider requirements.

These notes are only decision inputs. The final provider must still be confirmed manually against current account availability, Canadian number availability, verification requirements, and costs before any number is purchased.

## Manual input required

No manual input is required to complete the QL-021 repository build.

Manual input will be required before QL-022 can set up a real test number:

```text
1. Choose which candidate account to use first: VoIP.ms, Telnyx, or Twilio.
2. Confirm the test is for a new number only.
3. Confirm a small monthly/pay-as-you-go test budget.
4. Confirm whether the first test number is for RosieDazzlers, DevilnDove, or shared hub testing.
5. Confirm no existing phone number will be ported or forwarded yet.
```

## Safe production state

```text
PHONE_SMS_TEST_DECISION_STATUS=new_test_number_first
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_REQUIRED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

## Production GREEN definition

For QL-021, production GREEN means:

```text
main contains the phone/SMS test decision helper and docs
first experiment is new-test-number only
existing numbers remain unported and unforwarded
phone webhooks remain disabled
SMS remains disabled
call recording remains disabled
AI auto-send remains disabled
no provider credentials are committed
```

## Non-goals

- Do not port any number.
- Do not forward any existing number.
- Do not connect Bell Fibe, cell phones, SIP trunks, SMS, 3CX, FreePBX, Twilio, Telnyx, or VoIP.ms yet.
- Do not buy a number yet.
- Do not enable phone/SMS webhooks.
- Do not enable call recording.
- Do not auto-send AI replies.
- Do not enter real production customer data.
- Do not commit provider tokens, API keys, SIP credentials, webhook secrets, or phone-number ownership documents.

## Next build

QL-022 — Phone/SMS Test Number Setup Gate.

Goal:

- Turn the QL-021 decision into a setup gate.
- Record which provider will be used for the first new test number.
- Keep existing numbers protected until the test path is proven.
