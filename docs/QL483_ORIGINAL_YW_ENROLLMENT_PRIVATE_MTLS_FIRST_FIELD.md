# QL-483 — Yard Workers original-host enrollment ceremony, protected event ingress and independent field review

## What this release actually deploys

QL-483 extends the QL-480 fsync, SHA-256-chained incident journal; QL-481 short-lived independent binding; and QL-482 protected private case read. It adds a real **optionally launchable** private Yard Workers source ingress and an original Windows owner **supervised enrollment command**, not a public customer service or an auto-connected Yard Workers environment.

**Source code and static web publication GREEN do not equal first real Yard Workers field incident GREEN.** No Cloudflare Worker case-write route is added. The Source of Value/master architecture remains: Yard Workers owns its tenant data, source events and source authority; Comms Hub owns operator case status and follow-up; AIDP owns fleet health; AI Hub owns local device observation. All customer communications, financial writes, unattended startup, source enrollment and generic public access remain disabled until independently authorized.

### Implemented source enrollment

1. A **different** Yard Workers source-signing Ed25519 key, Yard Workers custodian key, independent reviewer key and Comms operator key are required. They must be independently provisioned out-of-band; the repository never creates owner keys. Do **not** trust keys merely because they appear together in a local JSON file.
2. The QL-481 source and reviewer packets must be signatures on the identical exact tenant, private staging environment, source revision, pinned keys, no customer authority, and a binding expiry of at most ten minutes.
3. QL-483 adds a separate **source-signed private challenge**, including one owner-generated SHA-256 challenge digest, exact source/tenant/revision, TLS client certificate SHA-256, nonce, two-minute freshness and no customer operation.
4. The first enrollment must be deliberately committed to an owner-only private directory. The signed evidence is reduced to a redacted, write-once fsync record with exact digest. Restart, same-packet replay, changed packet and tampered receipt are checked. A valid signed source challenge demonstrates possession of its pinned key, **not** external authentication of the original Yard Workers system by itself.
5. The original Windows CLI has a **supervised** \`--enroll\` command, constrained to the Ree Windows host candidate and owner \`%LOCALAPPDATA%\Rosevear\CommsHub\Private\` config path. It requires an interactive terminal and a typed approval; it never listens on a socket, sends data or modifies Yard Workers. \`--status\` is safe on CI. A computer name and username check are only a defence-in-depth guard, not device attestation.

### Real private event integration

\`runtimes/master-telemetry/ql483-original-yw-field.mjs\` exports:

- \`createQl483PrivateYardWorkersLink\`: dual-signature binding, source signed challenge, write-once enrollment and certificate/tenant/revision-enforced private source ingest.
- \`createQl483PrivateHttpsServer\`: an **unstarted** Node HTTPS server requiring TLS 1.3 and verified client certificates. Supports \`POST /internal/comms/ql483/yard-workers/events\` for one exact \`{"envelope": <QL-480 signed source event>}\` and \`POST /internal/comms/ql482/cases/read\` for QL-482 signed operator case-read requests. Each route has its own pinned client role: a Yard Workers source cert cannot read an operator case, and an operator cert cannot send a Yard Workers source event. Body <=4096 bytes, JSON only, no-store, safe redaction.
- \`reviewQl483IndependentYwFieldEvidence\`: independent signer reconciliation of a current, signed OPEN → RECOVERY_PENDING_OPERATOR_REVIEW → separately signed CLOSED private journal with same tenant, source revision, source receipt, journal digest and enrollment digest. A **different** independent reviewer must sign an exact evidence packet. It deliberately reports \`INDEPENDENT_SIGNED_PRIVATE_YW_FIELD_CRYPTO_REVIEW_HELD\`, not original-host/production acceptance, because synthetic signatures cannot prove field-origin provenance.

### Original Windows owner steps (not run by GitHub CI)

1. Independently identify the real Yard Workers operator/tenant, source service revision, actual source signer Ed25519 public key, custodian signer, separate independent reviewer and separately enrolled Comms operator signer. Confirm the source system has a genuine ability to produce source-signed QL-480 event packets. Never generate substitute credentials merely to pass tests.
2. Place owner-only private config at \`%LOCALAPPDATA%\Rosevear\CommsHub\Private\ql483-enrollment.json\` with exact keys shown in \`FIELDS\` in the CLI code. Do not put keys, private signatures, real tenant identifiers, certificate material, or configuration in GitHub, public ChatGPT messages or the browser. Use Windows ACLs restricted to the authorized owner and reviewers.
3. Obtain a fresh source custodian + independent reviewer QL-481 pair and a separately signed QL-483 challenge from the **actual Yard Workers source service**, with independent public-key pin verification. Observe the exact certificate fingerprint and bound revision; trust must be established before staging.
4. On the **original approved Ree Windows host** in an interactive PowerShell console, run:
   \`\`\`powershell
   node .\runtimes\master-telemetry\ql483-original-windows-enroll.mjs --status
   node .\runtimes\master-telemetry\ql483-original-windows-enroll.mjs --enroll "$env:LOCALAPPDATA\Rosevear\CommsHub\Private\ql483-enrollment.json"
   \`\`\`
   Review redacted state. Nothing starts automatically; no customer operation is authorized.
5. After explicit separate source/tenant/transport authority, assemble \`createQl480PrivateCaseAdapter\`, \`createQl483PrivateYardWorkersLink\`, \`createQl482ProtectedCaseReader\` and \`createQl483PrivateHttpsServer\` with separately verified **private** TLS CA/server key/client certificates. Source and operator client cert fingerprints differ. Bind intentionally to an approved loopback or private Tailnet interface, never a public Worker route. Provide private network firewalls, supervised one-shot startup and shutdown. No automatic deployment/job wiring was added in this build.
6. From the *real source*, independently observe and verify fresh source-signed missed heartbeat and recovery events; verify operator-signed closure, protected server readback, independent third-party witness on the actual original machines, exact deployment SHA and custody. Retain signed private evidence. Only after this can actual field acceptance be considered; do not convert source-code GREEN into first real incident certification.

### Tests and rejection cases

CI runs \`node --test runtimes/master-telemetry/ql483-original-yw-field.test.mjs\` and confirms original-owner CLI is inert on non-original hosts. Tests use temporary original-style signatures, source event receipt and fsync private journals in CI for **synthetic** rehearsal, with wrong mTLS client, wrong tenant, source revision drift, invalid source signer, replay, corrupt durable enrollment, altered incident journal, forged reviewer, stale challenge and premature acceptance rejected. They deliberately never claim to observe the original host, actual Yard Workers customer data, source telemetry or customer delivery.

### Code vs field acceptance

| Gate | QL-483 capability | Actual external evidence |
|---|---|---|
| Protected private source event API | Implemented and tested as opt-in Node module | Must be explicitly started on owner-controlled private runtime |
| Source enrollment | Four distinct signer pins, dual approval and source-signed fresh challenge + durable readback | Genuine Yard Workers source identity and original owner enrollment NOT YET independently observed |
| First source→operator incident | Signed PRIVATE_STAGING event chain, signed operator closure, independent reviewer tests | Original source heartbeat, recovery, signers and independent original-device witness must be observed |
| Comms Hub production source | Merge, application build and public asset parity | These only certify public site and code; they do NOT run the private service |
| Customer/provider/finance effects | Remain disabled | Not authorized |

**Next proposed:** QL-484 — Supervised real Yard Workers source witness, protected operator UI readback, original-host signed field evidence and independent acceptance. No forced production source activation based on simulations.

### Restart

Web/Cloudflare source publishing needs no Windows restart. A manually started **private Node runtime** will need an intentional restart only after its running code is changed; this build does not start or restart it. No Windows host reboot is needed.
