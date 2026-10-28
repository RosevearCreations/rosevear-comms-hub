# QL-247 — Six-app independent GitHub source census and held connection preconditions

**28 October 2026, Eastern — Comms Hub operator evidence record.** The owner shared `ROSEVEAR_QL246_SIX_APP_SOURCE_PROOF_HANDOFF(6).md`. It contains five named application status narratives (iCamp, Rosie Dazzlers, Devil n Dove, Rosevear AI Hub and Yard Workers); **AI Data Platform is missing from that attached status text**. AI Data Platform QL-246 can, however, be inspected independently in its actual GitHub repository.

GitHub access verified seven distinct repositories in `RosevearCreations` (six companions plus the Communications Hub). Being in one GitHub account **does not** confer API authorization, test credential custody, a trusted signer pin, an independently witnessed authenticated gateway GET, permission to expose the private home AI Hub, or owner pilot approval.

## Source evidence observed through the authenticated GitHub repository connector

The following `main` revisions were read independently from GitHub on 28 October 2026. They are *observations*, not immutable guarantees that later pushes will not advance `main`. The proof path `docs/integration/ql246-source-proof.json` was checked at each SHA; GitHub returned **404 for all six**. Do not count the existing handoff Markdown or a local test fixture as this signed source envelope.

| Source system | Exact repository | GitHub `main` SHA at inspection | QL-246 signed source proof |
| --- | --- | --- | --- |
| AI Data Platform | `RosevearCreations/ai-data-platform` | `3c73fbbc696ce2b840d4b5b8bab4d59c3dc9b644` | **MISSING (404)** |
| Devil n Dove | `RosevearCreations/devilndove-site` | `80e51fdf31cd9cc2b3fd5303e05adafed8b3d292` | **MISSING (404)** |
| Rosie Dazzlers | `RosevearCreations/rosiedazzlers` | `60d86f86456c6a0949b701ace72eb2746a7045dc` | **MISSING (404)** |
| Yard Workers | `RosevearCreations/yw` | `2e9327bd436fb395d204efcb856381e40906f0cc` | **MISSING (404)** |
| iCamp | `RosevearCreations/iCamp` | `9f175a16135dc0acdb499a962ec747a1a52df90c` | **MISSING (404)** |
| Rosevear AI Hub | `RosevearCreations/rosevear-ai-hub` | `7c098e0d895b4a82af26871056eaef3cc67ff97b` | **MISSING (404)** |

This is independently observed **repository provenance and absence of the required public proof**, not independently confirmed CI GREEN, nonproduction deployment, signed-source possession or connection status. Any HEAD change after this snapshot must be rechecked at its new commit.

## Reconciled exceptions from the owner-supplied application responses

| Application | Owner-provided update | Gate decision |
| --- | --- | --- |
| iCamp | Reported nonsecret receipt queue and evidence aging, but real gateway receipt/key exchange not verified | `HOLD_SOURCE_AND_GATEWAY_PROOF` |
| Rosie Dazzlers | Build 691 reports real signed receipts and independently witnessed denial tests not verified | `HOLD_SOURCE_AND_GATEWAY_PROOF` |
| Devil n Dove | QL-245 protected public-signature verification added; no separately trusted return in attachment | `HOLD_INDEPENDENT_PIN_AND_GATEWAY_PROOF` |
| Rosevear AI Hub | Explicitly says signing key, rotation, real health/capability/audit receipts, source witness and test origin **not provisioned/unverified** | `HOLD_PRIVATE_NONPROD_PROVISIONING` |
| Yard Workers | Build 477 preview READY, **production promotion pending** in supplied report; no actual signed original or key exchange | `HOLD_RELEASE_AND_SOURCE_PROOF` |
| AI Data Platform | No status narrative in attached document; QL-246 safe verifier exists in separate repository | `HOLD_MISSING_OWNER_RETURN_AND_SOURCE_PROOF` |

## Safe code delivered

- `scripts/ql247-six-app-github-census.mjs`: source-only inventory of exactly six real repository slugs and an immutable Git SHA QL-246 proof location; no dynamic arbitrary URL or secret-bound request.
- `scripts/ql247-retrieve-six-app-census.mjs`: zero I/O by default. Only `--public-get` fetches six public GitHub main commit metadata documents and each corresponding SHA-pinned public proof; never contacts companion runtime or private household host.
- Each fetched file is at most 16 KiB, must have the public nonproduction read-only HOLD metadata shape, and is reported `PUBLISHED_UNVERIFIED`, **never accepted as an independently trusted signature**.
- A missing proof, changed tenant, false owner claim, prohibited write, API issue or timeout stays `HOLD`. Seven unit tests cover repository confusion, source-claim forgery, allowed HTTP origins, no credential forwarding, no redirects, and no pilot authorization.
- Production behavior, existing QL-245 offline signature verifier, four-company isolation and twelve real pilot holds are unchanged. No feature flag turns on an API write or dispatch.

## Safe operator runbook

Default dry-run (no external requests):

```sh
node scripts/ql247-retrieve-six-app-census.mjs
```

Only on an approved networked nonproduction operator runner, with no API key required:

```sh
node scripts/ql247-retrieve-six-app-census.mjs --public-get --output ./private-ql247-source-census.json
```

Private output is created with `0600` permissions and will not overwrite an existing file; keep it untracked. An HTTP 404 is a **missing artifact**, not evidence of a failed or successful HMAC handshake. If the operator environment blocks internet access, mark `HEAD_FETCH_FAILED` and use the independent GitHub connector; **do not** label the network probe successful.

See `docs/ROSEVEAR_QL247_SIX_APP_CONNECTION_TEST_HANDOFF.md` for exact nonproduction prerequisites and a copyable return template. The final QL-246 signed source schema requires **actual** seven-denial outcomes, so the safe order is: inspect source/CI and independently establish signer pins; separately authorize and provision narrow nonproduction HMAC testing; observe authenticated GETs and real denials; verify receipt/audit durability and revocation; **then** issue a fresh challenge, publish the final signed proof and independently verify it. A missing final proof before controlled testing is expected, not a license to invent denials. Only after all that may the owner consider a new distinct pilot decision. Until then **owner authorization NOT GIVEN; all company connections DISCONNECTED; 12/12 real pilot scenarios HELD; 0 writes/calls/SMS/dispatch**.
