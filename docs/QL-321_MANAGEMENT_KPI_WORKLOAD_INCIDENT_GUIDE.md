# QL-321 — Management Command KPI, workload and incident drill-through

## What the operator can do

Open **Management** in the Comms Hub and choose one of the four businesses. The QL-321 Management Command cockpit is the primary review surface. Its six KPI buttons open the matching source explorer lane and filter; the attention cards link to the original preview screens. The historical QL-301 incident explorer remains in an expandable source-evidence section below the cockpit.

The table has proper column and row headers, textual severity, exact fixture identifiers, company-specific owner labels, per-row source provenance and real navigation back to its relevant preview. Filtering/search changes the visible row count, and an unmatched filter offers **Reset this source view**. At narrow widths the source table scrolls inside its own labelled region; no columns are silently dropped.

## Reconciliation and provenance

These are **two separate fabricated ledgers**, not one set of real incidents and tasks:

| Ledger | Source | Initial rows per company | Valid categories |
| --- | --- | ---: | --- |
| Incident scenarios | `ql191DashboardData.ts` → `ql301ManagementDashboard.ts` | 4 | review needed, blocked handoff, checkpoint due, queued |
| Follow-up workload | `ql194WorkQueue.ts` browser-memory queue and fictional roster | 4 | 2 open, 1 waiting, 1 completed; 1 fixed overdue, 1 unassigned |
| Attention flags | Derived individually from those two sources | 3 | 2 blocked/checkpoint scenarios; 1 overdue/unassigned open task |

The four supported businesses are **Rosie Dazzlers, Devil n Dove, iCamp and Yard Workers**. All company switching uses the current shell company scope. If a sample task belongs to another business, references an unrelated fictional thread or claims a sample owner outside the current roster, the management summary fails closed. A source fixture's status or fixed age is not a live timer or authenticated event.

The initial numbers are the same for each company because the authored training examples intentionally contain the same categories; actual in-tab QL-194 task edits change Management counts when an operator visits the page again. Completed tasks are excluded from overdue/unassigned counts. The category-specific QL-301 cases are not silently joined to unrelated QL-194 tasks by approximate titles.

## Role-display and navigation boundaries

The layout profile role (`operator`, `manager` or `it_reviewer`) controls only which local drill-through links are suggested/enabled in this cockpit. It is a **visual preview preference, not authenticated identity, RBAC, consent, employment, ownership or permission enforcement**. An I.T. reviewer preview can navigate to the safe System Status and simulated event timeline without presenting an operational assignment control. No role preview can make an external or private request.

## Automated and manual acceptance

Run from `app/`:

```bash
npm run check
npx vitest run src/operator/__tests__/ql301ManagementDashboard.test.tsx src/operator/__tests__/ql321ManagementCockpit.test.tsx
npm test
npm run build
```

Run `node scripts/ql171-operator-baseline.mjs` from the repository root. Record the exact run results, PR, `main` commit and live Worker asset hashes in the QL-321 release receipt after they actually succeed.

Manual visual-review gaps still open: real owner phone/tablet/desktop screen-reader, keyboard, forced-colour and 200–400% zoom verification. No physical device pass, manager sign-off, incident closure, personnel assignment, real workforce analytics, provider connectivity or source Proof-B is asserted. All six-app integrations stay `DISCONNECTED / HOLD`; ACK Delivery Evidence stays `UNDER_REVIEW / PARKED_FOR_LATER`.
