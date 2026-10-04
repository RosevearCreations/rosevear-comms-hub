# QL-022 — Phone/SMS Test Number Setup Gate

Status: complete.

## Summary

QL-022 adds the setup gate for the first phone/SMS new-test-number path.

The gate is intentionally blocked until the provider, first use, and budget are manually confirmed.

## Added

```text
api/deployment/phoneSmsTestNumberSetupGate.ts
api/contracts/phone-sms-test-number-setup-gate.example.json
docs/35_PHONE_SMS_TEST_NUMBER_SETUP_GATE.md
ops/telephony/phone-sms-test-number-setup-gate.md
telephony/test-number-setup-gate.md
scripts/remote-operator-phone-sms-test-number-setup-gate.md
```

## Green criteria

- `main` contains the test-number setup gate helper and source-of-truth docs.
- `dev` is promoted to match `main`.
- Provider account setup remains manual.
- No provider credentials are committed.
- No number is purchased by code.
- Existing numbers remain protected.
- Phone webhooks remain disabled.
- SMS remains disabled.
- Call recording remains disabled.
- AI auto-send remains disabled.
- The setup gate blocks progress until provider, first-use target, and budget are confirmed.

## Production state

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

## Next build

QL-023 — Phone/SMS Test Number Manual Setup Evidence Intake.
