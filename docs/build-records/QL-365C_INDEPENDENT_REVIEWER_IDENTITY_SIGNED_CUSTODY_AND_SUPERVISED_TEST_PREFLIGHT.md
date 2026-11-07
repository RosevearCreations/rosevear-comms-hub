# QL-365C — Independent Reviewer Identity, Signed Custody & Supervised TEST Preflight

## What this code actually adds

QL-365C extends QL-365B with three private, server-only, fail-closed gates:

1. Independently resolve/authenticate **two different external reviewer identities**
   (`policy_reviewer` and `field_witness`), verify each Ed25519 public-key pin
   and separately authenticated custody/revocation, then verify their own
   narrowly scoped, time-limited proof-of-possession signatures. An identity
   whose public PEM or identity record comes **only from the submitted proof**
   is never trusted. Neither Ree's, Jack's, the original device's nor the
   other reviewer's key may be reused.
2. Build a **provisional** review-only registry with an immutable hash. A
   trusted original-private, append-only persistence adapter can store and
   byte-read it back under the exact idempotency key; the code does not create
   an active reviewer or database login. Separately verify QL-365B's two
   externally signed decisions, a third distinct independently pinned archive
   signer, its custody/revocation, and the actual canonical archived receipt
   bytes. A signed JSON object or a file path supplied by an applicant is not
   enough to authenticate its storage or author.
3. Require fresh **original** Windows receiver OFF, PostgreSQL `NOLOGIN` with
   0 enrollments and 0 signed receipts, six held peers with zero grants, and
   separately authenticated Ree and Jack original-owner sessions. This can
   produce only an owner-supervised **manual preflight checklist**, not a live
   TEST permit or a connected app.

Only actual, independently administered private services may implement the
identity, custody, archive and original-host readback callbacks. The public
site, GitHub CI, an imported JSON file or a single owner's self-attestation
must never satisfy them.

## Reality check before the field procedure

The previously supplied Ree/Jack public-key candidates are *not* themselves
independent identity authentication. There is still no confirmed external
original issuer/policy reviewer, independently authenticated field witness,
or real original signed TEST receipt. Code-level synthetic PASS does not
authenticate a person or authorize an original database enrollment.

The original receiver port `8788` and Tailnet Serve remain OFF by policy, the
limited receiver role stays `NOLOGIN`, and all six application peers remain
`DISCONNECTED / HOLD` by policy. This build has **no command** to open a port,
send a message, perform source writes, grant permissions, or start a TEST.
The QL-342A inert rollback is never described as a real witnessed STOP.

## Step-by-step original-device review (read-only)

1. Coordinate a review time when Ree and Jack can each be on their **original**
   PCs. Ree uses `DESKTOP-AE894KC` (`ree`), Jack uses `TEMPLAR` (`jfros`).
   Open PowerShell in `C:\Users\ree\rosevear-comms-hub-current` on Ree's PC,
   or `C:\Users\jfros\comms-current` on Jack's.
2. On **each** machine, check for local edits before updating. Do not reset or
   overwrite a dirty worktree:

   ```powershell
   git status -sb
   git fetch origin
   git pull --ff-only origin main
   node .\runtimes\hub-relay\ql365c-original-preflight-cli.mjs --status
   ```

   Require `originalOwnerRole: "source"` on Ree or `"master"` on Jack.
   Every `receiverActivated`, `privateTestAuthorized`, `connected` and
   `databaseEnrollmentAuthorized` flag must remain false.
3. First complete [QL-365A](QL-365A_FIRST_TIME_DUAL_OWNER_TRUST_BOOTSTRAP.md)
   and [QL-365B](QL-365B_ORIGINAL_REVIEW_INDEPENDENT_TRUST_AND_SUPERVISED_TEST_READINESS.md)
   **with genuine, fresh original-device evidence**. QL-365A's candidate
   expires after 20 minutes. If an earlier candidate has expired, **STOP**;
   do not change dates, overwrite records or treat a past signature as fresh.
4. Each original owner independently inspects the same *public* QL-365A signed
   candidate and both *public* QL-365B original-owner review receipts:

   ```powershell
   $candidate = 'EXACT_PATH_TO_SIGNED_QL365A_CANDIDATE.json'
   $reeReview = 'EXACT_PATH_TO_QL365B_REE_REVIEW.json'
   $jackReview = 'EXACT_PATH_TO_QL365B_JACK_REVIEW.json'
   node .\runtimes\hub-relay\ql365c-original-preflight-cli.mjs --inspect-owner-reviews `
     $candidate $reeReview $jackReview
   ```

   Match the `candidateSha256`, `sourceReviewSha256` and
   `masterReviewSha256` reported by the two machines. Each machine checks
   its own original public-key file bytes; Ree's command also checks her
   **actual current receiver-OFF** readback. Neither machine creates an
   external reviewer identity or private TEST authority.
5. **STOP — independent reviewers are not yet enrolled.** A separate trusted
   identity custodian must authenticate and pin both external reviewers,
   verify revocation/provenance and obtain their own signed proof-of-possession
   decisions. Use the server-only QL-365C verifier and append-only registry
   adapter only after that actual out-of-band identity evidence exists.
   Do **not** paste private keys, key passphrases, credentials, unredacted
   customer records or device secrets into GitHub or ChatGPT.
6. An independently appointed archive signer, different from both reviewers
   and both owners, must sign the exact decision hash. The original private
   store must return **the actual immutable bytes**, not just an `approved`
   flag or a matching filename. The private preflight then requires four
   fresh readbacks, each no older than 30 seconds, and explicit separate
   owner presence. Until all of that is verified, the correct result is HOLD.

## Server-only contracts

- `prepareQl365cReviewerEnrollment`: requires independently administered
  `resolveIndependentIdentity` and `verifyIdentityCustody`; verifies both
  role-separated proofs and creates only a **provisional**, inactive registry.
- `recordQl365cProvisionalEnrollment`: optional original-private append-only
  compare/readback through `appendOriginalRegistry` and `readOriginalRegistry`.
  The adapter must enforce immutability and idempotency; a successful return
  still cannot create a login or activate a reviewer.
- `verifyQl365cDecisionCustody`: checks the entire QL-365B signature chain,
  separate archive signer/custody, exact signed scope and actual original
  archived bytes. Missing callbacks, forged signatures, changed registry,
  stale records, revoked signers and self-signed custody all fail closed.
- `assessQl365cSupervisedTestPreflight`: in addition to genuine signed custody,
  requires four independently obtained fresh readbacks (Ree source receiver,
  original private database, six private peers, distinct Ree/Jack sessions).
  A successful result is **manual review only**. It is never a serializable
  QL-354 enrollment permit, a QL-355 issuer signature, a receiver startup,
  an original device TEST receipt or a six-peer live connection.

All exported QL-365C results explicitly carry `reviewerIdentitiesEnrolled:
false`, `originalIssuerAuthenticated: false`, `privateTestAuthorized: false`,
`databaseEnrollmentAuthorized: false`, `receiverActivated: false`,
`sixAppGrantsAuthorized: false`, `customerCommunications: false`,
`deviceActions: false`, `connected: false` and `DISCONNECTED / HOLD`.

## Development and production checks

- `node --test runtimes/hub-relay/ql365c-reviewer-custody.test.mjs` verifies
  synthetic separate reviewer keys, original-key chain, immutable registry,
  archive signature and bytes, valid read-only preflight, forged/revoked or
  reused identities, expiry, changed scope and all activation bits false.
- The original-Windows CLI is inert on a nonoriginal CI runner; only `--status`
  and `--help` work without the original host and Windows user.
- Preserve QL-336A required CI gates, QL-340–365B Windows original-custody
  security checks, disabled public provider settings and post-main public
  JS/CSS SHA-256 parity. `main` GREEN is **software release** GREEN, not
  proof that the original Ree/Jack devices, private receiver or six apps are
  connected.

Sources: [QL-365C verified private module](../../runtimes/hub-relay/ql365c-reviewer-custody.mjs),
[original-host read-only CLI](../../runtimes/hub-relay/ql365c-original-preflight-cli.mjs),
[QL-365B dual owner and independent verifier](../../runtimes/hub-relay/ql365b-original-reconciliation.mjs),
[QL-355 original issuer/witness gate](../../runtimes/hub-relay/ql355-independent-authority.mjs).
