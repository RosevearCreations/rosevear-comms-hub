# QL-182 — Synthetic operator acceptance and next-batch handoff

**Release state:** QL-182 implementation candidate; exact-main GREEN and Pages asset publication must be verified separately before this document's queue closure condition is satisfied.

**Scope:** The disabled public preview at `https://rosevearcreations.github.io/rosevear-comms-hub/`. No customer data, Supabase writes, phone number provisioning, calling, SMS/MMS, voice recording, carrier forwarding, live webhooks, or owner approvals.

## Reproducible cross-brand operator acceptance

In **Operator workspace → Safety & hold review**, open **QL-182 Synthetic operator journey acceptance**. Choose Rosie Dazzlers or Devil n Dove from the operator sidebar. Try the checked-in inbound voice and inbound SMS cases for each. All checks run in memory from the pinned `QL-173` synthetic snapshot.

| Checkpoint | Source module | Acceptance contract | Live boundary |
| --- | --- | --- | --- |
| Event | QL-173 + QL-179 | Pinned same-brand source ID, exact mock event schema and in-memory transport | Not a real provider webhook/signature |
| Inbox / triage | QL-174 | Same conversation appears in brand-scoped, open triage | Never changes a live queue |
| Contact / consent | QL-175 | Linked synthetic contact and conversation; consent never a verified grant | All dispatch denied |
| Timeline | QL-176 | Linked conversation events with safe delivery-state projections | No actual delivered outbound event |
| Draft | QL-176 | Safe constant sample reply staged as `UNSENT_SIMULATED` | No send or persistence |
| Intake / quote | QL-177 | Each brand uses its own required template, staged for **internal review** | No quote, price, booking or order |
| Task / follow-up | QL-178 | Linked task becomes `waiting_on_information` through memory-only replay | No reminder, approval or escalation |
| Voice routing | QL-180 | Matched business line resolves to `ROUTED_MOCK`; SMS marked N/A | No call, DTMF or transfer |
| Receipt | QL-179 | One `ACCEPTED_MOCK` receipt feeds matching conversation/task; duplicate ignored | No callback or external request |
| Privacy hold | QL-181 | All 12 prerequisites remain `HELD_UNVERIFIED` even for illustrative owner role | 0 live capability; 0 owner approvals |

The acceptance function rejects mismatched brands, invalid fixtures, modified mock events, unverified source versions, missing cross-module links, or a failed pilot gate. The result always reports **0 live calls, 0 messages sent, 0 external writes, 0 approvals**. The preview must not claim to be a real end-to-end integration test.

## Release and accessibility evidence

The release operator must run `npm run check`, `npm test`, `npm run build`, and `npm run pages:build` inside `app`, plus the baseline/receipt guardrails: `node scripts/ql171-operator-baseline.mjs`, `node --test scripts/__tests__/ql171-operator-baseline.test.mjs`, `node scripts/__tests__/ql170-release-receipt.test.mjs`. Review mobile layout, keyboard focus, semantic button/label controls and per-brand page remount. The test suite covers full voice/SMS journeys, copy-and-replay determinism, cross-brand rejection, tamper rejection, no storage/network writes, scenario selection and step navigation.

**Exact SHA gate:** Merge reviewed feature → `dev` → `main` in order. On the newly produced main SHA, verify the five required named checks (`app-build`, `Build disabled preview`, `Deploy disabled preview`, `Supabase Preview`, `Workers Builds: rosevear-comms-hub`) all complete successfully. Verify the GitHub Pages HTML and its new compiled JS asset are reachable and contain `ql182-synthetic-journey-acceptance-v1`. Only then is **QL-171–182 = 12/12 GREEN**. Do not confuse CI success or preview publication with permission to start a live pilot.

## Queue closure math

| Batch | Number | State |
| --- | ---: | --- |
| QL-171–181 | 11 | Exact-main GREEN established, latest QL-181 main `a3573f7deef71c7777944ee681fb220705151cb7` |
| QL-182 | 1 | Release candidate, pending its own exact-main and published asset verification |
| Remaining numbered QL-171–182 builds **after** QL-182 GREEN | **0** | Batch complete; new backlog requires separate selection |
| QL-181 prerequisites for a real live pilot | **12** | Held, unrelated to numbered-batch closure |

## Proposed next development batch (not yet authorized)

| Proposal | Safe next scope / acceptance focus |
| --- | --- |
| QL-183 — Operator Usability Acceptance | Keyboard, screen-reader and mobile walkthrough; synthetic training feedback only |
| QL-184 — Brand Workspace Permission Mapping | Independently reviewed least-privilege role/data boundary architecture; no server grants |
| QL-185 — Private Data Minimization & Retention Blueprint | Map QL-004 browser-local storage risks, delete/export policy, threat model and staged alternatives |
| QL-186 — Consent & Message Classification Specification | Transactional vs commercial messaging and auditable opt-out evidence requirements; no sends |
| QL-187 — Provider Decision & Cost Model | Compare phone/SMS options, Bell Fibe and cell constraints, owner budget; no accounts ordered |
| QL-188 — Server Auth, Webhook & Replay Test Harness | Isolated non-production signature and replay negative tests after provider choice; no live endpoints |
| QL-189 — Operations Safety Controls | Rate limiting, cost guardrails, incident stop/rollback plan, observability design |
| QL-190 — Independent Pre-Pilot Review Packet | Gather external owner/security/privacy checklist; explicitly separate pilot authorization decision |

None of QL-183–190 is automatically approved or built by QL-182. Live pilot requires separate owner decisions, legal/privacy review where applicable, real role/RLS acceptance, provider account authorization, budget and rollback agreement.
