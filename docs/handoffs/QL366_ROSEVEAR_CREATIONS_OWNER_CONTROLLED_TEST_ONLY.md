# QL-366 — Rosevear Creations master organization and dual-owner TEST policy

**Owner decision:** Ree and Jack are the only human owners, master administrators
and systems operators for the six Rosevear application shells. There are no
appointed external reviewers, issuers, witnesses or third-party administrators.
This is a deliberately **new TEST-only policy**, not a claim that the former
QL-355/365C independent-reviewer requirements were satisfied.

## Organization and shell boundaries

`rosevear-creations` is a non-human organization identity, **not** a shared
username/password. Ree (`source`, `DESKTOP-AE894KC`) and Jack (`master`,
`TEMPLAR`) retain **separate** original owner keys and must eventually bind
separate, verified Supabase Auth user UUIDs to their own master principal rows.
The preflight database contained **zero** Auth users or master grants; this
release never fabricates Auth accounts or active memberships.

| Canonical source ID | Organization boundary | Customer/business children |
| --- | --- | --- |
| `yw` | Yard Workers **platform shell** | Rosevear Landscaping remains a separate, ungranted child |
| `icamp` | iCamp **platform shell** | Camp Rosevear remains a separate, ungranted child |
| `rosiedazzlers` | Owned-business shell | No customer data grant |
| `devilndove` | Owned-business shell | No Etsy/Meta, order or customer grant |
| `ai-data-platform` | Tenantless support shell | No inferred tenant permission |
| `rosevear-ai-hub` | Original local support shell | No cameras, doors or device controls |

The additive migration `20261108030735_rosevear_master_dual_owner_test_policy.sql`
creates the master organization, six HELD mappings and the **two already
observed public owner key fingerprints**. It also defines empty tables for
later true Auth-user membership and independently archived signed TEST
receipts. All new tables use FORCE RLS, no public grants, and no client
write policy. There are no active memberships or private permits.

## Alternative to the former external-reviewer ceremony

The old QL-355/365C process remains available for old evidence but is NOT
retroactively accepted. The new `QL366` decision is specifically scoped to:

- **One** source ID, immutable production commit, independently authenticated
  source signer/manifest/QL-363 contract, approved private HTTPS origin and
  TLS SPKI pin.
- `TEST`, `GET /api/integration/v1/shell/health`, at most 4096 response bytes,
  no redirects or retries, 90-second intent and a durable unique operation.
- Ree's original `source` key and Jack's original `master` key separately
  signing the **same exact intent digest** on their own original devices.
- Original-host custody and revocation verification in the private operator;
  public JSON files or two copied signatures do NOT themselves authenticate a
  session or authorize a private TEST.
- Exactly one private pinned-TLS GET, independently source-signed health and
  one-use receipt verification, append-only receipt custody, and confirmed
  original receiver STOP. No CONNECTED state is returned after this TEST.

Implementation:

- `runtimes/hub-relay/ql366-owner-controlled-private-test.mjs` implements the
  bounded TEST intent, original-owner verification and fail-closed one-use
  private gate. It never registers users, starts a receiver or sends HTTP on
  its own. Trusted original-host adapters are required at execution time.
- `runtimes/hub-relay/ql366-original-owner-test-cli.mjs` is an **offline**
  original-Windows-only signing interface. It cannot perform a GET or write
  to a database. It uses the original keys already pinned by QL-365A.
- The QL-363 signed-health adapter recognizes the new explicit QL-366 private
  operator permit in addition to the unchanged QL-362 permit; source
  signature, TLS and customer-field denial remain mandatory.

## What has not been done or silently inferred

1. The earlier original-host/key **status validation has already been done**.
   Never ask the owners to rerun QL-356/359 or per-app synthetic PowerShell
   checks. This migration does not replace the original public keys.
2. No verified Ree/Jack Supabase Auth UUIDs exist in the observed project.
   They require genuinely signed-in accounts and individually verified
   enrollment receipts; adding a fictional `Rosevear Creations` login would
   make audit attribution worse, not better.
3. The six source manifests still need their respective **genuine source
   signers**, final source-signed QL-363 contracts, pinned HTTPS/TLS origins,
   and correctly bound private runtime handlers. A GitHub CI synthetic signature
   or public digest is not proof of an original source signer.
4. No QL-366 owner TEST intent has yet been signed, no unique private claim
   has been made, no real private GET has occurred and no signed receipt or
   STOP evidence has been obtained. All connections stay `DISCONNECTED / HOLD`.
5. No live provider, customer, billing, campground gate, camera, door,
   telephony or persistent application permission is granted.

## Operator's eventual single ceremony (not six repeated test scripts)

After the source-specific signed contract and original private adapter are
genuinely available, the original private operator may coordinate **one**
source at a time:

1. Establish independently read-back original-host custody and original
   receiver OFF with a **single** supervised window. Reuse the already recorded
   original-key fingerprints; do not recreate keys.
2. On Ree's `DESKTOP-AE894KC`, the QL-366 offline CLI prepares an intent
   using the real contract SHA, immutable commit, private HTTPS origin and TLS
   pin. Both owners independently inspect and sign the same 90-second digest
   on their original machines; public approvals are reconciled once.
3. The **private operator**, not the ChatGPT application windows, validates
   both original-host key custody callbacks, the exact signed QL-363 contract,
   six still-HELD peers, original operator session and receiver OFF.
4. The private adapter atomically claims the unique operation, attempts one
   pinned-TLS GET, validates the source-signed health receipt, independently
   proves receiver STOP, and **only then** archives the completed evidence.
   Failed or expired
   operations are **never automatically retried**.
5. Record the genuine result as `PRIVATE_TEST_VERIFIED_STILL_HELD`; no
   operational connection or source-app grant is activated automatically.

The offline CLI's `--help` shows the exact new prepare/inspect/sign/assemble
arguments once a real private TEST is coordinated. **Do not run it yet** while
source-owned signing contracts remain unsigned. No owner credentials or
private-key files belong in GitHub, logs, ChatGPT or any shared document.

## Production verification vs actual connection

A GREEN `dev`/`main` code release proves only the new policy's software checks.
Owner enrollment, original signer custody, genuine signed QL-363 contracts,
the supervised one-use TEST and later persistent access are separate gates.
If the actual source or private operator lacks a required trustworthy runtime
adapter, stay on HOLD and report that specific missing dependency.

Reference: [already completed field validation](QL365D_PRIOR_FIELD_VALIDATION_RECONCILIATION.md)
and [QL-365D handoff](QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md).
