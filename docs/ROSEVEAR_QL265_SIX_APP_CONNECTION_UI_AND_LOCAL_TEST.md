# Rosevear Comms Hub QL-265 — six-app connection interfaces and offline contract check

**29 October 2026 (Eastern) · Implementation checkpoint · Real integration: DISCONNECTED / HOLD**

QL-265 adds a visible, nonsecret Comms Hub connection surface to each existing source-app I.T./Connections area, plus an operator-preview dry run in the coordinator. The interface cannot create signing keys, verify humans, install a relay, authorize a test, read customer data or make gateway requests.

| App | Existing menu | Connection screen | Repository |
| --- | --- | --- | --- |
| AI Data Platform | Integrations & Execution | `/integration-delivery/comms-hub` (requires session) | `RosevearCreations/ai-data-platform` |
| Devil n Dove | Admin → I.T. Integrations | `/admin/it-integrations/` | `RosevearCreations/devilndove-site` |
| Rosie Dazzlers | Admin → I.T. Connections | `/admin-integrations/` | `RosevearCreations/rosiedazzlers` |
| Yard Workers | Admin → I.T. & System | Embedded section in I.T. workspace | `RosevearCreations/yw` |
| iCamp | Workspaces sidebar → I.T. · Comms Hub | `/integration/comms-hub` | `RosevearCreations/iCamp` |
| Rosevear AI Hub | Admin → System → Integration health | Embedded in integration panel | `RosevearCreations/rosevear-ai-hub` |

### Run the coordinator's LOCAL-only test

1. Open the Rosevear Comms Hub Operator Preview and find **Six-app evidence & activation HOLD**.
2. Open **QL-265 · Six-app Comms Hub connections & local end-to-end contract check**.
3. Press **Run six-app LOCAL contract simulation**. The response has six app records, each with two positive synthetic read-only cases and seven synthetic rejection cases (54 scenarios total). `networkRequests=0` and `actualAuthenticatedGets=0` are required even if `localContractPass=true`.
4. Open each source's connection screen and press its **Run local** button. Each returns the same `rosevear-comms-local-preflight/v1` safety posture, not a signed witness receipt.

### Real end-to-end network test is separate and still held

- Privately authenticate a real persistent signing-key custodian, a **different** nonce witness and separate reviewer for each source. Approve a restricted key store. Independently pin the real public Ed25519 SPKI.
- Independently verify original signed source A → immutable proof B at `docs/integration/ql246-source-proof.json`. Historical HTTP 404 observations do not prove a later SHA's state.
- Demonstrate an isolated **nonproduction** tenant and least-privilege server credentials in each app. Never use Yard Workers' production tenant, Devil n Dove Etsy/D1 products, Rosie booking data, iCamp customer accounts or the home Hub cameras/vault.
- Obtain separately authenticated owner **TEST-only** authorization and approved rollback before scheduling at most **two positive and seven denial-only GETs** per app within fifteen minutes. No live calls/SMS/dispatch/payments or provider posts.
- Until all of these conditions are independently verified, the six source connection screens and the coordinator must remain **DISCONNECTED / HOLD** with twelve live-pilot holds unchanged.

### Next proposed coordinator build

**QL-266 — Six-App Connection UI Production Acceptance, Original Private Witness Evidence Verification & Conditional Read-Only Gateway Window Authorization Review (HELD until externally verified).**
