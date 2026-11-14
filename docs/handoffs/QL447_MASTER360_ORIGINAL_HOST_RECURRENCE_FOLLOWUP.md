# Rosevear Comms Hub QL-447 — Original-Host Recurrence Incident Intake, Signed Isolation Reconfirmation & Three-Master Corrective Follow-Up Continuity

## Authority and physical safety boundary

QL-447 accepts **only** the exact QL-446 durably reopened recurrence case, not QL-446 historical stable OFF. It is an evidence and incident-continuity module; it does not connect, switch, shut down, isolate, repair, reopen a transport or close a physical receiver. All results, including a successfully admitted historical OFF/isolation report, retain:

- connection=HOLD; activationAuthorized=false; physicalReceiverCurrentlyOff=false
- receiver=UNKNOWN_REQUIRES_FRESH_INDEPENDENT_OFF; manualIsolationAndIndependentOffRequired=true
- incidentStatus=OPEN; slaveGate=HOLD_NEXT_MASTER_INTEGRATION_STAGE

Never interpret CI, signer simulation, GitHub production deployment, or a dated signed isolation report as physical proof that the original receiver is currently OFF.

## Signed original-host / independent corrective procedure

1. **Exact QL-446 source of truth.** Verify QL-446 DURABLE_QL446_RECURRENCE_REOPENING_CASE_OPEN, its original incident, protected PENDING and ESCALATION private record digests, no contradictory WATCH record, three-Master acceptance, signed recurrence or divergence classification, and still-HOLD/no activation. QL-446 case remains OPEN regardless of new observations.
2. **Protected session and keys.** Require a verified protected original Windows host session on DESKTOP-AE894KC, trusted fresh clock, independently verified QL-446 custody and eight distinct Ed25519 public pins: original Comms incident source, original Windows host, independent observer, Rosevear AI Hub, Comms Hub, AI Data Platform and two independent owner roles. Mere application-supplied flags do not prove real original-device evidence.
3. **Nonreplayable pending claim.** Accept a new scoped challenge distinct from QL-446 and a unique follow-up ID. Before calling any external adapter, create an exclusive PENDING file in a 0700 private directory using wx 0600, fsync the file and directory and read back its exact digest. Fail closed after any interrupted attempt. Never silently recycle the same incident.
4. **Original incident intake.** Call the external original Comms source and verify fresh signed OPEN_HOLD recurrence incident readback bound to the exact prior QL-446 summary digest, escalation receipt and prior classification. A missing/closed/wrong incident fails HOLD.
5. **Signed original host isolation reconfirmation.** Require original host Ed25519 signature, exact nonce, prior escalation receipt, signed source digest, original host ID, monotonic positive sequence and a fresh observation. Capture observed OFF or ON, isolation lock, lease revoked, watchdog armed and time; do not assert any field without external signed evidence.
6. **Independent receiver observation.** Require separately signed readback of OFF or ON, the same incident/nonce/prior receipt, exact digest of host signed payload, strictly higher sequence and fresh time after the host. Unavailable or invalid independent evidence is HOLD.
7. **Conservative incident classification.** Only when both report OFF and all host isolation lock, lease revocation, watchdog armed and independent isolation confirmation are signed true can the result be SIGNED_HISTORICAL_ISOLATION_RECONFIRMED_INCIDENT_OPEN. Any signed ON, disagreement, missing isolation lock, active lease or unarmed watchdog is SIGNED_ISOLATION_RECONFIRMATION_EXCEPTION_INCIDENT_OPEN; no automatic resolution is permitted. Missing or forged evidence is HOLD, not accepted reconfirmation.
8. **Three-Master corrective continuity.** Require fresh distinct pinned signatures from Rosevear AI Hub, Comms Hub and AI Data Platform binding the exact evidence digest, QL-446 escalation receipt, follow-up ID, classification, OPEN_HOLD incident and one agreed corrective decision: continue independent manual monitoring (historical signed isolation), or escalate supervised isolation exception remediation (exception).
9. **Two independent owner signatures.** Both owner roles sign exact three-Master reports digest and identical OPEN_HOLD classification/corrective decision. Any forged, duplicate, stale or dissenting signature blocks admission.
10. **Durable handoff / no retroactive closure.** Re-read prior QL-446 protected custody, pending one-use receipt, mutually exclusive result receipts and evidence freshness before exclusive fsynced RECONFIRMED or EXCEPTION receipt. Readback always describes historical evidence or still-open corrective incident, never current physical OFF or CONNECTED.

## Outcomes and tests

- DURABLE_QL447_ISOLATION_RECONFIRMATION_EVIDENCE_ONLY: historical host and independent OFF/isolation evidence, dual-owner and three-Master handoff; incident remains OPEN/HOLD.
- DURABLE_QL447_ISOLATION_EXCEPTION_CORRECTIVE_FOLLOWUP_OPEN: signed ON, divergence or isolation control issue, agreed corrective escalation; incident remains OPEN/HOLD.
- HOLD: invalid, missing, stale, interrupted or conflicting evidence/custody; manual owner-supervised recovery is required.

Test with: node --test runtimes/master-telemetry/ql447-original-host-incident-followup.test.mjs

Synthetic keys and test doubles check historical isolation, ON/divergent/lease/lock/watchdog failures, QL-446 exact prior custody, original host and observer forgery/freshness, three-Master veto, owner veto, one-use crash replay and corrupt private custody. These tests cannot confirm real original-host isolation.

Promote the two runtime files, this handoff and protected audit workflow first to dev, then through a scoped production PR based on the current main (do not merge unrelated dev history). Require green protected audit, unchanged app/Windows owner gates and completed Cloudflare Worker production deployment. Confirm exact main source and deployed JS/CSS before calling production GREEN.

**Next proposed QL-448 — Independent Corrective Remediation Receipts, Original-Host Isolation Exception Closure Preconditions & Three-Master Long-Horizon Continuity Review.**
