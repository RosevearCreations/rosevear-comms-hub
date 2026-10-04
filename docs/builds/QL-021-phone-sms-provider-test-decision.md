# QL-021 — Phone/SMS Provider Test Decision

Status: complete.

## Summary

QL-021 chooses the first phone/SMS experiment path: one new test number first, with no porting or forwarding of existing numbers.

## Added

```text
api/deployment/phoneSmsProviderTestDecision.ts
api/contracts/phone-sms-provider-test-decision.example.json
docs/34_PHONE_SMS_PROVIDER_TEST_DECISION.md
ops/telephony/phone-sms-provider-test-decision.md
telephony/provider-test-decision.md
scripts/remote-operator-phone-sms-provider-test-decision.md
```

## Green criteria

- Existing numbers remain protected.
- Provider candidates are compared without connecting accounts.
- No phone/SMS webhooks are enabled.
- No SMS is enabled.
- No call recording is enabled.
- No AI auto-send is enabled.
- No provider credentials are committed.

## Production state

```text
PHONE_SMS_TEST_DECISION_STATUS=new_test_number_first
PHONE_SMS_TEST_PROVIDER=undecided
PHONE_SMS_TEST_NUMBER_REQUIRED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```
