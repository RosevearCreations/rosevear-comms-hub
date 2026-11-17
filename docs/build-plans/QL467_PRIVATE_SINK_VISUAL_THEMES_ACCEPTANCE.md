# QL-467 — Authenticated read-only Master event sink and contrast / shared Master themes

## Exact implementation and deployment boundary
A private Node HTTPS handler now **implements in source** the exact POST path:
\`/internal/rosevear/master/events/read-only/v1\`
at \`runtimes/master-telemetry/ql467-private-event-sink.mjs\`.

It is **unbound**. No public Cloudflare Worker route, Windows service, database user, Tailscale or certificate was installed or started. The source only constructs a TLS 1.3 HTTPS server with \`requestCert=true\` and \`rejectUnauthorized=true\`, validates the actual peer TLS client certificate's SHA-256 raw-leaf pin and owner-configured sender Ed25519 SPKI pin; rejects forwarded/self-asserted identity, personal data, wrong tenant/workspace/audience, expired packets, extra fields and replays. Only status/incident **nonpersonal** protocol 1.0/1.1 messages are accepted. The limited private filesystem receipt ledger uses private directory permissions, O_EXCL/O_NOFOLLOW, fsync and Ed25519-signed exact \`RECEIVED\` receipts before reporting status 202. Exact replays read the original signed ACK, mismatches reject 409; corrupt receipts deny 503. No provider dispatch, service activation, client data or recipient-side customer action.

Two separately pinned original owner/custodian Ed25519 signatures can authorize *review of* a proposed Windows worker image with exact SHA, host and expired/unexpired evidence; they **do not install or autostart** \`Rosevear-CommsHub\`. The existing \`ql340c-windows-operator.ps1 -Start\` remains supervised private TEST foreground only, never a worker or startup task. The obsolete \`Rosevear AI Server Startup\` stays disabled. No physical host, issuer, peer mTLS, durable ACK or independent audit has been actually observed. \`assessQl467OriginalHostAcceptance\` therefore stays HOLD even with synthetic tests.

**Missing owner field evidence before reboot:** physical signed Windows service/task inventory and executable/service account; rollback and boot dependency plan; original-host TLS CA/cert/issuer pin and real rotated candidate overlaps; signed host boot/run witness, independent reviewer; locally durable sink ACK actually emitted over verified mTLS; independent owner-signed receipt audit; real receiver OFF witness. Absent any, **reboot=HOLD / peer=UNVERIFIED / receiver OFF-UNKNOWN**. In the absence of independently enrolled keys, there is no safe launch command.

## UI fixes based on two supplied operator screenshots
- Replaces white journey/action cards on the dark frame with dark cards and visibly light foreground text; explicit readable small labels, selected/hover and disabled status.
- Responsive 3-to-2-to-1 step card layout and auto-fit queue; controls have 44px minimum targets and wrap long labels.
- Native date/month/time picker contrast and width constrained to viewport; responsive focus rings and reduced-motion/forced-colors accommodations.
- Adds four shared skins to the original four, using the **identical** \`rosevear.master-themes.v2\` palette ids: \`instrument\`, \`nebula\`, \`meadow\`, \`high-contrast\`, \`copper\`, \`arctic\`, \`solar\`, \`graphite\`. Theme selection is cosmetic and never toggles services, access or verification.

Theme parity across AI Hub and AI Data Platform requires **separately validated scoped release PRs** in those repositories; a Comms-only promotion does not claim they are already deployed.

## Independent gate
\`node --test runtimes/master-telemetry/ql467-private-event-sink.test.mjs\` executes synthetic positive and negative cases with **no live peer, Windows installation, real certificate or secrets**. \`scripts/ql336a-required-gates.sh\` makes QL-467 mandatory after QL-466, and preserves the SHA-256 baseline of the original 43 checks. Exact-main app, Windows owner key safety, protected audit, Cloudflare Workers build and public JS/CSS parity are all required before code-production GREEN.

**Next proposed QL-468:** Real owner-signed Windows worker installation package, independent mTLS pilot on original host, expiry-safe key rollover and owner-audited first durable ACK — only after genuine independent source authority.
