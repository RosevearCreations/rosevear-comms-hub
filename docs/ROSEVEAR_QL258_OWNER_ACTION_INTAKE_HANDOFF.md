# Rosevear Comms Hub QL-258 — Owner action checklist, safe return packet and public proof refresh

**29 October 2026 · Production software promotion is independent from integration: DISCONNECTED / HOLD.**

## What QL-258 changes

Open **Six-app evidence & activation HOLD** in the operator preview. The new first panel provides a six-app selector, seven progress questions and an app-specific nonsecret JSON return. Choose one app, mark only what has actually been attempted, then **Copy sanitized [app] handoff** and forward it to that app's build conversation. Repeat for six apps. We can mark `OWNER_REPORTS_DONE_NOT_VERIFIED`, but that is only our self-report; Comms Hub never turns it into an authenticated identity, signed proof, approved network test or live integration. This is an in-memory worksheet and is cleared on refresh; copy the JSON somewhere we control.

**Do not put** people's real names, key material, tokens, passwords, private addresses, credential-store paths or customer records into the worksheet or public GitHub. The only editable values are fixed progress labels; the exported packet rejects unknown fields and maintains `NOT_GIVEN` owner authorization, `DISCONNECTED` connection and 12 live pilot holds.

## Fresh immutable public GitHub source snapshot

Public `main` checked on 29 October 2026. Each exact `docs/integration/ql246-source-proof.json` returned **HTTP 404** on the listed SHA. This is a dated source-proof status, not deployment failure or a statement about newer commits.

| App | Immutable current `main` SHA | Original public proof |
| --- | --- | --- |
| AI Data Platform | `a86dce3a71cd6795f5b32b22ddf4320c091dd7a5` | 404 |
| Devil n Dove | `f3c18345e7ec00f92418e25cb3ffb121420598ca` | 404 |
| Rosie Dazzlers | `69afa528d28ee1df3ad200cc5da0cf4a3c2acbf9` | 404 |
| Yard Workers | `5c8f4a104fd8f0375a89f58c6ee65ea08b82b5fd` | 404 |
| iCamp | `7722ee2c0549dc1baddafc7de350544d69793a65` | 404 |
| Rosevear AI Hub | `99d64047c49678733af762ff906f288ec3ee0bb8` | 404 |

Proof path: `docs/integration/ql246-source-proof.json`. A signed proof must reference source commit A and later reside in separate proof commit B; B cannot self-reference its own SHA. A public proof alone still needs independent key/pin custody checks.

## Owner's actual next tasks, in order

1. **For each source app:** privately appoint a signing-key custodian, a distinct independent witness, and a separately accountable reviewer. Do not declare any role authenticated merely because an app or GitHub account reported it.
2. **For each app:** approve a restricted, persistent private signer host/store. AI Data Platform's candidate key should be independently authenticated before considering replacement. For Yard Workers and iCamp, independently verify an isolated *real* nonproduction company/campground; example tenant names alone do not demonstrate isolation.
3. **Authorized operators only:** check whether each real signer key exists; provision any missing unique signer key in the approved private host following that app's reviewed procedure, never in static Cloudflare Build vars, `VITE_*`, GitHub source or chat. Return only safe public fingerprint/opaque evidence references.
4. **Source apps:** create and publish genuine QL-246 signed source proof A→B; attach original source/CI and independent public key pin/witness evidence. Verify the exact immutable GitHub proof path returns HTTP 200, then have an independent reviewer assess actual custody.
5. **Only after the above:** seek a separately authenticated *owner nonproduction TEST-only decision*. A future ≤30-minute private, reversible read-only GET health/capabilities test needs scoped source credentials, receipts/denials, rollback and reviewer. Neither this QL-258 worksheet nor a green build grants it. Live pilot, calls/SMS/dispatch remain disabled.

## Where settings go (unchanged from QL-257)

| Setting | Correct place now |
| --- | --- |
| Public `VITE_*` compile-time values, if deliberately needed later | Cloudflare Worker → Settings → **Builds** → Build variables and secrets |
| Values used only by GitHub Pages Actions preview | GitHub repo → Settings → Secrets and variables → Actions |
| Real Ed25519 signer private keys/HMAC, database passwords, service-role secrets | Approved app-specific **private server/operator key store**, not the static browser or either public build |
| Runtime bindings in the current static-assets-only Cloudflare Worker | Unavailable; do not add a Worker runtime as an integration shortcut |

**No new environment variables or bindings are required for QL-258.** Supabase login, hosted database reads, private mini-server relay and telephony stay disabled. For source verification use the prior QL-248/QL-253 tools only in their documented, separately authorized scope.

## Review and release checklist

- `npm run verify:ql258`: safe enum handling, privacy, fail-closed export and UI checks.
- `npm --prefix app run check`, `npm --prefix app run test`, `npm --prefix app run build`.
- PR → `dev` → PR → `main`; verify **exact SHA** Cloudflare Worker build and GitHub CI success independently of connection status.

References: [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/), [GitHub Actions variables](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables).
