# QL-205 — Fictional Handoff Review Desk & Response Drafts

QL-205 follows QL-204's four-company Connector Handoff Review Queue with an in-context review desk for an individual fictional inquiry. No original QL-205 scope was found in the queue, so this build supplies the next preview-only operator workflow.

## Delivered

- **Open review desk** on each allowed fictional queue item, showing its reference, source subject, and required human follow-up prompt.
- Browser-memory draft **internal note** (500 characters maximum) and **proposed reply** (800 characters maximum), editable in the current company session. Review flags and draft fields are not written to storage.
- Three interactive simulation checklist items: inspect fictional source, identify questions, identify service rules requiring verification.
- Pure readiness calculation explicitly described as **demo packet prepared — not approved or sent**; empty fields/checklist remain incomplete. A clear control removes local draft contents.
- Closing and reopening the desk retains its text only in the current organization session. Switching company unmounts the existing queue and resets the local drafts and checklist.
- A hard eligibility guard requires the exact company contract and source/reference/thread still present in the QL-204 adapter results. Cross-company, altered, and held samples are denied.
- Contextual ⓘ Help, responsive inputs, bounded text, and clear no-send/no-save notices.

## Strict boundary

The desk is a fictional rehearsal. Do not enter personal or real customer data. No actual message is sent or scheduled; no API, database, localStorage, shared tenant state, external synchronization, work order, booking, invoice, approval or assignment is created. UI selection and checked steps are not evidence of authorization. Real production handoff remains subject to private-server tenant and staff permissions, audit, privacy, consent, and owner approval.

## Acceptance

Run `npm run check`, `npm test`, `npm run build`, and `npm run pages:build` in `app/`. QL-205 tests verify strict company/sample eligibility, bounded strings, session edit/reopen/clear, no real sign-off state and brand-switch resets. Promote by PR into `dev` and `main`; require all exact-main checks green, no file diff between branches, and served Pages marker `ql205-handoff-review-desk-mock-v1`.
