# Rosevear Comms Hub QL-257 — Six application responses, variable placement and owner's next actions

**29 October 2026 · Owner-safe handoff · Production software can be GREEN while integration stays DISCONNECTED / HOLD.**

## Answer to the Cloudflare screenshot

The screenshot shows **Settings → Variables and secrets** on a **static-assets-only Cloudflare Worker**. That page explicitly says variables and bindings cannot be added. This is a platform/runtime distinction, **not a broken account or missing permission**.

1. **Cloudflare production site build:** go to **Workers & Pages → rosevear-comms-hub → Settings → Builds → Build variables and secrets**. This is where *public build-time* Vite values would go if the production build actually needs them. Cloudflare Workers Builds documents that these values are available to the build and not at runtime. Do not add anything for the QL-257 proof review.
2. **GitHub Pages preview:** go to **GitHub → RosevearCreations/rosevear-comms-hub → Settings → Secrets and variables → Actions → Variables**. This controls the separate GitHub Actions build only. A variable there does not automatically become a Cloudflare Workers Builds variable.
3. **Cloudflare Runtime Variables / Bindings:** unavailable on the current static-only deployment. Adding a Worker script/backend is a separate architecture and security decision, not a way to clear the signer HOLD.
4. **Genuine source Ed25519 keys / app HMAC credentials:** do **not** enter these in either the GitHub or Cloudflare public/static build UI. They belong in a distinct approved source-app operator/private server secret store after accountable role assignment and permission. Never in `VITE_*`, commits, screenshots, chat, CI logs or this handoff.

Official references: [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/), [GitHub Actions variables](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables), [Supabase browser/server API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## Known Comms Hub source defaults — NOT confirmed deployed environment values

| Name | Public committed example or implementation | Now |
| --- | --- | --- |
| `APP_NAME` | `rosevear-comms-hub` | No action |
| `VITE_DEFAULT_BRAND` | `rosiedazzlers` | No action |
| `VITE_STORAGE_KEY` | `rosevear-comms-hub:v1` | No action |
| `SUPABASE_PROJECT_REF` | `gxujcwpktaickcgzyvnu` | Public identity only |
| `VITE_SUPABASE_URL` | `https://gxujcwpktaickcgzyvnu.supabase.co` | Optional build-time; do not enable now |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Blank in `.env.example`; current admin client expects this variable | Not needed now |
| `VITE_SUPABASE_ANON_KEY` | Used by older read-only scaffold and GitHub Pages preview workflow, not in `.env.example` | Value unknown; do not copy in a secret |
| `DATABASE_URL`, `DATABASE_READONLY_URL`, `INTAKE_SHARED_SECRET` | Blank in template | Server-only future scope; not for static preview |
| `VITE_ENABLE_SUPABASE_CLIENT`, `VITE_ENABLE_HOSTED_DATABASE` | `false` in template | **Keep false** |
| Live reads, writes, intake, phone/SMS flags | Disabled in template/preview controls | **Keep disabled** |

`VITE_*` values are compiled into browser-delivered JavaScript, so never place a private signing key, HMAC value, service-role/secret key, database password or family/home information there. Supabase now recommends a *publishable* key for browser code and privileged secret keys only in controlled server code; our older `ANON_KEY` versus `PUBLISHABLE_KEY` naming needs a deliberate future migration, not an emergency setting change.

The current `wrangler.jsonc` has a static `assets.directory=./app/dist` and no declared D1/KV/R2/service bindings. Successful GitHub Pages and Cloudflare production builds do **not** demonstrate a working Supabase login, production secrets or six-app connector.

## Results received from all six apps

These are sanitized public source and owner-provided statuses. Fresh public GitHub checks on 29 October 2026 found the exact original `docs/integration/ql246-source-proof.json` still **HTTP 404** on each listed current `main` commit. A source A and successful CI can be older than current main; A is not the future signed proof-bearing B.

| App | Freshly checked current main | Returned real signer decision | Next actual action |
| --- | --- | --- | --- |
| AI Data Platform | `15ccd72f098b6238d4b1d357a97676d6a2836df2` | `SIGNER_EXISTS_CUSTODY_NOT_VERIFIED`; candidate public SPKI fingerprint reported, **not independently pinned** | Independently authenticate existing signer, custodian, public pin, witness and reviewer |
| Devil n Dove | `58713dcaaac487eb5b9634e9e21e42aa83ea436e` | `SIGNER_STATUS_UNKNOWN` | Confirm real private signer store and appoint custodian/witness/reviewer |
| Rosie Dazzlers | `4da5a7fc78cf3dec21852f7fb79907e45f779279` | `SIGNER_STATUS_UNKNOWN`; private provisioning utility described | Approve secure persistent host and distinct human custody roles before running it |
| Yard Workers | `eb4b5baa6fbca39165c630ba71e3839e82df19e7` | `SIGNER_STATUS_UNKNOWN`; private provisioning utility described | Confirm private signer/custodian and actual isolated nonproduction company tenant |
| iCamp | `d04bcaba6adbd551db0a66ec9cf363919bae1088` | `SIGNER_STATUS_UNKNOWN` | Authenticate custody roles and actual isolated nonproduction campground |
| Rosevear AI Hub | `b992fdf6a30c62ad627f561c3808f39d4bf6f816` | `SIGNER_STATUS_UNKNOWN`; mini-server not started | Assign app signer and custody roles; home server relay is optional and stays off |

All six: proof B **NOT_AVAILABLE**; genuine original gateway GET and denial receipts **NOT_RUN**; owner TEST-only approval **NOT_GIVEN**; integration **DISCONNECTED / HOLD**. Production GREEN for a source application is not a connection receipt.

## What we should do next — no technical secrets required yet

**First owner decision:** privately identify a signing-key custodian, *different* independent challenge witness and independent reviewer for each app. Roles may be handled through a trusted accountable process, but no source team can truthfully appoint or authenticate them by code. Do not put real names, private verification channels or identity documents in the public return packet.

**Second owner decision:** choose a persistent, encrypted, restricted private key host or hardware-backed store for each source app. Do not assume the Rosevear AI Hub Windows PC is approved. Do not place the six keys in one shared chat, repository, browser, or disposable CI worker.

**Third operator task:** after roles and storage are approved, the authorized custodians can check whether real keys exist, privately provision missing unique Ed25519 signing keys using each app's reviewed tool/procedure, and return **only independently trusted public SPKI fingerprint and opaque nonsecret receipts**. AI Data Platform's candidate key requires authentication, not replacement without cause.

**Then, not now:** independent reviewer accepts staged preliminary signer/source trust → separately authenticated owner **nonproduction TEST-only** request → one future ≤30-minute private GET-only health/capabilities window → genuine original receipts/seven denials and rollback → final canonical signed QL-246 proof A→B → independent public proof HTTP 200/source/CI/pin review → **separate later** pilot decision.

Our existing static Comms Hub browser needs **no new secrets or bindings** to collect these public nonsecret status reports. Do not enable Supabase, Etsy, payments, campground gates, staff dispatch, phone/SMS, home devices or Windows service relay to overcome a missing signature.

## Short owner reply format for the next checkpoint

```text
For each app:
  Private key custodian role: ASSIGNED_AND_INDEPENDENTLY_AUTHENTICATED / NOT_ASSIGNED
  Distinct independent witness: ASSIGNED_AND_INDEPENDENTLY_AUTHENTICATED / NOT_ASSIGNED
  Separate reviewer: ASSIGNED_AND_INDEPENDENTLY_AUTHENTICATED / NOT_ASSIGNED
  Approved restricted private key host/store: APPROVED / NOT_APPROVED
  True signer status after private check: SIGNER_NOT_PROVISIONED / SIGNER_EXISTS_CUSTODY_NOT_VERIFIED / SIGNER_STATUS_UNKNOWN
  Public SPKI pin independently checked: VERIFIED_OUT_OF_BAND / NOT_VERIFIED
  Nonproduction tenant isolation (Yard Workers and iCamp): VERIFIED / NOT_VERIFIED
  Owner TEST-only authorization: NOT_GIVEN
  Connection: DISCONNECTED / HOLD
```

Return **status words only**, not private names, passwords, keys, raw tokens, secret-manager addresses or home IP addresses. QL-257 does not create or certify any custody receipt.
