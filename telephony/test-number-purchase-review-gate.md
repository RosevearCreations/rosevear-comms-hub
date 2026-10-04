# Test Number Purchase Review Gate

## Purpose

QL-024 prepares the first manual test-number purchase without activating any live telephony runtime.

## Provider candidates

```text
VoIP.ms
Telnyx
Twilio
```

## Number requirement

```text
one new disposable Canadian test number
```

The number must not be:

```text
an existing personal number
an existing Bell Fibe number
an existing RosieDazzlers number
an existing DevilnDove number
a ported number
a forwarded number
```

## Repository-safe evidence

Allowed in the repository:

```text
provider label
brand/target use label
budget number
non-secret account reference label
credential storage location label
candidate region/type label
expected capability label
estimated monthly/setup cost numbers
boolean review confirmations
redacted plain-language notes
```

Forbidden in the repository:

```text
actual candidate number
actual purchased number
provider API key
token
password
SIP credential
webhook secret
invoice
screenshot
ownership document
customer data
call recording
SMS content
personal phone number
existing business phone number
```

## Runtime state

Keep disabled:

```text
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
```

## Next

After a manual purchase, record only redacted purchase evidence in QL-025.
