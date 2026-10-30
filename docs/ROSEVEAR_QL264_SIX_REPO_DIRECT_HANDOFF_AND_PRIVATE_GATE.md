# Rosevear Comms Hub QL-264 — direct GitHub source handoffs and original private-proof TEST gate

**29 October 2026 Eastern · Comms Hub is the coordinator for six other applications (seven repositories total).** All integrations remain **DISCONNECTED / HOLD**. A successful software deployment is not permission to connect accounts or move live business data.

## What changed in the owner workflow

The owner requested that Comms Hub write the source-specific integration instructions **directly into all six source GitHub repositories**, removing the need to copy or attach guides across six conversations. We did that as a **documentation-only, narrow change** in each source repository. Five apps received a dedicated file under `docs/integration/`. **Yard Workers enforces exactly three active Markdown documents**, so its handoff is embedded in its existing `docs/ACTIVE_PROJECT_HANDBOOK.md` under *Rosevear Comms Hub source integration*, preserving that repository's mandatory source checks. A source team can now read its own guide in GitHub and begin the real implementation and private evidence process there.

| Source application | GitHub source-specific QL-264 handoff | Source-specific immediate need |
| --- | --- | --- |
| AI Data Platform | [Source handoff](https://github.com/RosevearCreations/ai-data-platform/blob/main/docs/integration/ROSEVEAR_COMMS_QL264_CONNECTION_HANDOFF.md) | Verify existing signer custody and isolated nonproduction gateway |
| Devil n Dove | [Source handoff](https://github.com/RosevearCreations/devilndove-site/blob/main/docs/integration/ROSEVEAR_COMMS_QL264_CONNECTION_HANDOFF.md) | Separate D1/Etsy/Marketplace from any future GET-only test |
| Rosie Dazzlers | [Source handoff](https://github.com/RosevearCreations/rosiedazzlers/blob/main/docs/integration/ROSEVEAR_COMMS_QL264_CONNECTION_HANDOFF.md) | Resolve private roles from genuine evidence; prevent booking/Gift actions |
| Yard Workers | [Source handbook section](https://github.com/RosevearCreations/yw/blob/main/docs/ACTIVE_PROJECT_HANDBOOK.md#rosevear-comms-hub-source-integration-disabled-nonproduction-only) | Independently establish a different nonproduction Supabase project and tenant |
| iCamp | [Source handoff](https://github.com/RosevearCreations/iCamp/blob/main/docs/integration/ROSEVEAR_COMMS_QL264_CONNECTION_HANDOFF.md) | Separate test campground and nonproduction guest environment |
| Rosevear AI Hub | [Source handoff](https://github.com/RosevearCreations/rosevear-ai-hub/blob/main/docs/integration/ROSEVEAR_COMMS_QL264_CONNECTION_HANDOFF.md) | Privately verify signer/witness and keep Windows relay OFF |

All six files require an original, independently checked source **A → cryptographically signed proof B**, separate custodian/witness/reviewer, approved restricted signer key store, independently pinned public Ed25519 SPKI, and a truly separate nonproduction GET-only principal. Public source A, successful CI, public key text, signed-looking JSON or owner-reported checkboxes alone do **not** authenticate a signer.

## Original evidence recheck before publication

Actual GitHub `main` branch heads were retrieved on 29 October 2026 Eastern. At each immutable SHA below the required original file `docs/integration/ql246-source-proof.json` returned **HTTP 404**. These are **pre-handoff historical snapshots**, not predictions about future commits:

| Repo | Exact historical main SHA | Original proof |
| --- | --- | --- |
| `ai-data-platform` | `a28a4874497a416613bc4182b5f895a5132fe0b9` | HTTP 404 |
| `devilndove-site` | `f8c60a8c28c3d5a172f621722e33f2546efbd9d0` | HTTP 404 |
| `rosiedazzlers` | `da968e2a115794ed34024bf618972671f582326e` | HTTP 404 |
| `yw` | `0da74570ddc97f224aef15f2a39810ca40c9dd8c` | HTTP 404 |
| `iCamp` | `040faeeb064c162fc97c059c9a271983b7f1f6bf` | HTTP 404 |
| `rosevear-ai-hub` | `090df20eef0690e84696d72b144c6a89d6d66d67` | HTTP 404 |

The exact original Rosie QL-258 nonsecret owner JSON is retained from QL-263 with SHA-256 `a57725c988c3e26fd580c0962c6299a5adcb59f1fd51a8e9356d746a9785d15a`. Its original self-reported private roles were all `NOT_REPORTED`; it is **not** a private witness receipt or owner TEST authorization. The AI Hub Build 187 contract was synthetically tested, not an authenticated network GET. No other genuine private clearance is known from this request.

## Conditional Comms Hub test: still HELD

In the operator preview, open **Six-app evidence & activation HOLD → QL-264** for direct repo links and an offline, copyable, nonsecret coordination report. No source connection is created by this screen.

The only proposed future network test is **GET-only, up to nine requests per app within fifteen minutes**, with `/health` and `/capabilities` positive cases and seven *denial* cases: missing credential, invalid credential, expired credential, wrong tenant, wrong audience, replay, and mismatched out-of-band public pin. All of these are required before an operational claim, but **none has actually been run**.

Only schedule that future nonproduction window after an independent private reviewer has checked real human custody, distinct witness, source signature and pin, A→B commit ancestry and CI; an independent operator has proven isolated nonproduction resources and scoped identity; and the owner has given separately authenticated **TEST-only** authorization with a tested stop/rollback plan. The Windows relay requires its own additional installation authority. No calls, SMS, dispatch, provider POST, payments, bookings, database writes, live customer data or home network access are permitted by QL-264.

## Release and owner action

This QL-264 handoff makes **documentation changes only** in the six source repos, not source application runtime changes. Their ordinary production software promotions can remain GREEN independently from an integration HOLD. Some source `dev` branches already contain unrelated work; each document must be promoted without silently deploying that unrelated work to `main`. Consult each source repository's PR and exact-SHA CI before calling its docs promoted.

**No file copying is needed.** Later, the real private custodian/witness/reviewer and source owners still need to perform their actual trusted work through an approved private channel. The Comms Hub static UI and this GitHub document cannot perform that human authentication.

Comms Hub release checks: `npm run verify:ql264`, `npm --prefix app run check`, `npm --prefix app test`, `npm --prefix app run build`. Release through `dev` then `main`, verify exact main SHA CI and Cloudflare checks. Keep **DISCONNECTED / HOLD** throughout.

## Next queued build

**QL-265 — Six-Repository Handoff Publication Audit, Original Private Signer/Witness Return Intake & Owner-Authorized Nonproduction GET Dry-Run Decision (HELD).** Only actual privately attested receipts or newly signed original proof B should change the evidence ledger. Successful doc publication by itself cannot clear any of the 12 live-pilot holds.

References: [QL-263 original receipt review](ROSEVEAR_QL263_ORIGINAL_RECEIPT_PRIVATE_ROLE_AND_GET_WINDOW_HANDOFF.md), [QL-261 implementation guides](ROSEVEAR_QL261_SIX_APP_ACTION_GUIDES_AND_SAFE_TEST.md), [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
