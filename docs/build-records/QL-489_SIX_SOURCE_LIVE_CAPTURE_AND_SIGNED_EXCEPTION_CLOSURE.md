# QL-489 — Independent six-app live capture and signed exception closure

## Release boundary
QL-489 adds an opt-in, individually supervised original-Windows capture capability. The release itself is NOT evidence that six production sources are currently connected. QL-488 independently pins every HTTPS/mTLS source endpoint. QL-485 verifies a signed source notice. QL-486 verifies source, owner and independent reviewer signatures and durably journals claims. QL-489 binds those receipts to a separately signed original-Windows transport witness and a private metadata-only, fsynced, hash-chained receipt journal.

A signed Windows-host statement is NOT a trusted hardware/physical attestation. The result always retains originalWindowsPhysicallyCertified=false and liveSourceFieldCertified=false until independent field acceptance exists. No customer messaging, provider writes, automatic polling, source activation, public route, Git reconciliation, or hidden task is enabled.

## Owner-private configuration
On the original Windows host DESKTOP-AE894KC, under the current Ree Windows profile, place one owner-only QL-489 configuration file and an Ed25519 host signing private key in the folder %LOCALAPPDATA%\Rosevear\CommsHub\Private. These files are NEVER checked into Git or pasted into chats.

The config has exactly these JSON keys:
- registryDirectory: the SAME private QL-486 source registry directory already used for real source receipts
- evidenceDirectory: a private folder for the QL-489 metadata receipt journal
- endpoints: the six separately pinned QL-488 mTLS entries
- pins, ownerPins, reviewerPins: the existing independently enrolled six-source QL-486 public trust anchors
- windowsHostPublicKeyPem: independently pinned Ed25519 public key matching the local original-Windows host signing key
- exceptionPins: a six-source object with independent operatorPublicKeyPem and reviewerPublicKeyPem for each source, all distinct from one another and the source/Windows keys

Do not copy private client keys, signing keys, or trust files into the Comms Hub repo or C:\rc470. Ensure only the authorized Windows owner can access them.

## Original Windows commands (Node 22+, interactive)
1. Check inert mode: node .\runtimes\master-discovery\ql489-original-host-cli.mjs --status
2. One live source at a time: node .\runtimes\master-discovery\ql489-original-host-cli.mjs --capture "<absolute-private-config>" yw "<absolute-original-windows-private-key>"
3. Repeat explicitly and separately for icamp, rosiedazzlers, devilndove, ai-data-platform, rosevear-ai-hub.
4. Close an exception only after separate source-scoped operator and reviewer signatures: node .\runtimes\master-discovery\ql489-original-host-cli.mjs --close-exception "<absolute-private-config>" "<absolute-two-signed-exceptions-json>"

Each write action asks the original owner to type a confirmation. The exceptions input contains sourceId, captureRecordDigest, operatorPacket and reviewerPacket. The latter two signatures bind the same source/case/capture/reason, require distinct signer roles, fresh timestamps and an explicit CLOSED_FOR_OPERATOR_REVIEW_HELD decision. A closed case never authorizes a source.

## Acceptance / release criteria
- New security regression runs for all six sources, cryptographic signatures, replay, wrong source, original-host inert CI mode, durable closure and tamper HOLD.
- Only QL-489 changes transit each branch through separate PRs. Dev and main have diverged deeply; do NOT merge entire branch histories.
- Production GREEN requires exact main commit checks and Worker parity success; this is distinct from real source enrollment.
- Actual original Windows live sources and true field acceptance remain HOLD until witnessed runtime results.

Next proposed build: QL-490 — Independent Six-Source Field Receipt Readback, Exception Aging & Owner-Supervised Recovery Drill.
