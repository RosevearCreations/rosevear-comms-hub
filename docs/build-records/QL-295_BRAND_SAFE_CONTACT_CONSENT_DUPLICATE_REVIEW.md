# QL-295 — Brand-Safe Contact 360, Consent Context & Duplicate Review

**Scope:** enhance the disabled-preview Contact 360 with a coherent four-business source readback: fictional linked messages, QL-294 assignments, consent precautions and non-authoritative duplicate candidate review. The six integrations remain **DISCONNECTED / HOLD**, while Six-App ACK Delivery Evidence remains **UNDER_REVIEW / PARKED_FOR_LATER**.

## Implemented interface

1. **One fictional contact workbench:** active company, source identity disclaimer, existing conversation traces, explicit channel labels and active linked work. The fourth directory metric counts only active tasks linked by canonical thread IDs inside the selected company.
2. **Assignment linkage:** seeded and session-created follow-up tasks appear alongside fictional contact context. Owner, blocked/waiting state and illustrative due windows are read from QL-294’s company-scoped queue. Buttons navigate to the exact linked sample assignment; changing a task is reflected on return. Internal-only team notes are never converted into contacts.
3. **Consent explanation:** a contact-wide posture is computed using the most restrictive linked source. Per-thread SMS/MMS/voice/email/intake source consent remains visible. Opt-out, service-only and unknown/unverified are distinct; **none** grants marketing or outbound permission. No consent write is possible.
4. **Duplicate candidate review:** four deliberately authored fictional one-per-business scenarios describe merely *possible* overlap, never a name-based algorithmic match. Reviewers may mark `needs independent check`, `not duplicate in demo` or `deferred`, entirely in React memory. There is no `confirm`, `merge`, `sync`, matching service or verified identity permission path; the confirmed match count remains zero.
5. **Safe review continuity:** local dispositions remain visible during workspace navigation inside the active business and reset upon company switch/reload. Reject fabricated candidate IDs, unknown dispositions, foreign business context and unrelated contact sources. No real owner signatures, Proof-B or contact records are inferred.
6. **Accessibility and visual integration:** existing readable Customer 360 panels now include contextual card headings, consent status lists, assignment links, duplicate review buttons with `aria-pressed`, live state, 44px targets, focus styling, responsive layouts, forced-colours and reduced-motion support.
7. **Permission-denied state:** an explicit five-capability deny-by-default banner shows 0/5 real contact read, merge, consent write, send and export capabilities. The preview neither grants an operator role nor provides a bypass.

## Nonproduction boundaries

- No real customer ingestion, enrichment, search, external account linkage, merge, identity confirmation, marketing grant, consent change, outgoing send or CRM read/write.
- No additional `localStorage`, `sessionStorage`, database, networking, telemetry, personal data export or cross-tenant aggregation. Source and review data remain local fictional fixtures and tab memory.
- Similar service topics are **not identity evidence**. Candidate review is not a signed or independent human disposition.
- QL-296 is the next planned build, not automatically authorized for booking, quoting or provider activation.

## Acceptance and release gates

- Focused QL-290–295 operator regression: `npm run verify:ql295`.
- Full application suite, TypeScript, QL-171 security baseline and production Vite build.
- Exact tested Git tree through guarded feature → `dev` → `main` merges; five successful production checks on the exact `main` code commit; public Worker JS/CSS SHA-256 identical to the tested local files.

**Release receipt:** pending verification and promotion; no GREEN assertion until the exact `main` and live Worker gates succeed.

**Completed local gates:** `verify:ql295` passed **436** focused assertions (220 QL-289; 16 QL-290; 33 QL-291; 51 QL-292; 38 QL-293; 33 QL-294; 45 QL-295/193/194/293). Full application suite passed **1,093 tests in 112 files**; TypeScript check, 10/10 QL-171 security baseline and Vite production build (491 modules) all passed. Local JS `index-Ca8tQ2IF.js` SHA-256 `35acf196cda5f4cb94c62f9abd02f509b1a3fbedd15024ddeb5b4aed5353e41d`; CSS `index-D6QbZfYj.css` SHA-256 `0a428a09c83679fdd41ca9eb72012038f8885525a78023fce647ead94c722a2d`.

**Next queued build:** QL-296 — Guided Four-Business Intake Cards & Quote Handoff Preview.
