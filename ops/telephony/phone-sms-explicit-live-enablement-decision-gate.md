# Phone/SMS Explicit Live Enablement Decision Gate — Ops Checklist

Build: QL-034

## Required confirmations

- [ ] QL-028 runtime verification is green.
- [ ] QL-029 evidence mapping review is green.
- [ ] QL-030 human review gate is ready.
- [ ] QL-031 operator outcome journal is ready.
- [ ] QL-032 rollback/retention review is ready.
- [ ] QL-033 final pre-enablement readiness review is planning-ready.
- [ ] The current decision is from an alias only, not a real operator identity.
- [ ] All evidence is synthetic.
- [ ] All evidence is redacted.
- [ ] No actual phone number is included.
- [ ] No provider credentials or webhook secret values are included.
- [ ] No customer data or mapped live records are included.
- [ ] No live provider payload is included.
- [ ] No recording or transcript is included.
- [ ] No persistence write is enabled.
- [ ] No live customer read/write is enabled.
- [ ] No provider callback is enabled.
- [ ] No phone webhook is enabled.
- [ ] No SMS sending is enabled.
- [ ] No call recording is enabled.
- [ ] No AI draft or auto-send is enabled.
- [ ] Existing phone numbers remain protected.
- [ ] A later implementation build is required before any live traffic.

## Allowed QL-034 outcomes

- `remain_blocked`
- `continue_rework`
- `approve_controlled_live_enablement_planning`

## Meaning of approval

Approval in QL-034 means the next controlled live enablement planning build may be prepared.

Approval in QL-034 does not enable production traffic.

## Stop conditions

Stop and do not promote if any of these appear:

- actual phone number;
- real operator identity;
- provider credential;
- SIP credential;
- webhook secret value;
- customer data;
- mapped live record;
- live provider payload;
- recording;
- transcript;
- persistent row requirement;
- enabled provider callback;
- enabled phone webhook;
- enabled SMS sending;
- enabled call recording;
- enabled AI draft;
- enabled AI auto-send;
- Supabase migration.
