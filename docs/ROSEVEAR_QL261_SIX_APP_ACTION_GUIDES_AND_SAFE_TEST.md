# Rosevear Comms Hub QL-261 — Six original source-app guides and safe connection preflight

**29 October 2026 Eastern · Software release independent of integrations · DISCONNECTED / HOLD.**

The owner asked for **a separate document to send to each companion application** and **a test runnable from Comms Hub**. Both are provided in this release. None of these documents changes a companion repository by itself; the companion-app build owner must implement, test and promote changes there. This Comms Hub code does not create private signing keys, obtain human signatures, contact an authenticated source gateway, or start a home relay.

## Forward exactly one guide to each companion app

| Companion app / source repository | Send this QL-261 file | Specific pending requirement |
| --- | --- | --- |
| AI Data Platform / `ai-data-platform` | [AI_DATA_PLATFORM_QL261.md](integration/ql261/AI_DATA_PLATFORM_QL261.md) | Verify existing candidate signer and real private custody; establish bounded nonproduction GET target |
| Devil n Dove / `devilndove-site` | [DEVIL_N_DOVE_QL261.md](integration/ql261/DEVIL_N_DOVE_QL261.md) | Privately authenticate signer/witness; keep Etsy API and product trial separate |
| Rosie Dazzlers / `rosiedazzlers` | [ROSIE_DAZZLERS_QL261.md](integration/ql261/ROSIE_DAZZLERS_QL261.md) | Return actual QL-258 packet; keep booking/quote/Gift activity out of gateway trial |
| Yard Workers / `yw` | [YARD_WORKERS_QL261.md](integration/ql261/YARD_WORKERS_QL261.md) | Verify **separate nonproduction** Supabase project/tenant; separate owner review for legacy global-admin audit |
| iCamp / `iCamp` | [ICAMP_QL261.md](integration/ql261/ICAMP_QL261.md) | Return missing app packet, isolate a nonproduction campground and test users |
| Rosevear AI Hub / `rosevear-ai-hub` | [ROSEVEAR_AI_HUB_QL261.md](integration/ql261/ROSEVEAR_AI_HUB_QL261.md) | Private key custody/out-of-band pin; Windows mini-server relay remains OFF |

These are **source-app action requests**, not a claim that those six apps already changed. The app-specific guides include required source changes, real-world approvals, source-side tests and exact sanitized return instructions. Do not post private identity, passwords, tokens, secret-manager paths, public internet origin names, home IPs, challenge nonces or private evidence in GitHub, Comms Hub or this document.

## Run the new test from Rosevear Comms Hub

1. Visit the published Comms Hub **operator preview** and open **Six-app evidence & activation HOLD** → **QL-261**.
2. Send each link above to its own companion-app build conversation. Ask it to implement its own guide, run its own safe tests and return the **original QL-258 sanitized owner JSON** plus nonsecret immutable public A/B proof/CI links when genuinely available.
3. Paste each app's **exact QL-258 sanitized JSON** into **One original QL-258 sanitized owner JSON packet** and select **Validate original packet · HELD**. Repeat for each app. This is existing QL-259 exact-schema validation: it rejects extra keys, invented permissions, swapped repository metadata and conflicting updates. A self-report remains unverified.
4. Select **Run six-app offline preflight test**. This always runs locally, requires no credentials, and reports which exact packets arrived and which independent signer, source, tenant and TEST-approval prerequisites remain missing. Even 6/6 valid packets do **not** change the test gate from HOLD.
5. *Optional:* select **Run six public GitHub proof GETs (read only)**. It makes exactly six anonymous GETs to the original proof path on **the immutable source SHAs recorded in QL-260**. `404` means absent at that SHA; `200` means file publicly visible, **not** correctly signed or authenticated. Network/CORS errors are `NETWORK_UNKNOWN`, not success. These calls are to **public raw GitHub**, never the companion app or private server, and do not infer a newer SHA.
6. Choose each source in the dropdown and copy **app-specific instructions**. **Copy sanitized six-app test report** and retain it outside the temporary UI. The worksheet resets on refresh; it never stores packets to browser storage or sends them to any API.

## What must be completed before any real nonproduction connection TEST

1. Authenticated private custodian, distinct witness and reviewer assigned to each signer. Restricted persistent key store approved. Independently witnessed *public* SPKI pin and original key possession established. A GitHub-generated signing key or browser status cannot substitute.
2. Authentic original `docs/integration/ql246-source-proof.json` published at **proof commit B** referencing previously audited **source commit A**. Independent reviewer verifies original signature, pinned key, immutable ancestry and exact SHA CI. At the **QL-260 snapshot on 29 October 2026**, all six proof paths were HTTP 404; a later source commit requires fresh verification.
3. Actual nonproduction health/capabilities targets and least-privilege credentials proven separate from production. **Yard Workers and iCamp specifically require separate tenant/project evidence**. The observed Yard Workers production landscaping company is not nonproduction isolation; a sample iCamp campground in production is not enough.
4. Separately authenticated **owner TEST-only authorization**, with exact allowed endpoints, scope, schedule, independent reviewer, maximum requests and rollback. Only **after** that may operators consider limited authenticated GET/deny-receipt verification. The 12 live communication pilot prerequisites remain HELD; no SMS/calls/dispatch or production writes.

### Variables and secrets

No new Cloudflare static Worker runtime binding, GitHub Actions secret or `VITE_*` variable is required to use QL-261's **public/offline** test. The static-only Cloudflare Worker cannot accept runtime bindings in its current asset-only deployment. Private signing and HMAC credentials must remain in a separately authorized restricted **server-side** private store; do not copy them into source control, chat, a static bundle or public Cloudflare build variables.

## Software verification and decision

- Comms Hub source tests: `npm run verify:ql261` and `node --test scripts/__tests__/ql261-six-app-guide-integrity.test.mjs`.
- Full app: `npm --prefix app run check`, `npm --prefix app test`, `npm --prefix app run build`.
- Release: PR → `dev` with CI, then PR → `main` with CI/Cloudflare checks against the **exact production main SHA**. A successful software build can be **Production GREEN** while **source integration remains DISCONNECTED / HOLD**.

## Next build (announce after QL-261 promotion)

**QL-262 — Six-App Original Evidence Receipt Recheck, Nonproduction Isolation Decision Ledger & Public Signed-Proof Freshness Test (HELD).** Build on genuine owner-return packets received after this QL-261 handoff, recheck new immutable source commits and preserve all authenticated TEST-only gates.

References: [GitHub Actions variables](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables), [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [QL-259 exact JSON parser](ROSEVEAR_QL259_SIX_APP_OWNER_RETURN_RECONCILIATION.md), and [QL-260 immutable source triage](ROSEVEAR_QL260_FIVE_APP_RETURN_TRIAGE_MASTER.md).
