# Rosevear QL-255 — Six-app original proof, independent custodian and bounded TEST preparation (HELD)

**Forward this to the six companion-app build conversations.** This handoff is actionable, but it **does not grant** authorization to connect to Comms Hub, open an endpoint, access the Rosevear AI Hub PC, run a nonproduction gateway GET, or send actual calls/SMS. No keys, tokens, personal ID documents, private gateway URLs, home addresses, vault or device data should be placed in GitHub or replies.

## What your six responses actually mean

The owner sent a combined six-app response. AI Data Platform, Devil n Dove and Rosie Dazzlers reported a missing original source-proof file; Yard Workers reported DISCONNECTED / HOLD and no signer/witness; Rosevear AI Hub reported its *software release complete* but integration HELD; iCamp reported passing tests with its database contract and optimized build still under validation when it replied. These are honest progress reports, **not authenticated source proof, independently verified custody or TEST-only owner authorization**.

Comms Hub independently checked all six repos' public GitHub `main` on **29 October 2026 at 10:09 a.m. Eastern** (`2026-10-29T14:09:17Z`). At each full immutable SHA below, the exact path `docs/integration/ql246-source-proof.json` returned HTTP **404**:

| Repository in `RosevearCreations` | Checked full `main` SHA | Independent QL-246 proof |
| --- | --- | --- |
| `ai-data-platform` | `c658bce8c207dcbfdf6c9afa5f304428dd3e31d3` | 404 / HELD |
| `devilndove-site` | `5017939f3b63e3f63d79a83f34357956cbafd0b4` | 404 / HELD |
| `rosiedazzlers` | `79751649527a3b4a887ce252f8a1c5b93a9434bd` | 404 / HELD |
| `yw` | `2c7b07037beb1b0ac239eb1b994cb6a87fd1923e` | 404 / HELD |
| `iCamp` | `32b7c466ad34f7018863c8b837f94c5a3b1103a5` | 404 / HELD |
| `rosevear-ai-hub` | `9cac2ebcb386bec7dfcf2379acb0998c531c6aa1` | 404 / HELD |

The SHAs are snapshots: after a new build, retrieve the new immutable `main` SHA and proof, do not assume it still 404s. App CI may be green without the **specific** signed integration proof being published. Do not solve this by writing a fake signature fixture or just another HOLD summary.

## What each app should do *next* — no more circular status updates

1. **Confirm whether your source has a real Ed25519 signing key and a legitimate custodian.** If not, return `SIGNER_NOT_PROVISIONED` / `NOT_AVAILABLE`; do not manufacture a key, assume GitHub account ownership proves custody, or claim an owner-approved trust pin. Ask for a separate, authorized key provisioning/custody procedure. This is the current first blocker.
2. If the real key already exists, use the signed QL-248 canonical nonproduction proof. Take exact **source A** with matching GREEN Actions run (`head_sha=A`); sign the genuine QL-246 payload with that independently held signer. Publish in later descendant **proof B** at exactly `docs/integration/ql246-source-proof.json`; signed payload points to **A**, never B. Do not falsify original seven denial tests or audit receipts.
3. Independently retrieve **HTTP 200** at `https://raw.githubusercontent.com/RosevearCreations/<repository>/<full-B-sha>/docs/integration/ql246-source-proof.json`; verify Ed25519 signature, A→B ancestry, exact source CI, raw proof bytes SHA-256, business/tenant, short-lived nonce and GET-only paths. Return the actual full A and B SHAs and public digest. If 404, leave the gate HELD.
4. **Independent private custody/witness:** provide a public SPKI fingerprint and non-secret registry snapshot digest to a distinct trusted reviewer **outside the app's repository**; a separate witness key signs a fresh five-minute QL-254 challenge. Custodian and witness must be different authenticated people/roles with distinct receipt references and private provenance. The Comms Hub offline checker proves only signature matching and refuses to label an unverified identity as trusted.
5. **One precise owner TEST-only request, separately authenticated:** a named nonproduction source and tenant, only `GET /api/integration/v1/health` and `GET /api/integration/v1/capabilities`, future UTC window no longer than 30 minutes, and dedicated isolated credentials. At present, `owner_test_decision=NOT_GIVEN`. Do not run the request until a separately verified private owner decision is made; an informal chat, source PR or GitHub team membership is **not** that decision. Actual read-only pilot authorization is a separate later step.

For Yard Workers and iCamp, nonproduction tenant identity needs a separately trusted mapping. Do not use live customer tenants or device identities. Devil n Dove must not trigger Etsy draft changes or photography uploads; Rosie Dazzlers must not trigger gift resend, booking or payments; iCamp must not operate gates; AI Hub must not expose home devices, cameras or vault.

## Return exactly this safe summary for each application

```text
application_name:
repository: RosevearCreations/<repo>
verified_current_main_sha: <40 hex>
source_a_full_sha: <40 hex or NOT_AVAILABLE>
source_a_green_ci_run_url: <matching Actions URL or NOT_AVAILABLE>
signer_status: REAL_SIGNER_PRIVATELY_CUSTODIED | SIGNER_NOT_PROVISIONED | NOT_VERIFIED
proof_b_full_sha: <40 hex descendant or NOT_AVAILABLE>
proof_b_immutable_public_url: <URL or HTTP 404>
proof_b_raw_sha256: <64 lowercase hex or NOT_AVAILABLE>
public_signer_spki_sha256: <64 hex or NOT_AVAILABLE / UNTRUSTED>
trusted_registry_snapshot_digest: <64 hex or NOT_AVAILABLE>
private_custodian_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
distinct_witness_receipt_id: <opaque non-secret ID or NOT_AVAILABLE>
real_world_custody_independently_confirmed: NO / NOT_VERIFIED
owner_test_decision: NOT_GIVEN / REQUESTED_PRIVATE_REVIEW
test_window_scheduled: NO
original_gateway_gets: NOT_RUN
relay_installed_on_home_pc: NO
integration_state: DISCONNECTED / HOLD
```

Do not return fabricated IDs or synthetic fixture results. Explicitly state `NOT_AVAILABLE` for facts that have not been independently obtained.

## Rosevear AI Hub Windows PC — optional 24/7 mini-server

The PC already operates the AI Hub and Tailscale; it **could** support a separate always-on connector later. Nothing has been installed, enabled, or remotely contacted. QL-255 only prepares a hypothetical TEST-only proposal after a simulated disabled→enable→stop→disabled rollback. Before any real service trial, privately confirm:

- The owner really authorizes one named nonproduction trial and the specific service account.
- Dedicated least-privilege Windows service account; outbound-only private TLS/Tailscale; no inbound router port forwarding; isolated app/tenant credentials.
- No access to Home Assistant, MQTT, cameras, password/document vault, devices, or household secrets.
- Health monitoring, stop/kill switch, rollback receipt, automatic restart policy, key revocation and recovery procedures; do not alter existing AI Hub startup tasks without explicit approval.
- Original signer proof + independently trusted custodian + owner TEST permission before any gateway GET. A future 24/7 service is not permission for a live read-only pilot.

## Comms Hub QL-255 safe checks

```sh
npm run verify:ql255
npm run integration:ql255-public-proof
npm run integration:ql255-public-proof -- --public-get
```

The first command tests synthetic offline safeguards; the second makes **zero network calls**; the opt-in third queries only precisely allowlisted public GitHub endpoints. No actual home-host, gateway, private runner or owner approval is involved.

**Next queued candidate QL-256:** Original Signer Provisioning Blocker Decisions, Independent Custodian Role Assignment & Owner-Safe Nonproduction Trial Scheduling Readiness (HELD).
