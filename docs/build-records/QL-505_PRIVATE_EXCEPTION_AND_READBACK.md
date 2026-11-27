# QL-505 — Comms-Owned Private Runtime, Receipt Exception Routing and Independent Readback

**27 November 2026 · Release basis:** the owner's 26-Nov *Rosevear All Applications Source of Truth* (Three Masters and the Comms “What did this customer actually receive?” scenario), Comms issue #1041 and prior QL-503/504 release records.

## What was implemented autonomously in Comms Hub

1. New **real Comms-only Supabase table** \`public.ql505_receipt_exceptions\` with source-app+tenant partitioning, immutable exception identity, original job digest, original signed packet digest, reason (strict known codes), permanent HOLD status and timestamp. No raw customer content, phone, email, finances, issuer key or recipient data.
2. A **service-role-only, SECURITY INVOKER, exact-metadata RPC** \`public.ql505_record_receipt_exception\`, conflict-proof on immutable exception ID and reason, with all browser writes revoked. FORCE RLS read policy reuses QL503's own authenticated, active, source-approved exact-tenant grants. No new tenant grant is created. Original message/version ledger and real provider state remain unchanged.
3. A private **one-shot Comms runtime adapter** \`ql505-private-runtime.mjs\` joins QL504 signed source/provider validation, fsynced queue, bounded retries and QL503 atomic receipt RPC to the new exception RPC on a real terminal dead-letter. The exception is accepted only with the original signed source/provider packets, exact tenant, source version, immutable job digest, original signed packet digest and a recognized terminal reason. No arbitrary browser-supplied exception becomes an operational record. Database outage returns HOLD instead of claiming durable routing.
4. The **original Windows private database gateway** \`ql505-private-db-gateway.mjs\` supports only Comms Supabase project \`gxujcwpktaickcgzyvnu\`, only two approved stored procedures, bounded JSON, one-shot HTTPS POST with redirects forbidden, and 8-second timeout. It requires the actual **DESKTOP-AE894KC** Windows environment running as Ree and a separately enrolled server-side secret; it does not claim this check physically attests a device. New \`sb_secret_\` API keys go on \`apikey\` only, never as JWT bearer tokens, per Supabase's 20-Nov-2026 migration guidance. It neither creates a receiver/listener nor stores/shares the key.
5. An independent third-issuer Ed25519 readback verifier checks reviewer signature vs distinct original source/provider signing keys, exact source app, tenant, job, receipt, expiry, record count and strict metadata-only schema. It yields **signed review claim HOLD**: a valid signature does *not* prove the physical device, provider delivery, or human acknowledgement.
6. The operator's existing QL192 inbox now displays the QL505 receipt-exception panel alongside QL502's labelled rehearsal and QL503's genuine RLS ledger. It queries only the authenticated user's exact source+tenant metadata and refreshes when auth changes, when the tab returns, and periodically when visible. No send, manual retry, tenant membership creation, contact content or customer data.
7. QL171's fail-closed browser audit was updated for **exactly two additional reviewed table reads** in \`ql505ExceptionRead.ts\`; any contact/message table access or browser INSERT/UPDATE/DELETE continues to fail its regression test.
8. New original-host \`ql505-original-host-cli.mjs --status\` stays offline on every machine. \`--inspect\` is original-Windows-only and read-only. Any activation option intentionally stays HOLD. No QL340C service/receiver startup or cross-app changes.

## What was actually verified

- Node cryptographic and one-shot runtime tests use independent **test-only** Ed25519 keypairs, a temporary local private queue, injected server-role RPC fakes, failed provider RPC, terminal dead-letter, exact issuer/job/tenant scope and forged reviewer/cross-tenant/expired readback denials. Mock acceptance is not a live provider delivery.
- Python confirms the CLI and database gateway fail closed on a nonoriginal runner, and verifies source and RLS no-send policy. React jsdom covers signed-in/no-grant, tenant isolation, no customer reads, and correct operator panel in the existing inbox. Check 375px mobile CSS and forced-colours. jsdom is not a physical guest phone or staff tablet.
- **Connected Comms Supabase** (this application only): applied migration \`20261127182500_ql505_private_receipt_exceptions.sql\`. In a \`BEGIN…ROLLBACK\` test the service role inserted one metadata-only HOLD event, a duplicate was deduplicated, a conflicting replay and an UPDATE were rejected; an authenticated user **without** a tenant grant saw zero rows. A security adviser reported no new QL505 findings. The final schema has no seeded exceptions or grants.
- Linux, Windows and existing full QL336A application/security suites must pass first on separate scoped dev and main PRs; **only exact post-merge main** Linux+Windows+Worker JS/CSS SHA-256 parity establishes code production GREEN. GitHub Pages is the disabled preview and does not install a Windows service.
- Post-release compare main SHA, production workflow result and both targeted migrations; report operational status separately from code status.

## Responsibility and owner actions — no unnecessary waiting

**Already completed or not required again:** owner's original Windows stage 1 and 2 inventory; external app windows; QL501–504 source and provider preparation. Do **not** request routine monitoring, repeat PowerShell inventory, or synchronize iCamp/YW/Rosie/Devil n Dove.

**Autonomous Comms responsibilities:** code tests, GitHub dev/main promotion, Comms-specific migration, safe isolation tests, invalid/duplicate signed receipt rejection and the disabled operator preview. QL505 must progress without waiting for other applications' customers, passwords or data-entry schedules.

**Real physical field activation is separate and not auto-authorized by a GitHub code merge:** The original Comms private runtime must be independently enrolled with source/provider/reviewer public-key pins and a server-only Comms service-role credential, then supervised locally for one approved metadata-only receipt. QL340C TEST receiver remains **OFF**. The original host's physical identity and independent actual provider record require real separately witnessed evidence; no fixture or reviewer-signed claim can substitute. Do not paste service tokens, private keys, raw messages or personal details in chat/GitHub.

**No action from the owner for QL-505 code GREEN.** If an original-host service installation or field witness is desired later, it is an explicit separate approval and must have a concrete, single-purpose set of instructions and an actual trusted provider.

## Follow-on gap

After QL505, first genuinely independent Comms-only gap is **QL-506 — Private Original-Host Worker Enrollment Evidence, Service Identity Attestation and Signed Exception Readback Reconciliation**. Build an operator-friendly, read-only snapshot of physical runtime readiness and source/provider integration before any live controlled receipt pilot. Do not silently turn the private receiver on. Choose from the first verified workflow failure instead if one appears.

## Source references

- Owner's *Rosevear_All_Applications_Source_of_Truth (2)(3).md*, §§Three Masters, Independent Master Responsibilities, and Source of Truth testing instructions (26-Nov-2026).
- QL504: \`docs/build-records/QL-504_PRIVATE_SIGNED_RECEIPT_WORKER.md\`.
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase 2026 secret API keys: https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- Active live field obligations: GitHub issue #1041; QL502 field #1038, original worker #947.
