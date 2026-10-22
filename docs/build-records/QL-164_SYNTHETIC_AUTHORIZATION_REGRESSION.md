# QL-164 — Synthetic Hold & Owner Authorization Regression Tests

QL-163 added an independent public/synthetic follow-up boundary. QL-164 makes its fail-closed behavior automatically testable on every app CI pull request and production push.

## Test coverage

- Valid open synthetic hold remains open and never dispatchable.
- A clean zero-hold synthetic review does not become real owner authorization.
- Tampered source gate membership, blocker explanation, counts or outcome is rejected.
- Missing or duplicated hold IDs retain the original held lineage and create an integrity hold.
- Changed follow-up route, evidence requirement, closure permission or dispatch status is rejected.
- Forged owner sign-off or approval never creates a follow-up authorization.
- Every case asserts that no real owner verification, consent, transmission, export, durable audit, escalation, closure or live Phone/SMS is enabled.

Tests use deterministic in-memory fixtures with a mocked QL-162 independent replay result. Production still runs the real QL-162 review. The tests do not access Supabase, customer data, providers, local storage or the network.

`npm test` runs the QL-164 suite and is required by the `app-build` GitHub Actions job before a PR can be promoted.

## Release requirements

1. Feature PR exact-head `app-build` SUCCESS, including `npm test`, before merge to `dev`.
2. Promotion PR exact-head `app-build` SUCCESS before merge to `main`.
3. The final `main` SHA must show SUCCESS for `app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview` and `Workers Builds: rosevear-comms-hub`.

The public disabled preview and all real-life operational restrictions remain unchanged.

Next scoped build: **QL-165 — Synthetic Fixture Provenance & Version Pinning**.
