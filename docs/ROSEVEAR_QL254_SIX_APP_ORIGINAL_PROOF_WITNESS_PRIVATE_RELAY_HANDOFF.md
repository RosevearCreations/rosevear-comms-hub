# Rosevear QL-254 — Original signed proof, independent witness, private 24/7 relay readiness (HELD)

**Forward to all six companion-app build conversations.** You have permission to improve the source code in your own repository, but **do not invent or publish a fake signature, witnessed test, key custodian, owner approval or gateway receipt**. This handoff cannot authorize a network test. The owner has NOT given a separately authenticated TEST-only authorization.

## Verified current blocker: still 6/6 public proof 404

Comms Hub made fresh *public GitHub-only* source/proof requests at **28 October 2026, 11:42 p.m. Eastern** (`2026-10-29T03:42:01Z`). The exact raw path `docs/integration/ql246-source-proof.json` returned **404** for all six immutable `main` commits:

| App (GitHub account `RosevearCreations`) | New main SHA checked | Proof result |
| --- | --- | --- |
| `ai-data-platform` | `9e570d82707fd476b43458fa869776bac9ddc65f` | 404 / HELD |
| `devilndove-site` | `ae145e67d526119a90612e8e4151dc84416d1446` | 404 / HELD |
| `rosiedazzlers` | `056de275482a3b4a00e17610f634b1b79f3490c0` | 404 / HELD |
| `yw` | `37cac7dc25caa153088f0b58a76df98b23539730` | 404 / HELD |
| `iCamp` | `19db62c90a12bf48da74e4e063fb16c3b6f6c1ce` | 404 / HELD |
| `rosevear-ai-hub` | `d2cab6dfa98be39c8dd2775a020fe8c644768ceb` | 404 / HELD |

Each repository has advanced since QL-253. The application build/production status is separate from this signed **integration proof** blocker. Check the file again after promoting your new revision, never claim 404 at a different SHA without retrieving it.

## Required concrete source-app actions

1. Identify an actually tested **source commit A**, record its matching GREEN GitHub Actions run URL and verify the run's exact `head_sha == A`.
2. Using your legitimate securely held Ed25519 signing key, create a **genuine** canonical QL-248 signed nonproduction proof for A. Include only verified source identity, approved tenant/business, `GET` and the two integration paths, and honestly reported negative-test metadata. Do **not** fabricate original seven gateway denial receipts, owner authentication, durable audit results or prior live GETs.
3. Publish the JSON envelope at **exactly** `docs/integration/ql246-source-proof.json` in proof commit **B**, descendant of A (A ≠ B), then promote to `dev`/`main`. The signed payload refers to A, never its containing B.
4. Independently retrieve HTTP **200** from the *immutable* raw URL for B. Return exact SHA-256 of raw file bytes, the two full SHAs, the exact source CI run, ancestry and public signing-key SPKI digest. A signature or a shared GitHub owner does **not** prove key custody.
5. Obtain independent out-of-band custody/witness attestation. A **different** witness key must sign a fresh five-minute registry challenge linked to A, B, business/tenant, original registry snapshot digest, custody fingerprint and distinct receipt IDs. This must be verified outside the source app/GitHub by a separately authenticated custodian; do not place the private registry or witness contact details in the repository. A self-reported witness receipt remains a **HELD claim**.
6. Only after original proof and independent custody verification may the real owner be asked **privately** for a separate **TEST-only** decision: exactly the named nonproduction business/tenant, future UTC window of 30 minutes or less, `GET` only to `/api/integration/v1/health` and `/api/integration/v1/capabilities`. No window, credential, scheduled GET or pilot is authorized now. A distinct later owner permission is needed for an actual read-only pilot.

## Safe response from each app (no secrets)

```text
application_name:
repository: RosevearCreations/<repo>
observed_main_sha: <40 hex>
source_sha_A: <40 hex or NOT_AVAILABLE>
matching_source_green_ci_run_url: <full Actions URL or NOT_AVAILABLE>
proof_commit_sha_B: <40 hex descendant or NOT_AVAILABLE>
immutable_proof_url: <public raw URL or HTTP 404>
proof_http_status_at_B: <200 / 404 / NOT_AVAILABLE>
exact_raw_proof_sha256: <64 hex or NOT_AVAILABLE>
public_signer_spki_sha256: <64 hex / NOT_AVAILABLE / UNTRUSTED>
private_registry_snapshot_sha256: <digest or NOT_AVAILABLE>
independent_registry_custody_receipt_id: <opaque ID or NOT_AVAILABLE>
separate_witness_receipt_id: <opaque ID or NOT_AVAILABLE>
independent_witness_real_world_identity_verified: NO / NOT_VERIFIED
owner_test_decision: NOT_GIVEN / REQUESTED_PRIVATE_REVIEW
actual_nonproduction_gateway_gets: NOT_RUN
real_original_seven_denial_cases: NOT_VERIFIED
connection_state: DISCONNECTED
```

Never publish real signing private keys, tokens, HMAC secrets, password vault data, home-network addresses, private URLs, personal identity documents, customer records, Etsy keys, payment information, camera feeds or device data. A private custodian can transmit opaque receipt references and public digests, not the underlying secrets.

## Rosevear AI Hub PC: potential always-on private mini-server, **not installed**

The existing Windows Rosevear AI Hub machine with Tailscale, backend, Caddy, MQTT and Home Assistant could later host a **separate least-privilege connector service**. That is **only an architecture candidate**. QL-254 simulates reversibility in memory; it does not access or configure the home PC.

Required before any real installation:

- Confirm owner approval, hardware uptime/patching/recovery, least-privilege Windows service account, firewall rules and versioned service binaries.
- Use Tailscale/private LAN or outbound-only TLS initiated from the private connector to a separately verified Comms Hub gateway. **No public inbound ports, port forwarding or public home-device DNS.**
- Separate credentials and tenant scopes per source app; minimum GET-only scopes; secure OS secret store (never source/CI logs). Isolate the existing vault, cameras, Home Assistant, MQTT and household devices from the connector.
- Create a documented reversible start/stop procedure, service health monitoring (bounded 30–300-second checks), kill switch, key revocation and restore baseline; test rollback in a *nonproduction simulation* first.
- Require authentic source proof, independent registry custody, owner TEST-only permission and narrowly scoped original GET receipts before even a first private connection. No live telephony, Etsy writes, booking, payments, locks or gate controls.

The owner’s general permission to make GitHub code improvements **does not substitute** for owner TEST-only authorization or permission to deploy a service to the home PC.

## Comms Hub safe checks

```sh
npm run verify:ql254
npm run integration:ql254-public-proof
npm run integration:ql254-public-proof -- --public-get
```

The first command runs synthetic signature and rollback regression fixtures. The second makes **zero network requests**. The opt-in third contacts **only allowlisted public GitHub** source/CI/proof URLs. None can authenticate real-world owner/witness identity, access a private gateway, schedule tests or lift integration HOLD.

**Next queued QL-255 candidate:** Six-App Verified Proof Publication Disposition, Private Witness Custody Exception Closure & Bounded Mini-Server Trial Approval Preparation (HELD).
