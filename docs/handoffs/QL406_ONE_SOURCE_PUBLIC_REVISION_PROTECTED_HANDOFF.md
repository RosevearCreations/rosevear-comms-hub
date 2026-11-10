# QL-406 — One-Source Public Revision Recheck & Protected Owner Handoff

## Result

The Comms Hub owner six-app drilldown now offers a **one-source-at-a-time review**. It compares each previously received QL-404/405 acknowledgement with a fresh public GitHub `main` observation, displays the unsigned source manifest state, and prepares a non-secret source-specific follow-up message. The operator may compare a manually supplied **public GitHub commit SHA** locally; that input is never persisted, sent, or treated as an owner signature.

Public recheck captured **2026-11-10T05:39:46Z**. The dashboard explicitly warns after one hour or when the observation clock is invalid. It **does not poll GitHub**, inspect private Windows evidence, call a receiver, authenticate a reviewer, or perform any actual TEST. Always recheck before relying on the displayed revision.

| Source | Captured `main` | Changed since QL-405 capture | Public manifest source pin | Connection |
| --- | --- | --- | --- | --- |
| Yard Workers | `e51cf098aec6d49699645bc2d8ccbd2d756d579d` | No | `028aee250857415b9b9035aaec50060757e377a5` | HOLD |
| iCamp | `b59fa045cb26f441aa32b890ba6c979c34045ce5` | No | `dc1369338a4b191fc72031b7e62f7e48fd805bcd` | HOLD |
| Rosie Dazzlers | `d079b7fac034885142a556b5df155d85af6bf495` | Yes | `83b03717b828ac70984a5f9279cd05d9f163faae` | HOLD |
| Devil n Dove | `ee9cacd4e98aea54638f001ce15ba16bba46bf5e` | Yes | `1f0e220b0cf7aff2dfeb650c96304d96502ede54` | HOLD |
| AI Data Platform | `ec451e1a2d1c33ef832a00e16736593bf17183a4` | Yes | `cb573c1ac4610fb6e438da6534db2be6cea93499` | HOLD |
| Rosevear AI Hub | `125b7371d73bbaa6ef418edb75a53934e34ad0cd` | No | `be99d882d6b75310b948911a81b2dcb5f3a3629e` | HOLD |

All six public manifests still declare `DISCONNECTED / HOLD`, no transport origin and `AWAITING_INDEPENDENT_SOURCE_SIGNER`. All six manifest source pins differ from the corresponding observed `main` revisions, which is a **metadata review task**, not evidence of live failure. Even a matching public revision does not authenticate a source or make its connection green.

## Owner-supervised sequence

1. Select exactly **one** of the six fixed source identities in the Comms Hub owner dashboard. No campground or landscaping tenant is a separate source.
2. Review the public snapshot. Optionally paste a **public** 40-character `main` commit SHA for a local comparison only. The comparison clears automatically on source change; do not paste tokens, passwords, keys, evidence files or customer information.
3. Send the displayed `QL406-COMMS-REVIEW <source-id> READ_ONLY main=<captured-sha>` string to **that source's existing ChatGPT conversation**, asking it to report a fresh publicly verifiable GitHub revision and whether a protected original review is actually complete. A text response is only coordination, never a signed receipt.
4. Source owner independently presents original source/issuer custody, source key pin and properly source-signed packet **inside the protected workflow**. An independent reviewer checks the original bytes and witness chain, then the Master Shell owner separately signs the scoped disposition. See [QL-404 protected gate](QL404_PROTECTED_EVIDENCE_SIGNED_APPROVAL_SIX_APP_GREETING.md).
5. Receiver operator independently checks consent, tenant boundary, private enrollment, durable replay store, the exact single TEST scope, the signed receipt and separate receiver acknowledgement. **No approval, original evidence or signed TEST receipt was supplied to QL-406.**
6. Only an authenticated, audited protected process can determine whether the connection state may change. This UI always returns `HOLD_ORIGINAL_REVIEW_REQUIRED`; its manual SHA input cannot activate a receiver or change trust state.

## Evidence required for any later release of HOLD

- [ ] Original source owner device/issuer custody record, independently witnessed.
- [ ] Independent reviewer identity, disposition and original artifact checks.
- [ ] Independently pinned source signing key and a valid source signature.
- [ ] Separate signed Master Shell owner approval bound to the same source/case/purpose.
- [ ] Consent, receiver enrollment, tenant boundaries and durable replay prevention.
- [ ] One scope-limited signed TEST receipt and separate receiver acknowledgement.

Do not copy private original bytes into GitHub, an issue, a browser field or ChatGPT. The already implemented QL-404 Node-only verifier can validate original cryptographic review evidence **in a separately authenticated protected runtime**; its positive review result still does not authorize a live connection.

## Verification

`npm --prefix app run test -- src/auth/__tests__/ql406ProtectedHandoffReview.test.ts src/auth/__tests__/ql375OwnerSixAppDrilldown.test.tsx`

`npm --prefix app run check`

`npm --prefix app run build`

## Next proposed build

**QL-407 — Protected Original Receipt Review Outcome Import, One-Source Operator Exception Routing & Evidence Freshness Alerts.** This must require authenticated, signed original results and keep each source on HOLD if any independent proof is missing.
