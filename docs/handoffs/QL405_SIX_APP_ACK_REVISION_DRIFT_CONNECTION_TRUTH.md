# QL-405 — Six-App ACK Ledger, Public Revision Drift & Owner-Gated Connection Truth

## Outcome

The Master Shell owner drilldown now presents a dated, read-only **public GitHub evidence snapshot** for the six fixed platform/support identities. It reconciles the exact ACK revision supplied by each application's existing ChatGPT handoff against the `main` revision independently observed at the time of collection, and separately flags a source manifest revision mismatch. It never treats an ACK, valid code handler or green deployment as a trusted connection.

Snapshot captured: **2026-11-10T05:08:23Z**. A snapshot older than one hour or captured in a future clock state is explicitly marked for recheck. The source rows are **not live polling**, do not claim present-time branch heads and must be manually revalidated when source commits advance.

| Source | ACK vs observed main at capture | Manifest source revision vs main | Authenticated connection |
| --- | --- | --- | --- |
| Yard Workers | Match | Mismatch / pin review | HOLD |
| iCamp | Match | Mismatch / pin review | HOLD |
| Rosie Dazzlers | Match | Mismatch / pin review | HOLD |
| Devil n Dove | Match | Mismatch / pin review | HOLD |
| AI Data Platform | ACK outdated | Mismatch / pin review | HOLD |
| Rosevear AI Hub | ACK outdated | Mismatch / pin review | HOLD |

The public `source_revision` in each manifest differs from its independently observed `main` HEAD. This is **metadata drift requiring source-owner review**, not proof that any live connection failed. All six manifest records stated `DISCONNECTED / HOLD`, with no original source signer in the public record and no authorized transport origin. The reported original owner and source-signed TEST receipt evidence remained HOLD.

Source-side references:

- [QL-404 source-side ACK and six-application reconciliation record](https://github.com/RosevearCreations/rosevear-comms-hub/issues/810)
- [AI Data Platform Build 353 handoff and Comms ACK](https://github.com/RosevearCreations/ai-data-platform/issues/791)
- [QL-404 original evidence, independent reviewer and master owner gate](QL404_PROTECTED_EVIDENCE_SIGNED_APPROVAL_SIX_APP_GREETING.md)

## Security and release boundaries

1. The UI uses fixed, nonsecret, reviewed source metadata; no passwords, browser tokens, private URLs or customer records. It has **no network calls, persistence writes, source mutations, receiver enablement, or communication send controls**.
2. The current dashboard snapshot is an evidence **comparison**, not a source-attested original receipt. Even a matching revision remains “HOLD” until independently verified original source-owner, reviewer, master-owner, receiver and consent evidence is reconciled.
3. Future source updates should be recorded with the new observed revision and evidence timestamp, not silently rewritten to make old ACKs appear current. A mismatched ACK must be refreshed in the source's own trusted review process.
4. A signed one-source TEST receipt and separate receiver acknowledgement must be reviewed through the protected workflow. No public manifest or ChatGPT message may release HOLD.

## Acceptance tests

`npm --prefix app run test -- src/auth/__tests__/ql405AcknowledgementLedger.test.ts src/auth/__tests__/ql375OwnerSixAppDrilldown.test.tsx`

`npm --prefix app run build`

## Next proposed build

**QL-406 — Owner-Supervised One-Source Original Receipt Review, Public Revision Refresh & Protected Handoff Decision.** This should consume only independent protected evidence and record true per-source observations; no automatic connection promotion or new account enrollment.
