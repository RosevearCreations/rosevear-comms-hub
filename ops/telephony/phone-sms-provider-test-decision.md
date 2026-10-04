# Phone/SMS Provider Test Decision — Operator Notes

## Current decision

Use a new test number first.

Do not port or forward existing numbers.

## Candidate order

```text
1. VoIP.ms
2. Telnyx
3. Twilio
4. FreePBX/Asterisk later
5. 3CX later
```

## Stop conditions

Stop immediately if any setup path requires:

- porting an existing number;
- forwarding Bell Fibe, RosieDazzlers, or DevilnDove numbers;
- storing provider credentials in the repo;
- enabling call recording before consent/storage rules are implemented;
- enabling SMS auto-replies;
- enabling AI auto-send.

## First test-number success criteria later

A later build can proceed only after a new test number can safely support:

- inbound call logging;
- missed-call follow-up task creation;
- inbound SMS capture or manual import, if supported;
- provider webhook testing in preview only;
- no production customer data.
