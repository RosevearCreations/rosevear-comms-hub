# QL-227 — Four-company reopened recurrence owner decision aging, independent follow-up evidence reconciliation and held-release audit

## Disabled-preview scope

QL-227 extends current, locally prepared QL-226 reopening packets for Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers. The **Owner aging & independent evidence audit** workspace uses a separate company-scoped, browser-session-only synthetic QL-227 ledger. It makes no live customer/provider contact, backend mutation, authentication change, Supabase request or data migration.

## Local fictional review workflow

1. An eligible case requires a current and prepared QL-226 upstream reopening packet with at least one evidence gap. Starting a new case creates an empty QL-227 follow-up decision and evidence reconciliation ledger.
2. Each gap needs an invented independent follow-up evidence result (`EVIDENCE_STILL_OPEN_UNVERIFIED`, `SIMULATED_MATCH_UNVERIFIED` or `SIMULATED_CONFLICT_UNVERIFIED`) and an **unsent** owner follow-up decision. Even an apparent simulated source match is never actual independent verification.
3. Synthetic cycle aging starts from each gap's last fictional decision: **two** untouched cycles means due soon; **three** or more means overdue. An overdue refresh requires `REFER_INDEPENDENT_RECHECK_DRAFT`. The overdue episode stays in historical counts after refreshing the current age.
4. An inherited P0 risk, recurrence/reopening event, upstream discrepancy/overdue escalation, current fictional evidence conflict or historical overdue owner decision requires independent referral draft before local packet preparation. Invented conflicts increment once per gap and cycle even when notes are edited repeatedly.
5. Three explicitly **UNVERIFIED** checklist acknowledgements cover owner aging, independent follow-up evidence reconciliation and the unchanged held-release audit. A locally prepared packet needs all gaps classified, no overdue decisions, no missing mandatory independent referrals and the exact twelve actual QL-181 holds unchanged. A prepared packet cannot be edited or used for real release.
6. A revised QL-226 outcome or upstream evidence freezes the QL-227 record. Only a clearly confirmed **case-only reset**, from a current prepared source, can restart that review. Other cases/companies and any orphaned source-removed records remain untouched and held.
7. Redacted receipt exports are coded outcomes, synthetic ages, counters and hold states only. No private fictional notes, customer/reviewer identities or source fingerprints.

## Invariants

- Twelve QL-181 prerequisites remain `HELD_UNVERIFIED`; real conditional release is `BLOCKED`.
- Actual independent review, verified evidence, owner authorization and live pilot readiness remain **false**.
- No calls, SMS, provider dispatch, external writes, Supabase schema changes or real notifications.
- Passing software CI and Pages deployment is not permission to operate a live communication service.

## Validation

From `app/`, run `npm run check`, `npm test -- --run`, `npm run build` and `npm run pages:build`. Tests extend the synthetic QL-211→QL-226 chain and assert eligibility, isolation, aging, mandatory independent referral, once-per-cycle conflict counts, stale-source freeze/reset, PII-minimized receipts, prepared-packet locking, operator UI and release-hold continuity.

After merging to `dev` then `main`, verify exact-main GitHub CI, Pages deployment, zero `dev`/`main` file differences, and the live release marker:

`ql227-four-company-reopened-recurrence-owner-decision-aging-independent-follow-up-evidence-reconciliation-held-release-audit-disabled-preview-v1`.
