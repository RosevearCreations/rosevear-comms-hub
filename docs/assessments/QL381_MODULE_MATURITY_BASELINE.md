# Comms Hub module maturity baseline — QL-381

**Scope:** `RosevearCreations/rosevear-comms-hub` repository only, current `dev` implementation. This is **not** a completion audit of Yard Workers, iCamp, Rosie Dazzlers, Devil n Dove, AI Data Platform or Rosevear AI Hub. A CI-green build establishes release integrity, not functional completion.

## Method and limitations

The percentages below are **provisional evidence-maturity bands**, **not measured percentages of requirements completed**. No approved, itemized acceptance-criteria denominator exists here for each requested module, and no independent mobile/tablet or live end-to-end audit was performed. Use: **0%** no direct module implementation evidenced; **25%** mock/preview or design; **50%** functional local/read-only implementation with tests, but lacking verified live workflow; **75%** protected implementation with CI or security tests but still lacking production end-to-end proof; **100%** independently production-verified workflow. **N/A** means that the business function should be measured in the owning child application, not Comms Hub. Treat these as planning signals, not contractual completion claims.

| Module / channel | Maturity band | Scope and evidence |
| --- | ---: | --- |
| Customer experience — desktop | 25% | Client journey and consent previews under `runtimes/client-portal/`, `app/src/operator/`; live customer sign-in/transaction not proven |
| Customer experience — mobile | 25% | Responsive preview, no device acceptance proof |
| Customer experience — tablet | 25% | Responsive preview, no device acceptance proof |
| Project tracking | 25% | Operator follow-up tasks are not full project work orders (`Ql194FollowUpQueue.tsx`, `Ql197TaskCalendar.tsx`) |
| Social integration | 25% | Provider/channel review surfaces; connected live social publishing/replies not proven |
| Worker experience — mobile / desktop / tablet | N/A | Worker job execution is owned by child applications; Comms Hub has operator workflows, not field-worker product UIs |
| Admin experience — desktop | 50% | Master/operator control, owner status and management screens (`MasterOperatorEntry.tsx`, `Ql301ManagementDashboard.tsx`, `Ql331MasterControl.tsx`) |
| Admin experience — mobile / tablet | 25% | UI exists, but independent device accessibility and workflow acceptance not proven |
| Job preparation and tracking | 25% | Inquiry/handoff previews; no verified dispatch or field-job lifecycle (`Ql203YwServiceInquiry.tsx`) |
| Payroll | N/A | Child business HR/payroll responsibility; no Comms Hub payroll engine |
| Invoicing | N/A | Child business billing responsibility; no live Comms Hub invoice processor |
| Accounting | N/A | Child business ledger responsibility; Comms Hub analytics are not bookkeeping |
| Taxation | N/A | Child business tax responsibility; no tax engine |
| Rosevear application integration | 50% | Six-app status, connectors, shell handoff and relay gates exist; independent original-source live proof remains a separate control (`Ql349ConnectionControlCenter.tsx`, `Ql335ShellReadiness.tsx`, `runtimes/hub-relay/`) |
| Storefront | N/A | Devil n Dove and other child apps own storefront transactions |
| Inventory, supplies, tools, end products | N/A | Child business inventory/production functions, not Comms Hub stock ledgers |
| Job financial tracking | N/A | Child business cost/profit modules, not Comms Hub job accounting |
| Security and owner authentication | 75% | Role/MFA, private receiver and Windows safety CI; original-device activation proof is not equivalent to CI (`app/src/auth/`, `runtimes/hub-relay/`) |
| Advertising | 0% | No Comms Hub campaign execution module verified |
| IT full integration dashboard | 50% | System-health, diagnostics, connection catalogue and operator cockpit available; live end-to-end six-app monitoring not independently certified (`Ql323SystemHealth.tsx`, `Ql348DiagnosticsPanel.tsx`) |
| Communications inbox and follow-up | 50% | Unified inbox, customer context, follow-up queue and timeline implemented; live multi-provider messaging not certified (`Ql192UnifiedInbox.tsx`, `Ql193Customer360.tsx`, `Ql194FollowUpQueue.tsx`) |
| Phone/SMS and IVR | 25% | Provider cost, phone desk and safe gateway preview; live telephony not established (`Ql195PhoneDesk.tsx`, `Ql208GatewaySandbox.tsx`) |
| Reporting, statistics and analytics | 50% | Read-only operator reports, dashboards and statistics (`Ql198Reports.tsx`, `Ql302StatisticsTrend.tsx`) |
| Consent, privacy and tenant boundaries | 50% | Role/consent previews and policy gates; real multi-tenant production acceptance not audited (`runtimes/client-portal/`, `app/src/auth/`) |
| Backup, disaster recovery and availability | 25% | Local repository/export and operational proof concepts; live recovery test and SLA not verified (`app/src/storage/localRepository.ts`, `runtimes/hub-relay/`) |
| Accessibility | 50% | QL-377–381 keyboard, focus and review tests; full device and assistive-tech audit still needed |
| CI/CD release integrity | 75% | QL-336A protected gates, Windows safety, disabled preview and public asset parity; release-green is not business go-live |

## Production configuration and known limits

`app/.env.production` explicitly sets `VITE_ENABLE_SUPABASE_CLIENT=false` and `VITE_ENABLE_HOSTED_DATABASE=false`. Multiple connector screens explicitly identify synthetic previews or disconnected workflows. Therefore a screen, test, or signed handoff document must **not** be counted as a genuine live customer, payroll, payment, inventory or source connection. Operational and economic workflows require their own original-host verification.

## What is needed for true completion percentages

1. Approve acceptance criteria per module, separated by roles and mobile/desktop/tablet.
2. Inventory features across **all six app repositories**, not Comms Hub alone.
3. Map each criterion to implemented code, automated test, live integration evidence and user acceptance signoff.
4. Compute `accepted criteria / total required criteria × 100` with explicit weights and dates.
5. Track independently: functional completion, test coverage, integration, security, UX/accessibility and production readiness. Preserve **unknown** for untested claims.

This file is a dated planning baseline, not the official system-wide percentage of completion.
