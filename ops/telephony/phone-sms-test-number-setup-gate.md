# Phone/SMS Test Number Setup Gate

## Build

QL-022 — Phone/SMS Test Number Setup Gate.

## Operator rule

Use one new test number only.

Do not port or forward any existing business, personal, Bell Fibe, RosieDazzlers, or DevilnDove number.

## Setup gate

The setup gate remains blocked until these manual inputs are complete:

```text
Provider: VoIP.ms, Telnyx, or Twilio
Target use: RosieDazzlers, DevilnDove, or shared hub testing
Budget: small monthly/pay-as-you-go CAD test budget
Existing numbers protected: yes
```

## Provider-account setup boundary

Provider accounts, payment methods, purchased phone numbers, and credentials must be handled outside the repository.

Allowed to record in the repository:

```text
provider name
setup status
target use
budget approval status
non-secret evidence notes
```

Never record in the repository:

```text
API tokens
SIP usernames
SIP passwords
webhook secrets
phone-number ownership documents
payment details
customer call/SMS content
```

## Required safe flags

```text
PHONE_SMS_TEST_NUMBER_SETUP_GATE_STATUS=blocked_pending_manual_setup
PHONE_SMS_EXISTING_NUMBERS_PROTECTED=true
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

## Exit criteria

QL-022 is GREEN when the repository contains the setup gate and the live system is still safely blocked.

The next build can intake manual setup evidence after a provider and budget are selected.
