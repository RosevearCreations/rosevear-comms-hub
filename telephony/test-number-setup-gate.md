# Test Number Setup Gate

## Purpose

QL-022 prepares the first low-risk phone/SMS experiment without touching existing numbers.

The test path is:

```text
new test number
→ inbound call or SMS event later
→ contact/conversation/task evidence later
→ human review
→ no auto-send
```

## Current gate state

```text
blocked_pending_manual_setup
```

The gate is blocked because the first provider, target use, and budget still need manual confirmation.

## Allowed first providers

```text
voipms
telnyx
twilio
```

Use one provider only for the first test-number path.

## Protected numbers

These must not be ported or forwarded during this stage:

```text
existing business numbers
personal numbers
Bell Fibe numbers
RosieDazzlers numbers
DevilnDove numbers
```

## Credentials

No credentials belong in GitHub, docs, screenshots, chat, or issue comments.

Credentials and webhook secrets must be stored only in the final deployment provider secret store or a password manager.

## Later evidence intake

The next build should record non-secret evidence such as:

```text
provider selected
account created yes/no
test budget confirmed yes/no
new number purchased yes/no
test number purpose
setup notes
remaining blockers
```
