# QL-350 — Authenticated Private Connection Control Bridge, Original-Owner Enrollment Reconciliation & Guided Six-App TEST Activation

## Accurate starting evidence, 2026-11-06

- Public GitHub Pages can read all six published QL-333 manifests; that is **not** a signed private connection.
- The Comms Hub database previously contained zero enrolled original devices, zero original relay receipts and six HELD peers. Original Windows/Jack key *candidates* can exist locally without enrollment. No code build changes those private facts.
- Every peer is database-constrained to `HOLD`, with `source_test_authorized=false` and `customer_data_allowed=false`. Its table and the enrollment/receipt tables use FORCE RLS. The existing `ql340c_private_receiver` role is the only role allowed to perform the specified private readback; `anon`, `authenticated`, `service_role` do not gain broader access.

## Delivered

1. A modern dark QL-350 section at **I.T. / Connections** with **Check private bridge**, four explicit original-enrollment steps, and six individually disabled/authorized TEST actions. On static Pages, `GET /private/ql350/status` has no handler and all TEST actions stay disabled. No new key entry.
2. A server-only QL-350 private bridge library with a bounded HTTP adapter. Only `GET /private/ql350/status` and `POST /private/ql350/test` are registered. It binds to `127.0.0.1`, requires an independently authenticated operator session, non-expired exact action scope, same-origin TLS/CSRF, a strict two-field TEST intent and a 2 KB body cap. No CORS, redirects, arbitrary URLs or customer commands.
3. Real private database readback through the existing `ql340c_private_receiver` role: exactly six HELD peers, original-device enrollment count, original relay receipt count and cryptographic verification of the original signed receipt **if** the signed original packet and public pins are provided privately. Never accept claimed browser approval booleans.
4. One-source-at-a-time orchestration via QL-349, only when the original enrollment and witnessed receipt are verified, source-owned immutable manifest is independently pinned, dual owner/source approval and original signer are authenticated and a separate append-only source witness adapter is configured. Replay, redirect, expiration, missing signer or receipt, failed witness, concurrent attempt and unknown source fail closed with no automatic retries.
5. Full Node + browser regression coverage; the new tests are added to protected Ubuntu QL-336A and Windows original-owner CI.

## Installation boundary — a private bridge is not the public preview

The Hub's public GitHub Pages and Cloudflare static Worker deliberately **cannot** run the private server. The private operator must deploy the server-only QL-350 adapter on Ree's Windows Hub, behind its original Caddy/Tailnet TLS and owner-authenticated operator session. A trusted reverse proxy supplies the private same-origin routes and validates anti-CSRF and session identity. Do not expose port 8788/QL-350 directly to the Internet, enter DPAPI keys in a browser, add a `service_role` key to the frontend or copy a private database URL to GitHub.

**The repository library is ready for that existing private sidecar to import, but the sidecar's original owner session, source signing, transport and independent witness adapters are not enrolled or configured by this PR. No live private listener, owner approval, TEST GET or persistent source connection was started by CI.**

## One-time original enrollment, then six guided source TESTs

1. **Ree's Windows Hub:** preserve existing QL-339B/340B source key and the protected current-user DPAPI material. Run the existing private read-only QL-343/344/346/348 local checks; inspect the genuine original issuer evidence and receiver-OFF/rollback witness. No key rotation or duplicate owner ceremony is required merely because QL-350 was released.
2. **Jack's separate laptop:** review the exact original 20-minute TEST request, field hashes and original issuer trust independently. Only the two original owners can make the separate signed TEST decisions. A previous REVIEW acknowledgement is not enrollment permission.
3. **Dedicated database operator:** only after both original TEST approvals, enroll the single exact device request through the established private QL-340B procedure and its narrow database role. Verify one authentic signed original heartbeat and its append-only QL-338 receipt. Until that occurs, the QL-350 private readback must return HOLD.
4. **Private Windows/Tailnet control bridge:** configure an existing authenticated operator-session adapter, source immutable-pin resolver, exact source-owner/issuer signer, signed read-only GET transport, independent receipt verifier and append-only witness writer. Start the bridge only on `127.0.0.1` behind trusted same-origin Caddy TLS with CSRF protection. Do not enable anonymous REST or grant public database access.
5. **One source at a time:** select the source under I.T. / Connections and use **Run one authorized TEST**. The bridge accepts only `sourceId` and a new UUID, resolves the verified manifest privately, requires the independent source-owner grant, performs exactly one GET `/api/integration/v1/shell/health` and verifies/persists the original signed source receipt. An unsuccessful source stays isolated for review. Success is `ONE_SOURCE_SIGNED_TEST_WITNESS_VERIFIED_STILL_HELD`, not production CONNECTED.
6. **Separate persistent authorization:** only after a genuine transport and tenant/role grant may a later protected change transition the source beyond HOLD. QL-350 does not alter the immutable QL-341 HOLD table or enable customer data.

| Source | Existing source-owned repo | Published manifest |
|---|---|---|
| Rosie Dazzlers | `rosiedazzlers` | `.well-known/rosevear-integration-manifest.json` |
| Devil n Dove | `devilndove-site` | `.well-known/rosevear-integration-manifest.json` |
| Yard Workers | `yw` | `public/.well-known/rosevear-integration-manifest.json` |
| iCamp | `iCamp` | `public/.well-known/rosevear-integration-manifest.json` |
| AI Data Platform | `ai-data-platform` | `apps/web/public/.well-known/rosevear-integration-manifest.json` |
| Rosevear AI Hub | `rosevear-ai-hub` | `apps/web/public/.well-known/rosevear-integration-manifest.json` |

The source applications already publish those contracts. **This Hub build does not overwrite any source repository, create keys for every app, issue source approvals, modify an application database or deploy to Ree's private Windows server.** Their independent queued builds remain safe.

## Verify without inventing trust

- `npm test` in `runtimes/hub-relay` and `app`; `npm run build` in `app`.
- Protected Ubuntu QL-336A, Windows original-owner checks, `main` Worker SHA-256 parity and Pages deployment.
- A private operator should independently confirm original enrollment/receipt counts using `ql340c_private_receiver`; verify actual source signing authority, not only a JSON file or public manifest.
- The UI must remain `0/6 CONNECTED` on public Pages, even if every contract is discovered and production CI is GREEN.

## Next operational work

QL-351 should focus on **original Windows authenticated adapter installation, independent owner ceremony completion and one supervised Rosevear AI Hub TEST receipt**, before scheduling separate source TESTs. It must never manufacture authority from a prior build's UI label.
