# Remote Operator Checklist — QL-023 Phone/SMS Manual Setup Evidence Intake

## Manual setup is not required to complete this build

QL-023 adds the evidence-intake structure only. It does not require the operator to sign in to VoIP.ms, Telnyx, Twilio, or any other provider during repository promotion.

## When manual setup is done later

Record only non-secret facts:

```text
1. Provider selected: voipms, telnyx, or twilio.
2. Target use: rosiedazzlers, devilndove, or shared_hub.
3. Approved CAD test budget.
4. Provider account created outside repository: yes/no.
5. Non-secret provider account reference label.
6. Credential storage location: password manager or deployment secret store.
7. Provider portal reviewed: yes/no.
8. Canadian number availability reviewed: yes/no.
9. SMS/compliance requirements reviewed: yes/no.
10. Evidence stored outside repository: yes/no.
```

## Do not paste these anywhere in GitHub or chat

```text
API keys
tokens
passwords
SIP credentials
webhook secrets
screenshots
invoices
ownership documents
customer data
existing phone numbers
```

## Safe production flags

```text
ENABLE_PHONE_WEBHOOKS=false
ENABLE_SMS=false
ENABLE_CALL_RECORDING=false
ENABLE_AI_AUTO_SEND=false
PHONE_SMS_TEST_NUMBER_PURCHASED=false
```
