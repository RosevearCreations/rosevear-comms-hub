# Rosie Dazzlers — QL-261 source-app action guide

**Forward to the Rosie Dazzlers build conversation.** Source: `RosevearCreations/rosiedazzlers`. Its successful booking/quote release is an application feature release, **not** a signer or integration return.

## Apply in the source application

1. Generate/return an actual **QL-258 sanitized owner JSON** using the seven known progress statuses. The Build 704 quote-follow-up summary is not that packet. Enter only real owner-observed progress; keep personal information out.
2. Decide privately whether the original signing key exists and, if not, authorize its provision in an approved restricted persistent server-side store. Authenticate one custodian, a **different** witness and independent reviewer; obtain a genuinely witnessed public SPKI pin out of band.
3. Prepare an isolated nonproduction GET-only health/capabilities target. It must not expose real customer quotes, booking references, vehicle details, payment records or send follow-up emails.
4. After authentic private custody review, publish signed original `docs/integration/ql246-source-proof.json` at proof commit B, referring to earlier audited source commit A; verify both commit SHAs and exact CI.
5. Run source tests, promote the source software and return only the sanitized owner packet and public proof/CI identifiers. Keep the current Gift testing pause separate from this connectivity handoff.

## Source-side acceptance tests

- [ ] No customer notification, payment, quote acceptance, booking link or Gift action can be triggered by the read-only integration test role.
- [ ] Signed proof B truly belongs to source A, with independently verified public pin and role separation.
- [ ] Exact source commit and its CI result independently reviewed.
- [ ] No actual TEST GET before separately authenticated owner permission.

**Known snapshot:** `e9f2abf49cb2f243daf469ca58e87ccacfd15a0f`, original proof HTTP 404 on 29 October 2026 at that SHA. Future releases may change this status. Integration remains DISCONNECTED / HOLD.

**Return:** exact QL-258 sanitized JSON + nonsecret original proof A/B/CI refs, if actually published. Do not send keys, passwords, person names, customers or private access channels.
