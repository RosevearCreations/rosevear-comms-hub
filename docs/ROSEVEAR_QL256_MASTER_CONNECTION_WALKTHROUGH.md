# Rosevear QL-256 — Owner walkthrough to connect the six apps to Comms Hub

**29 October 2026 | Owner guide | current decision: DISCONNECTED / HOLD**

## What this means in plain English

Our applications can have GREEN production builds while their **integration** stays on HOLD. The source of the current six-way stall is not the visual interface. The signed proof required at `docs/integration/ql246-source-proof.json` is absent in every source repository's checked `main` commit (HTTP 404). Nobody has independently verified a real signer, its independent custodian, or a separate TEST-only owner approval.

**The fix is one shared process, performed once per application**—not another round of HOLD-status builds. We need real signing authority, a safe test decision and original evidence. We cannot create genuine historical receipts, independent witness identities or owner approval by editing code.

### Exactly who does what

| Role | What we need | What we must not assume |
| --- | --- | --- |
| Owner (Ree/Jack or specifically authorized owner representative) | Decide whether to permit a narrow TEST later, via authenticated private procedure | A ChatGPT/GitHub conversation is not the signed approval |
| Source app maintainer | Choose audited code commit A and matching successful CI; implement a correct signer workflow | App GREEN means signed proof exists |
| Real private key custodian | Protect that app's Ed25519 private signing key; approve legitimate signing | GitHub write access is proof of key control |
| Independent witness | Verify a fresh challenge and public-key pin outside the source repository | A copied fingerprint proves independent trust |
| Independent reviewer | Compare public A/B, exact CI, signature, seven genuine denial receipts, isolation and rollback | Same person can self-witness or waive missing evidence |
| Comms Hub operator | Assemble the six checked returns; run approved test only after all explicit conditions pass | Can schedule or enable a live connector now |

No names are pre-assigned. One person must not approve their own witness or be counted as two distinct roles. If independent people/processes are unavailable, say **NOT_ASSIGNED** and keep HOLD.

## One-time setup, then repeat for each app

### Step 1 — Give the specific instructions to each source app

Open each application's GitHub build conversation or repository and forward its matching QL-256 handoff document:

1. [AI Data Platform](ql256-apps/AI_DATA_PLATFORM_QL256.md)
2. [Devil n Dove](ql256-apps/DEVIL_N_DOVE_QL256.md)
3. [Rosie Dazzlers](ql256-apps/ROSIE_DAZZLERS_QL256.md)
4. [Yard Workers](ql256-apps/YARD_WORKERS_QL256.md)
5. [iCamp](ql256-apps/ICAMP_QL256.md)
6. [Rosevear AI Hub](ql256-apps/ROSEVEAR_AI_HUB_QL256.md)

Ask each maintainer **first** for the honest key-provisioning decision: `SIGNER_NOT_PROVISIONED`, `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED`, or `SIGNER_STATUS_UNKNOWN`. If no key is provisioned, the next real job is an authorized, private signing-key workflow—not a new simulated signature or proof file.

### Step 2 — Set up the signing trust privately

Each app needs its own Ed25519 signing key, stored in its own approved secret manager (not in any GitHub file). If the maintainer has authority to provision it, the source team should prepare its private key generation, access control, backup/rotation and revocation procedure for owner approval before provisioning. Public repositories may contain the signed non-secret proof and a public fingerprint, never the private key.

The independent custodian/witness obtains the public key fingerprint from a **trusted channel distinct from the proof file**. Record role assignments and challenge receipts privately. Do not post passwords, credentials, private keys, phone numbers or identity documents in the handoffs. We cannot personally authenticate independent people from repo comments.

### Step 3 — Fix the proof/test chicken-and-egg

Earlier handoffs sometimes demand genuine GET/denial receipts **inside the final signed proof before any TEST is allowed**. That is circular. The proposed controlled sequence is:

1. Verify audited source revision A, GREEN CI, real signer custody and an independently trusted *preliminary* public key identity.
2. Review the exact test scope and get a separately authenticated, time-bounded owner TEST authorization. Independent security reviewer formally accepts this **staging amendment**; if not accepted, remain HOLD.
3. Run only the authorized private nonproduction GET test, witness true success/denial/audit/rollback results. Never invent receipts.
4. Prepare and sign the final QL-246 proof with actual evidence. Publish it in **later** commit B. Verify B's raw file and A→B history.
5. Obtain a new, separate go/no-go decision for any pilot. A successful test does **not** enable a live pilot.

The staged amendment is a **proposal**, not a bypass and not a current authorization.

### Step 4 — Prepare one small TEST request (but do not run it yet)

Use a private owner approval system where the authorized owner's identity and decision can be verified separately. The request should say:

```text
Request kind: NONPRODUCTION_READ_ONLY_TEST_ONLY
Application: <one source repository>
Business/tenant: <verified nonproduction only>
Purpose: Confirm Comms Hub health and capabilities handshakes
Methods: GET only
Routes: /api/integration/v1/health
        /api/integration/v1/capabilities
Window: <future UTC start> to <future UTC end>, maximum 30 minutes
Network: private outbound-only; no public inbound port or home router changes
Credential: per-app, isolated, least-privilege; provision privately only after approval
Logging: non-secret receipts; independent reviewer; tested revocation
Rollback: stop connector, disable credentials, verify disabled state
Owner decision: NOT_GIVEN (until separately authenticated)
Pilot decision: NOT_GIVEN
```

Do **not** send a real request from Comms Hub or the home Windows PC yet. A proposed time is not a calendar booking. Each app gets its own window after the prerequisites pass.

### Step 5 — After authorization, conduct the witnessed test

The designated private operator—not a public browser, GitHub Action log or this code-only build—uses app-scoped credentials and the approved isolated tenant. Record original HTTP response receipts, real negative tests, exact timestamps, source SHA, reviewer observation and revocation. For ordinary testing, never touch customers, bookings, payments, Etsy listings, campground gates, payroll, live dispatch or home devices. If an unexpected response occurs, stop, revoke and return HOLD.

### Step 6 — Publish and independently check the original proof

For each app:

1. Record complete audited source SHA **A** and the exact successful GitHub Actions run for **A**.
2. With real evidence and a valid challenge, sign the canonical QL-246 payload using the app's real private Ed25519 signer.
3. Commit the non-secret `docs/integration/ql246-source-proof.json` in later descendant SHA **B**. The signed payload references **A**, not its own containing B.
4. Fetch `https://raw.githubusercontent.com/RosevearCreations/<repo>/<full-B-sha>/docs/integration/ql246-source-proof.json`; expect HTTP 200. Calculate SHA-256 of exact bytes, validate Ed25519 and the independently held SPKI fingerprint, ancestry, tenant, nonproduction routes, CI and actual receipts.
5. Return A, B, public digest and non-secret receipt references to Comms Hub. If any fact fails or is missing, do not mark connected.

The existing Comms Hub verifier is in [the repository](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/scripts/ql248-verify-source-proof-bundle.mjs); it checks supplied *offline public metadata only* and does not prove real-world identity or authorize a network test.

### Step 7 — Check all six and decide on a separate pilot

Comms Hub runs its existing public-GitHub source checker, independent offline signature verification and reviewer comparison. Only a recorded six-of-six authentic result plus a separate owner-signed pilot decision may advance pilot readiness. Otherwise **DISCONNECTED / HOLD** remains correct.

## Optional Rosevear AI Hub Windows mini-server

This is a future option, not necessary to begin the proof work. Do **not** install, expose or start it at QL-256. If later authorized, use a dedicated least-privilege Windows account, outbound-only private TLS/Tailscale, isolated per-app nonproduction credentials and a tested stop/revoke procedure. Do not grant access to Home Assistant, Mosquitto, cameras, password/document vault, or other household data. Do not alter existing AI Hub startup tasks without specific approval.

## What to send back (one short report per app)

```text
App / repository:
Current main SHA:
Signing key decision: SIGNER_NOT_PROVISIONED / SIGNER_EXISTS_CUSTODY_NOT_VERIFIED / SIGNER_STATUS_UNKNOWN
Source A SHA and exact GREEN Actions URL: <values or NOT_AVAILABLE>
Independent custodian / witness / reviewer: NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED
Independently authenticated pin and key custody: NO / NOT_VERIFIED
Final proof B SHA and public URL: NOT_AVAILABLE / actual values
Original GET and denial receipts: NOT_RUN / actual private reviewed receipts
Owner nonproduction TEST-only authorization: NOT_GIVEN / PRIVATE_APPROVAL_PENDING
Actual test scheduled: NO
Connection status: DISCONNECTED / HOLD
Next concrete action:
```

No fabricated signatures, witnesses, keys, receipts, appointments or approvals.

### Sources you can verify

- [Comms Hub QL-255 action sheet](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/ROSEVEAR_QL255_SIX_APP_SIGNER_CUSTODY_OWNER_TEST_ACTION_SHEET.md)
- [Comms Hub QL-248 two-SHA specification](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/ROSEVEAR_QL248_PROOF_COMMIT_AMENDMENT_HANDOFF.md)
- [GitHub Actions secrets guidance](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [GitHub Actions workflow run history](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-workflow-run-history)
- [Ed25519 signature scheme (RFC 8032)](https://www.rfc-editor.org/rfc/rfc8032)
