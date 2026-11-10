import {useEffect,useRef,useState} from 'react';
import {QL375_HELP_LINKS,QL375_SHELLS,ownerShellStatus} from './ql375OwnerStatus';
import {MASTER_SHELL_REGISTRY,reconcileSourceIdentities} from './ql386MasterShellRegistry';
import {MASTER_ROUTING_PATTERNS,reviewRoutingDraft} from './ql387MasterShellRouting';
import {QL388_CONTRACT_VERSION,QL388_EVENT_KINDS,QL388_EXAMPLE_EVENT,reviewCrossAppIntake} from './ql388CrossAppIntake';
import {QL389_PREVIEW_STAGES} from './ql389SignedIntakePreview';
import {QL390_ILLUSTRATIVE_ROWS} from './ql390IncidentSimulationLedger';
import {QL391_ILLUSTRATIVE_TIMELINE} from './ql391IncidentCorrelationPreview';
import {QL392_DEFAULT_FILTERS,QL392_ILLUSTRATIVE_PREVIEW,reviewOperatorIncidents,type QL392Filters} from './ql392OperatorIncidentReview';
import {QL393_DEFAULT_SCENARIO,previewOperatorFollowUps} from './ql393OperatorFollowUpDrafts';
import {QL394_DEMO_HISTORY,QL394_DEMO_NOW,reviewDraftDecisionHistory} from './ql394DraftDecisionHistory';
import {compareOperatorEvidenceReviews} from './ql395EvidenceReviewComparison';
import {QL396_DEFAULT_FILTERS,QL396_DEMO_NOW,QL396_DEMO_REQUESTS,
  filterOperatorRecheckQueue,reviewOperatorRecheckQueue,type QL396QueueFilters} from './ql396OperatorRecheckQueue';
import {QL397_DEFAULT_FILTERS,QL397_DEMO_OBSERVATIONS,
  filterOperatorRecheckOutcomes,reviewOperatorRecheckOutcomes,type QL397Filters} from './ql397RecheckOutcomeHistory';
import {QL398_DEFAULT_FILTERS,QL398_DEMO_AUDIT,filterOperatorClosureReadiness,
  reviewOperatorClosureReadiness,type QL398Filters} from './ql398ClosureReadinessAudit';
import {QL399_DEFAULT_FILTERS,QL399_DEMO_EXCEPTIONS,filterOriginalEvidenceHandoffs,
  reviewOriginalEvidenceHandoff,type QL399Filters} from './ql399EvidenceHandoffReadiness';
import {QL400_DEFAULT_FILTERS,QL400_DEMO_DRAFTS,filterOperatorHandoffAssignments,
  reviewOperatorHandoffAssignments,type QL400Filters} from './ql400HandoffAssignmentPreview';
import {QL401_DEFAULT_FILTERS,QL401_DEMO_ACKNOWLEDGEMENTS,
  filterOperatorEscalationTimeline,reviewOperatorEscalationTimeline,type QL401Filters}
  from './ql401EscalationTimeline';
import {QL402_DEFAULT_FILTERS,QL402_DEMO_NOTES,filterOperatorRecoveryDecisions,
  reviewOperatorRecoveryDecisions,type QL402Filters} from './ql402RecoveryDecisionAudit';
import {ownerEntryTruth} from './ql374OwnerEntry';
import './ql375OwnerStatus.css';

type Props={truth:ReturnType<typeof ownerEntryTruth>};

/** No source API calls or tenant links: all six rows use the same honest
 * aggregate protected owner readback and an immutable public identity map. */
export function OwnerSixAppDrilldown({truth}:Props){
  const [selected,setSelected]=useState<(typeof QL375_SHELLS)[number]['id']>('yw');
  const [incidentFilters,setIncidentFilters]=useState<QL392Filters>(QL392_DEFAULT_FILTERS);
  const [followUpCorrelation,setFollowUpCorrelation]=useState('correlation-ql392-workshop');
  const [comparisonWindow,setComparisonWindow]=useState<'FIRST_SECOND'|'SECOND_THIRD'|'FIRST_THIRD'>('FIRST_SECOND');
  const [recheckFilters,setRecheckFilters]=useState<QL396QueueFilters>(QL396_DEFAULT_FILTERS);
  const [outcomeFilters,setOutcomeFilters]=useState<QL397Filters>(QL397_DEFAULT_FILTERS);
  const [closureFilters,setClosureFilters]=useState<QL398Filters>(QL398_DEFAULT_FILTERS);
  const [handoffFilters,setHandoffFilters]=useState<QL399Filters>(QL399_DEFAULT_FILTERS);
  const [assignmentFilters,setAssignmentFilters]=useState<QL400Filters>(QL400_DEFAULT_FILTERS);
  const [escalationFilters,setEscalationFilters]=useState<QL401Filters>(QL401_DEFAULT_FILTERS);
  const [recoveryFilters,setRecoveryFilters]=useState<QL402Filters>(QL402_DEFAULT_FILTERS);
  const detailHeading=useRef<HTMLHeadingElement>(null);
  const navigated=useRef(false);
  const shell=QL375_SHELLS.find(item=>item.id===selected)!;
  const status=ownerShellStatus(truth);
  const contract=MASTER_SHELL_REGISTRY.find(item=>item.id===selected)!;
  const identityClaims=reconcileSourceIdentities([]);
  const routingExample=reviewRoutingDraft({sources:['yw','icamp'],targets:['ai-data-platform'],
    shape:'many-to-one',purpose:'monitoring',tenantScope:'shell',sourceApproved:false,targetApproved:false});
  const intakeExample=reviewCrossAppIntake(QL388_EXAMPLE_EVENT);
  const operatorReview=reviewOperatorIncidents(QL392_ILLUSTRATIVE_PREVIEW,incidentFilters);
  const followUpReview=previewOperatorFollowUps(QL392_ILLUSTRATIVE_PREVIEW,followUpCorrelation,QL393_DEFAULT_SCENARIO);
  const decisionHistory=reviewDraftDecisionHistory(QL392_ILLUSTRATIVE_PREVIEW,
    'correlation-ql392-workshop',QL394_DEMO_HISTORY,QL394_DEMO_NOW);
  const [comparisonFrom,comparisonTo]=comparisonWindow==='SECOND_THIRD'?
    ['snapshot-ql394-0002','snapshot-ql394-0003']:
    comparisonWindow==='FIRST_THIRD'?['snapshot-ql394-0001','snapshot-ql394-0003']:
      ['snapshot-ql394-0001','snapshot-ql394-0002'];
  const evidenceComparison=compareOperatorEvidenceReviews(QL392_ILLUSTRATIVE_PREVIEW,
    'correlation-ql392-workshop',QL394_DEMO_HISTORY,comparisonFrom,comparisonTo,QL394_DEMO_NOW);
  const recheckQueue=reviewOperatorRecheckQueue(QL392_ILLUSTRATIVE_PREVIEW,
    QL396_DEMO_REQUESTS,QL396_DEMO_NOW);
  const visibleRechecks=filterOperatorRecheckQueue(recheckQueue,recheckFilters);
  const recheckOutcomes=reviewOperatorRecheckOutcomes(QL392_ILLUSTRATIVE_PREVIEW,
    QL396_DEMO_REQUESTS,QL397_DEMO_OBSERVATIONS,QL396_DEMO_NOW);
  const visibleOutcomes=filterOperatorRecheckOutcomes(recheckOutcomes,outcomeFilters);
  const closureReview=reviewOperatorClosureReadiness(QL392_ILLUSTRATIVE_PREVIEW,
    QL396_DEMO_REQUESTS,QL397_DEMO_OBSERVATIONS,QL398_DEMO_AUDIT,QL396_DEMO_NOW);
  const visibleClosureCases=filterOperatorClosureReadiness(closureReview,closureFilters);
  const handoffReview=reviewOriginalEvidenceHandoff(QL392_ILLUSTRATIVE_PREVIEW,
    QL396_DEMO_REQUESTS,QL397_DEMO_OBSERVATIONS,QL398_DEMO_AUDIT,
    QL399_DEMO_EXCEPTIONS,QL396_DEMO_NOW);
  const visibleHandoffCases=filterOriginalEvidenceHandoffs(handoffReview,handoffFilters);
  const assignmentReview=reviewOperatorHandoffAssignments(QL392_ILLUSTRATIVE_PREVIEW,
    QL396_DEMO_REQUESTS,QL397_DEMO_OBSERVATIONS,QL398_DEMO_AUDIT,QL399_DEMO_EXCEPTIONS,
    QL400_DEMO_DRAFTS,QL396_DEMO_NOW);
  const visibleAssignments=filterOperatorHandoffAssignments(assignmentReview,assignmentFilters);
  const escalationReview=reviewOperatorEscalationTimeline(QL392_ILLUSTRATIVE_PREVIEW,
    QL396_DEMO_REQUESTS,QL397_DEMO_OBSERVATIONS,QL398_DEMO_AUDIT,QL399_DEMO_EXCEPTIONS,
    QL400_DEMO_DRAFTS,QL401_DEMO_ACKNOWLEDGEMENTS,QL396_DEMO_NOW);
  const visibleEscalations=filterOperatorEscalationTimeline(escalationReview,escalationFilters);
  const recoveryReview=reviewOperatorRecoveryDecisions(QL392_ILLUSTRATIVE_PREVIEW,
    QL396_DEMO_REQUESTS,QL397_DEMO_OBSERVATIONS,QL398_DEMO_AUDIT,QL399_DEMO_EXCEPTIONS,
    QL400_DEMO_DRAFTS,QL401_DEMO_ACKNOWLEDGEMENTS,QL402_DEMO_NOTES,QL396_DEMO_NOW);
  const visibleRecovery=filterOperatorRecoveryDecisions(recoveryReview,recoveryFilters);

  useEffect(()=>{if(navigated.current)detailHeading.current?.focus();},[selected]);
  return <div className="ql375-drilldown">
    <p id="ql375-six-context">Six fixed platform and support identities. The protected status is an <strong>aggregate six-shell readback</strong>; it is not six independent source pings, a live connection grant or tenant access.</p>
    <section className="ql386-registry" aria-labelledby="ql386-registry-title">
      <h4 id="ql386-registry-title">Master Shell integration registry · expected contracts</h4>
      <p>Identity registry: {MASTER_SHELL_REGISTRY.length} approved shell-level sources. Independent source identity claims received here: 0. All {identityClaims.filter(item=>item.state==='MISSING').length} are awaiting claim reconciliation; no connection or enrollment is inferred from this catalogue.</p>
      <p>Source IDs, repositories and health handlers are the approved software contract; tenant businesses are not additional source identities. AI Data Platform owns module completion evidence, while Comms Hub owns authorized communications and incident routing.</p>
    </section>
    <section className="ql387-routing" aria-labelledby="ql387-routing-title">
      <h4 id="ql387-routing-title">Master Shell application routing map · design only</h4>
      <p>Four supported relationship patterns are documented below. They are <strong>not active routes</strong>. Every source, destination, purpose, tenant and owner permission must be independently authorized before any actual transport.</p>
      <table><caption>Proposed routing relationships</caption><thead><tr><th scope="col">Pattern</th><th scope="col">Expected use</th><th scope="col">Example</th></tr></thead>
        <tbody>{MASTER_ROUTING_PATTERNS.map(pattern=><tr key={pattern.shape}><th scope="row">{pattern.shape}</th><td>{pattern.label}</td><td>{pattern.example}</td></tr>)}</tbody></table>
      <p role="status">Example many-to-one monitoring proposal: <strong>{routingExample.state}</strong> — {routingExample.reason}.</p>
      <p>AI Data Platform owns module completion and health evidence; Comms Hub owns communications and operator incidents. Sample tenants, customer records and cross-business data cannot be routed by shell identity alone.</p>
    </section>
    <section className="ql388-intake" aria-labelledby="ql388-intake-title">
      <h4 id="ql388-intake-title">Cross-application notification and incident intake · contract only</h4>
      <p>V1 envelope: <code>{QL388_CONTRACT_VERSION}</code>. Kinds: {QL388_EVENT_KINDS.join(' / ')}. The envelope accepts shell-level machine event codes, correlation and idempotency IDs, and opaque evidence references—no customer text or tenant records.</p>
      <p role="status">Example contract review: <strong>{intakeExample.state}</strong> — {intakeExample.reason}.</p>
      <p>Sender authentication, owner approval, replay protection, receiver enrollment and actual incident creation remain separate. Module completion and health metrics belong to AI Data Platform.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL388_CROSS_APP_NOTIFICATION_INCIDENT_INTAKE_CONTRACT.md" target="_blank" rel="noopener noreferrer">View the shared QL-388 contract and application handoff</a>
    </section>
    <section className="ql389-intake-gate" aria-labelledby="ql389-intake-gate-title">
      <h4 id="ql389-intake-gate-title">Source-signed incident intake security gates · offline preview</h4>
      <p><strong>HOLD — no original source signature, independently approved key pin, trusted receiver or persistent replay evidence is available to this screen.</strong> The six checks below describe future intake prerequisites, not active permissions.</p>
      <ol>{QL389_PREVIEW_STAGES.map(check=><li key={check.stage}><strong>{check.stage}:</strong> {check.label}</li>)}</ol>
      <p>A synthetic scenario that passes every check is still <strong>PREVIEW_ONLY</strong>; no event is sent, accepted or stored. Separate source and master owner approval remains mandatory.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL389_SIGNED_INCIDENT_INTAKE_GATE_PREVIEW.md" target="_blank" rel="noopener noreferrer">View QL-389 signed intake and replay handoff</a>
    </section>
    <section className="ql390-simulation" aria-labelledby="ql390-simulation-title">
      <h4 id="ql390-simulation-title">Operator incident intake simulation ledger · illustrative only</h4>
      <p><strong>INERT_PREVIEW:</strong> These example rows are not actual alerts, signed receipts, connections or stored incidents. Each source has an independent deduplication scope, and rejected source claims are redacted.</p>
      <table><caption>Illustrative intake outcomes — no receiver data</caption><thead><tr>
        <th scope="col">Source</th><th scope="col">Preview result</th><th scope="col">Operator explanation</th>
      </tr></thead><tbody>{QL390_ILLUSTRATIVE_ROWS.map((row,index)=><tr key={index}>
        <th scope="row">{row.source}</th><td>{row.state}</td><td>{row.explanation}</td>
      </tr>)}</tbody></table>
      <p>Signed scenario replay checks and all operator actions remain on HOLD. The actual ledger would require a server-authorized receiver, atomic replay reservations, consent and retention policy.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL390_CROSS_APP_INTAKE_SIMULATION_LEDGER.md" target="_blank" rel="noopener noreferrer">View QL-390 simulation and operator evidence handoff</a>
    </section>
    <section className="ql391-correlation" aria-labelledby="ql391-correlation-title">
      <h4 id="ql391-correlation-title">Cross-application incident correlation and operator timeline · illustrative only</h4>
      <p><strong>INERT_PREVIEW:</strong> This two-source example shows how a shared opaque correlation ID could arrange synthetic signed events by event time. It is not a real incident, live timeline, customer association, source connection or accepted operator task.</p>
      <table><caption>Illustrative chronological review — no live source or tenant evidence</caption><thead><tr>
        <th scope="col">Synthetic time</th><th scope="col">Source</th><th scope="col">Event code</th><th scope="col">Evidence freshness</th>
      </tr></thead><tbody>{QL391_ILLUSTRATIVE_TIMELINE.map(row=><tr key={`${row.source}-${row.code}`}>
        <td>{row.occurred}</td><th scope="row">{row.source}</th><td><code>{row.code}</code></td><td>{row.freshness}</td>
      </tr>)}</tbody></table>
      <p>Evidence-age labels are <strong>simulated observations</strong> matched by source and correlation ID; the event timestamp alone never establishes evidence freshness. Missing, stale, invalid or conflicting observations remain visible as review concerns. Unverified and HELD event claims are excluded and redacted.</p>
      <p><strong>HOLD:</strong> Original source authority, persisted incident records, tenant access, alerts, acknowledgement and notification delivery are not enabled by this preview.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL391_CROSS_APP_INCIDENT_CORRELATION_TIMELINE.md" target="_blank" rel="noopener noreferrer">View QL-391 correlation, timeline and evidence freshness handoff</a>
    </section>
    <section className="ql392-operator-review" aria-labelledby="ql392-operator-review-title">
      <h4 id="ql392-operator-review-title">Operator incident review filters and source impact · synthetic preview</h4>
      <p><strong>INERT_PREVIEW:</strong> These are fixed example correlation groups, not received messages, live incidents or customer records. Priority labels are suggestions from synthetic evidence, never actual operator assignments, acknowledgements or permissions.</p>
      <div className="ql392-review-controls" aria-label="Synthetic operator review filters">
        <label htmlFor="ql392-source-filter">Source application
          <select id="ql392-source-filter" value={incidentFilters.sourceId}
            onChange={event=>setIncidentFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All six shells</option>
            {QL375_SHELLS.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql392-freshness-filter">Evidence review
          <select id="ql392-freshness-filter" value={incidentFilters.freshness}
            onChange={event=>setIncidentFilters(previous=>({...previous,freshness:event.target.value as QL392Filters['freshness']}))}>
            <option value="ALL">Any freshness</option><option value="ATTENTION">Needs evidence review</option>
            <option value="CURRENT">Current simulation only</option>
          </select>
        </label>
        <label htmlFor="ql392-priority-filter">Follow-up priority
          <select id="ql392-priority-filter" value={incidentFilters.priority}
            onChange={event=>setIncidentFilters(previous=>({...previous,priority:event.target.value as QL392Filters['priority']}))}>
            <option value="ALL">All priorities</option><option value="REVIEW_NOW">Review now</option>
            <option value="VERIFY_EVIDENCE">Verify evidence</option><option value="MONITOR_ONLY">Monitor only</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {operatorReview.groups.length} of {operatorReview.totalGroups} illustrative correlation groups; {operatorReview.attentionGroups} have simulated follow-up concerns. {operatorReview.heldUnverified} unverified synthetic claim remains excluded.</p>
      <div className="ql392-table-scroll">
        <table><caption>Filtered synthetic operator review, highest priority first</caption><thead><tr>
          <th scope="col">Correlation ID</th><th scope="col">Shell sources</th><th scope="col">Evidence</th>
          <th scope="col">Follow-up priority</th><th scope="col">Suggested review</th>
        </tr></thead><tbody>{operatorReview.groups.map(group=><tr key={group.correlationId}>
          <th scope="row"><code>{group.correlationId}</code></th><td>{group.sourceIds.join(' / ')}</td>
          <td>{group.freshness}</td><td><strong>{group.priority}</strong></td><td>{group.guidance}</td>
        </tr>)}{operatorReview.groups.length===0&&<tr><td colSpan={5}>No synthetic examples match these filters. No live source status is implied.</td></tr>}</tbody></table>
      </div>
      <div className="ql392-table-scroll">
        <table><caption>Six-source impact across all illustrative groups, before filters</caption><thead><tr>
          <th scope="col">Registered shell</th><th scope="col">Groups</th><th scope="col">Timeline entries</th>
          <th scope="col">Groups needing review</th><th scope="col">Highest suggested priority</th>
        </tr></thead><tbody>{operatorReview.impact.map(source=><tr key={source.sourceId}>
          <th scope="row">{source.name}</th><td>{source.correlatedGroups}</td><td>{source.timelineEntries}</td>
          <td>{source.attentionGroups}</td><td>{source.highestPriority}</td>
        </tr>)}</tbody></table>
      </div>
      <p><strong>HOLD:</strong> The filter cannot grant cross-app routes, view tenant records, send notifications or open an incident. Zero examples for a source does not mean that source has zero actual incidents.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL392_OPERATOR_INCIDENT_FILTERS_IMPACT_PRIORITIES.md" target="_blank" rel="noopener noreferrer">View QL-392 operator review and priority handoff</a>
    </section>
    <section className="ql393-followups" aria-labelledby="ql393-followups-title">
      <h4 id="ql393-followups-title">Operator follow-up drafts and source owner gates · offline preview</h4>
      <p><strong>HOLD — original approval is absent.</strong> Drafts are generated from fixed synthetic source evidence states. They are not emails, live evidence requests, incident tasks or communications to customers. This screen cannot sign, approve, send or persist them.</p>
      <label htmlFor="ql393-correlation-choice">Synthetic correlation to review
        <select id="ql393-correlation-choice" value={followUpCorrelation} onChange={event=>setFollowUpCorrelation(event.target.value)}>
          {operatorReview.totalGroups>0&&QL392_ILLUSTRATIVE_PREVIEW.groups.map(group=><option key={group.correlationId} value={group.correlationId}>{group.correlationId}</option>)}
        </select>
      </label>
      <p role="status" aria-live="polite">{followUpReview.drafts.length} source-scoped, non-sending draft(s) for <code>{followUpCorrelation}</code>. {followUpReview.reason}.</p>
      <div className="ql393-table-scroll"><table><caption>Source-scoped follow-up drafts with separate original-owner approval gates</caption><thead><tr>
        <th scope="col">Affected shell source</th><th scope="col">Proposed draft</th><th scope="col">Reason</th>
        <th scope="col">Approval state</th><th scope="col">Gate details</th>
      </tr></thead><tbody>{followUpReview.drafts.map(draft=><tr key={`${draft.sourceId}-${draft.kind}`}>
        <th scope="row"><code>{draft.sourceId}</code></th><td>{draft.kind}</td><td>{draft.summary}</td>
        <td><strong>{draft.gateState}</strong></td><td><details><summary>View five simulated gates</summary>
          <ul>{draft.gates.map(gate=><li key={gate.name}><strong>{gate.name}: {gate.state}</strong> — {gate.detail}</li>)}</ul>
        </details></td>
      </tr>)}{followUpReview.drafts.length===0&&<tr><td colSpan={5}>No source-scoped synthetic concern requires a draft. No live incident status is implied.</td></tr>}</tbody></table></div>
      <p>Each simulated source-owner decision, signing pin and consent must match its own source and correlation; the separate master-owner decision must match the correlation. Even five simulated passes are <strong>not permission to send</strong>. Original witness, receiver, replay and retention evidence remain required.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL393_OPERATOR_FOLLOWUP_OWNER_GATES.md" target="_blank" rel="noopener noreferrer">View QL-393 operator draft and owner gate handoff</a>
    </section>
    <section className="ql394-decision-history" aria-labelledby="ql394-history-title">
      <h4 id="ql394-history-title">Operator draft decision history, provenance and source authorization drift · offline preview</h4>
      <p><strong>{decisionHistory.state} — original owner authorization remains on HOLD.</strong> This fixed Devil n Dove workshop example compares three in-memory synthetic observations. The claimed references below are not signatures, trusted owner approvals, witness receipts or verified custody evidence.</p>
      <p role="status">{decisionHistory.history.length} simulated gate-history entries; {decisionHistory.alerts.length} review-only drift alerts. No messages, approval records or incident tasks were sent or persisted.</p>
      <div className="ql394-table-scroll"><table><caption>Chronological QL-393 synthetic owner gate decisions; references cannot establish authorization</caption>
        <thead><tr><th scope="col">Observation</th><th scope="col">Shell / correlation</th><th scope="col">Gate</th><th scope="col">Scenario decision</th><th scope="col">Claimed evidence provenance</th><th scope="col">Opaque reference</th></tr></thead>
        <tbody>{decisionHistory.history.map(entry=><tr key={`${entry.snapshotId}-${entry.sourceId}-${entry.gate}`}>
          <td><time dateTime={entry.observedAt}>{entry.observedAt}</time></td>
          <td><code>{entry.sourceId}</code> / <code>{entry.correlationId}</code></td>
          <th scope="row">{entry.gate}</th><td>{entry.decision}</td>
          <td><strong>{entry.provenance}</strong></td><td>{entry.referenceId?<code>{entry.referenceId}</code>:'Not supplied'}</td>
        </tr>)}{decisionHistory.history.length===0&&<tr><td colSpan={6}>No valid synthetic history; all authorization remains on HOLD.</td></tr>}</tbody></table></div>
      <div className="ql394-table-scroll"><table><caption>Authorization drift alerts for operator review only</caption>
        <thead><tr><th scope="col">Detected time</th><th scope="col">Source / gate</th><th scope="col">Drift</th><th scope="col">Required independent review</th></tr></thead>
        <tbody>{decisionHistory.alerts.map((alert,index)=><tr key={`${alert.code}-${alert.sourceId}-${alert.gate}-${index}`}>
          <td>{alert.observedAt}</td><th scope="row">{alert.sourceId} / {alert.gate}</th>
          <td><strong>{alert.code}</strong></td><td>{alert.detail}</td>
        </tr>)}{decisionHistory.alerts.length===0&&<tr><td colSpan={4}>No drift in these synthetic observations; this is not evidence of a healthy live authorization state.</td></tr>}</tbody></table></div>
      <p>Cross-source evidence reference reuse is also detected when different registered shell IDs claim the same reference. Missing, conflicting, invalid and stale claims cannot turn a simulated approval into a grant. Original source and master owners, server receiver, signing-pin custody, replay controls and consent must be verified independently before any action.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL394_OPERATOR_DRAFT_DECISION_HISTORY_PROVENANCE.md" target="_blank" rel="noopener noreferrer">View QL-394 decision history and authorization drift handoff</a>
    </section>
    <section className="ql395-evidence-comparison" aria-labelledby="ql395-compare-title">
      <h4 id="ql395-compare-title">Operator evidence review comparison, drift resolution guidance and owner decision continuity · offline preview</h4>
      <p><strong>{evidenceComparison.state} — every original authorization remains HOLD.</strong> Compare fixed simulated workshop observations for the same registered shell and opaque correlation. This view cannot accept an owner decision, validate a claimed signing reference or send a source recheck.</p>
      <label htmlFor="ql395-compare-window">Synthetic observation comparison
        <select id="ql395-compare-window" value={comparisonWindow}
          onChange={event=>setComparisonWindow(event.target.value as typeof comparisonWindow)}>
          <option value="FIRST_SECOND">09:00 → 09:03 — simulated grant and reference drift</option>
          <option value="SECOND_THIRD">09:03 → 09:06 — simulated gate reversals</option>
          <option value="FIRST_THIRD">09:00 → 09:06 — full history, including intermediate alerts</option>
        </select>
      </label>
      <p role="status" aria-live="polite">{evidenceComparison.changedGates} changed synthetic gate(s), {evidenceComparison.resolutions.length} open review guidance item(s), {evidenceComparison.ownerContinuity.length} original-owner continuity check(s). No approved or persisted decision exists.</p>
      <div className="ql395-table-scroll"><table><caption>Source-scoped gate comparison; observed references are not proof</caption>
        <thead><tr><th scope="col">Source / gate</th><th scope="col">Earlier scenario</th><th scope="col">Later scenario</th><th scope="col">Evidence provenance</th><th scope="col">Change</th><th scope="col">Authorization</th></tr></thead>
        <tbody>{evidenceComparison.comparisons.map(entry=><tr key={`${entry.sourceId}-${entry.gate}`}>
          <th scope="row"><code>{entry.sourceId}</code> / {entry.gate}</th>
          <td>{entry.beforeDecision}</td><td>{entry.afterDecision}</td>
          <td>{entry.beforeProvenance} → {entry.afterProvenance}</td><td><strong>{entry.kind}</strong></td>
          <td>{entry.authorization}</td>
        </tr>)}{evidenceComparison.comparisons.length===0&&<tr><td colSpan={6}>No safe comparison. Original authorization remains on HOLD.</td></tr>}</tbody></table></div>
      <div className="ql395-table-scroll"><table><caption>Open synthetic drift reviews — independent original evidence required</caption>
        <thead><tr><th scope="col">Source and gate</th><th scope="col">Drift type</th><th scope="col">Resolution guidance</th><th scope="col">Owner status</th></tr></thead>
        <tbody>{evidenceComparison.resolutions.map((item,index)=><tr key={`${item.code}-${item.sourceId}-${index}`}>
          <th scope="row">{item.sourceId} / {item.gate}</th><td>{item.code}</td>
          <td>{item.requiredReview}</td><td><strong>{item.ownerState}</strong> / {item.resolution}</td>
        </tr>)}{evidenceComparison.resolutions.length===0&&<tr><td colSpan={4}>No new scenario drift in this window; original owner evidence is still unverified.</td></tr>}</tbody></table></div>
      <div className="ql395-table-scroll"><table><caption>Separate source-owner and master-owner decision continuity — simulated states only</caption>
        <thead><tr><th scope="col">Shell owner gate</th><th scope="col">Earlier</th><th scope="col">Later</th><th scope="col">Original evidence</th><th scope="col">Continuity</th></tr></thead>
        <tbody>{evidenceComparison.ownerContinuity.map(item=><tr key={`${item.sourceId}-${item.ownerGate}`}>
          <th scope="row">{item.sourceId} / {item.ownerGate}</th><td>{item.priorScenarioDecision}</td>
          <td>{item.latestScenarioDecision}</td><td>{item.originalOwnerEvidence}</td><td><strong>{item.continuity}</strong></td>
        </tr>)}{evidenceComparison.ownerContinuity.length===0&&<tr><td colSpan={5}>No validated synthetic continuity; remain on HOLD.</td></tr>}</tbody></table></div>
      <p>The original source owner, separate master owner, signer custody, private receiver, replay protection and scoped consent require independent evidence. A comparison—or even a simulated passing gate—never renews, transfers or authorizes an approval.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL395_OPERATOR_EVIDENCE_COMPARISON_OWNER_CONTINUITY.md" target="_blank" rel="noopener noreferrer">View QL-395 comparison and decision continuity handoff</a>
    </section>
    <section className="ql396-recheck-queue" aria-labelledby="ql396-recheck-title">
      <h4 id="ql396-recheck-title">Operator evidence recheck queue, outstanding approval aging and owner escalation · offline preview</h4>
      <p><strong>{recheckQueue.state} — all original approval gates remain HOLD.</strong> This is a deterministic, non-sending queue made from three illustrative correlations covering Devil n Dove, iCamp and Rosevear AI Hub. The other registered shells are not proven incident-free by their absence here.</p>
      <p>Age counts minutes since the <strong>first synthetic observation</strong>, never the real age of an owner approval, live incident or submitted request. The illustrative thresholds are NEW (under 10 minutes), AGING (10–29 minutes) and OVERDUE (30 minutes or longer).</p>
      <div className="ql396-queue-controls" aria-label="Read-only illustrative recheck queue filters">
        <label htmlFor="ql396-source-filter">Source shell
          <select id="ql396-source-filter" value={recheckFilters.sourceId}
            onChange={event=>setRecheckFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All illustrated shells</option>
            {QL375_SHELLS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql396-age-filter">Synthetic age
          <select id="ql396-age-filter" value={recheckFilters.ageBand}
            onChange={event=>setRecheckFilters(previous=>({...previous,ageBand:event.target.value as QL396QueueFilters['ageBand']}))}>
            <option value="ALL">All age bands</option><option value="NEW">New — under 10 minutes</option>
            <option value="AGING">Aging — 10 to 29 minutes</option><option value="OVERDUE">Overdue — 30+ minutes</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {visibleRechecks.length} of {recheckQueue.items.length} illustrative gate rechecks across {recheckQueue.sourceCount} affected shells and {recheckQueue.totalGroups} correlations: {recheckQueue.overdue} overdue, {recheckQueue.aging} aging and {recheckQueue.newCount} new (before filters). No notification has been sent.</p>
      <div className="ql396-table-scroll"><table><caption>Source-scoped simulated owner and evidence recheck guidance, sorted by priority and age</caption>
        <thead><tr><th scope="col">Source / correlation</th><th scope="col">Gate / reviewer scope</th><th scope="col">Synthetic age</th><th scope="col">Evidence</th><th scope="col">Priority / drift</th><th scope="col">Next independent review</th><th scope="col">Action state</th></tr></thead>
        <tbody>{visibleRechecks.map(item=><tr key={item.queueId}>
          <th scope="row"><code>{item.sourceId}</code> / <code>{item.correlationId}</code></th>
          <td>{item.gate} / <strong>{item.ownerScope}</strong></td>
          <td>{item.syntheticAgeMinutes} minutes · <strong>{item.ageBand}</strong></td>
          <td>{item.evidenceProvenance} / {item.originalOwnerEvidence}</td>
          <td>{item.priority}{item.driftCodes.length>0?` / ${item.driftCodes.join(', ')}`:''}</td>
          <td>{item.guidance}</td><td><strong>{item.status}</strong> · no send, approval or persistence</td>
        </tr>)}{visibleRechecks.length===0&&<tr><td colSpan={7}>No illustrative recheck matches these filters. This does not prove live evidence is current or that no actual incidents exist.</td></tr>}</tbody></table></div>
      <p>Escalation text is guidance only. Source and master owners, signing-pin custodians, receiver operators and consent custodians require independently verified original evidence before any real request, approval or communication can proceed.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL396_OPERATOR_RECHECK_QUEUE_AGING_ESCALATION.md" target="_blank" rel="noopener noreferrer">View QL-396 recheck queue and owner escalation handoff</a>
    </section>
    <section className="ql397-outcome-history" aria-labelledby="ql397-outcome-title">
      <h4 id="ql397-outcome-title">Recheck outcome history, owner review state and evidence-based closure · offline preview</h4>
      <p><strong>{recheckOutcomes.state} — all closure decisions remain HOLD.</strong> This is a fixed, in-memory example of recheck notes attached to QL-396 source/correlation/gate identities. No original source-owner or master-owner review is verified, even when a simulated reference was rechecked.</p>
      <div className="ql397-outcome-controls" aria-label="Illustrative outcome history filters">
        <label htmlFor="ql397-source-filter">Source shell
          <select id="ql397-source-filter" value={outcomeFilters.sourceId}
            onChange={event=>setOutcomeFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All illustrated shells</option>
            {QL375_SHELLS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql397-review-filter">Illustrative review state
          <select id="ql397-review-filter" value={outcomeFilters.reviewState}
            onChange={event=>setOutcomeFilters(previous=>({...previous,reviewState:event.target.value as QL397Filters['reviewState']}))}>
            <option value="ALL">All review states</option>
            <option value="AWAITING_ORIGINAL_REVIEW">Awaiting original review</option>
            <option value="SCENARIO_REVIEW_NOTE_ONLY">Scenario note only</option>
            <option value="CONFLICT_REQUIRES_INDEPENDENT_REVIEW">Conflict needs independent review</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {visibleOutcomes.length} of {recheckOutcomes.gates.length} illustrative gate histories. {recheckOutcomes.observationCount} scenario observations, {recheckOutcomes.reviewedScenarios} gate(s) with notes, {recheckOutcomes.conflicts} gate(s) requiring independent conflict review; {recheckOutcomes.closureEligible} eligible for closure. No actual approval or request was made.</p>
      <div className="ql397-table-scroll"><table><caption>Chronological scenario outcomes and blocked original-owner closure</caption>
        <thead><tr><th scope="col">Shell / correlation / gate</th><th scope="col">Latest synthetic outcome</th><th scope="col">Operator review state</th><th scope="col">Source / master-owner decision</th><th scope="col">Closure guidance</th><th scope="col">History</th></tr></thead>
        <tbody>{visibleOutcomes.map(item=><tr key={item.queueId}>
          <th scope="row"><code>{item.sourceId}</code> / <code>{item.correlationId}</code> / {item.gate}</th>
          <td>{item.latestOutcome??'No simulated recheck yet'}</td><td><strong>{item.reviewState}</strong></td>
          <td>{item.sourceOwnerReview} / {item.masterOwnerReview}</td>
          <td><strong>{item.closureState}</strong> — {item.closureGuidance}</td>
          <td><details><summary>{item.outcomes.length} scenario outcome(s)</summary>
            {item.outcomes.length?<ol>{item.outcomes.map(entry=><li key={entry.observationId}>
              <time dateTime={entry.observedAt}>{entry.observedAt}</time> · {entry.outcome} · {entry.reviewerScope}
            </li>)}</ol>:<p>Awaiting original evidence; no historical recheck exists.</p>}
          </details></td>
        </tr>)}{visibleOutcomes.length===0&&<tr><td colSpan={6}>No illustrative outcome matches these filters. This says nothing about live source reviews or closure readiness.</td></tr>}</tbody></table></div>
      <details className="ql397-closure-checks"><summary>Five independent original-evidence checks required before any real closure</summary>
        <ol>{recheckOutcomes.gates[0]?.requiredIndependentChecks.map(check=><li key={check}>{check}</li>)}</ol>
      </details>
      <p><strong>HOLD:</strong> History entries and reviewer scope labels are not authenticated actions or assignments. Closure, communications, source proof acceptance, signing keys, private receiver activation, consent and persistence remain disabled until independently authorized outside this preview.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL397_OPERATOR_RECHECK_OUTCOME_HISTORY_CLOSURE.md" target="_blank" rel="noopener noreferrer">View QL-397 outcome history, owner review and closure handoff</a>
    </section>
    <section className="ql398-closure-readiness" aria-labelledby="ql398-closure-title">
      <h4 id="ql398-closure-title">Operator closure readiness, independent evidence and HOLD resolution audit · offline preview</h4>
      <p><strong>{closureReview.state} — HOLD is mandatory.</strong> This source-level closure review is illustrative and in-memory only. Neither a reviewer label nor a simulated all-clear is original signed owner consent, independent witness evidence or permission to resolve an incident.</p>
      <div className="ql398-closure-controls" aria-label="Read-only illustrative closure filters">
        <label htmlFor="ql398-source-filter">Source shell
          <select id="ql398-source-filter" value={closureFilters.sourceId}
            onChange={event=>setClosureFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All illustrated shells</option>
            {QL375_SHELLS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql398-hold-filter">Illustrative HOLD category
          <select id="ql398-hold-filter" value={closureFilters.scenarioState}
            onChange={event=>setClosureFilters(previous=>({...previous,scenarioState:event.target.value as QL398Filters['scenarioState']}))}>
            <option value="ALL">All HOLD categories</option>
            <option value="HOLD_CONFLICT_RECHECK">Synthetic conflict requires recheck</option>
            <option value="HOLD_ORIGINAL_EVIDENCE">Original evidence missing</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {visibleClosureCases.length} of {closureReview.totalCases} illustrative closure cases; {closureReview.conflictCases} with scenario conflicts, {closureReview.auditedAttempts} synthetic review/audit notes, {closureReview.eligibleClosures} eligible closures. Every original proof axis requires an independent check.</p>
      <div className="ql398-table-scroll"><table><caption>Unresolved source-scoped closure checks and synthetic HOLD resolution audit</caption>
        <thead><tr><th scope="col">Shell / correlation</th><th scope="col">Independent original evidence</th><th scope="col">Owner review and HOLD status</th><th scope="col">Closure guidance</th><th scope="col">Chronological audit</th></tr></thead>
        <tbody>{visibleClosureCases.map(item=><tr key={`${item.sourceId}/${item.correlationId}`}>
          <th scope="row"><code>{item.sourceId}</code> / <code>{item.correlationId}</code></th>
          <td><strong>{item.missingIndependentChecks} / 5 not verified</strong>
            <details><summary>Review five independent original evidence checks</summary>
              <ol>{item.checklist.map(check=><li key={check.gate}>
                <strong>{check.gate}</strong> · {check.custodian}: {check.requirement}. Scenario: {check.scenarioEvidence}; original: {check.originalEvidence}; independent reviewer: {check.independentReviewer}; satisfied: no.
              </li>)}</ol>
            </details>
          </td>
          <td><strong>{item.closureState}</strong> · {item.scenarioState}<p>Source owner: {item.sourceOwnerReview}; master owner: {item.masterOwnerReview}; reviewer separation: {item.reviewerSeparation}. Closure eligible: no.</p></td>
          <td>{item.guidance}</td>
          <td><details><summary>{item.audit.length} scenario review/audit note(s)</summary>
            {item.audit.length?<ol>{item.audit.map(note=><li key={note.auditId}>
              <time dateTime={note.observedAt}>{note.observedAt}</time> · {note.auditId} · {note.gate} · {note.intent} / {note.claimBasis} · <strong>{note.disposition}</strong>: {note.reason}
            </li>)}</ol>:<p>No simulated review attempt. Original evidence remains NOT_VERIFIED.</p>}
          </details></td>
        </tr>)}{visibleClosureCases.length===0&&<tr><td colSpan={5}>No illustrative closure case matches. This filter does not change real HOLD or original evidence state.</td></tr>}</tbody></table></div>
      <p><strong>HOLD:</strong> No closure decision, source/master owner approval, private receiver action, message, key, consent grant or audit persistence is performed. Evidence must be collected and independently verified in the original protected workflows, with tenant and source identity isolation.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL398_OPERATOR_CLOSURE_READINESS_INDEPENDENT_EVIDENCE_HOLD_AUDIT.md" target="_blank" rel="noopener noreferrer">View QL-398 closure readiness, evidence checklist and HOLD audit handoff</a>
    </section>
    <section className="ql399-evidence-handoff" aria-labelledby="ql399-handoff-title">
      <h4 id="ql399-handoff-title">Original evidence handoff readiness, independent reviewer exceptions and closure decision trace · offline preview</h4>
      <p><strong>{handoffReview.state} — original handoff BLOCKED; closure HOLD.</strong> These are source-scoped requirements and fictional exception notes, not original receipts, authenticated reviewers, signed decisions, live requests or durable audit records.</p>
      <div className="ql399-handoff-controls" aria-label="Illustrative handoff and exception filters">
        <label htmlFor="ql399-source-filter">Source shell
          <select id="ql399-source-filter" value={handoffFilters.sourceId}
            onChange={event=>setHandoffFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All illustrated shells</option>
            {QL375_SHELLS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql399-exception-filter">Illustrative reviewer exception priority
          <select id="ql399-exception-filter" value={handoffFilters.exceptionPriority}
            onChange={event=>setHandoffFilters(previous=>({...previous,exceptionPriority:event.target.value as QL399Filters['exceptionPriority']}))}>
            <option value="ALL">All source cases</option>
            <option value="REVIEW_CONFLICT">Independent conflict recheck</option>
            <option value="COLLECT_ORIGINAL">Collect original evidence</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {visibleHandoffCases.length} of {handoffReview.totalCases} source handoff cases; {handoffReview.openExceptions} open illustrative reviewer exceptions, {handoffReview.tracedDecisions} trace events, {handoffReview.readyHandoffs} ready handoffs and {handoffReview.eligibleClosures} authorized closures.</p>
      <div className="ql399-table-scroll"><table><caption>Original handoff requirements, outstanding reviewer exceptions and immutable HOLD trace</caption>
        <thead><tr><th scope="col">Source and correlation</th><th scope="col">Original handoff checklist</th><th scope="col">Independent reviewer exception queue</th><th scope="col">Decision trace</th><th scope="col">Closure and next action</th></tr></thead>
        <tbody>{visibleHandoffCases.map(item=><tr key={`${item.sourceId}/${item.correlationId}`}>
          <th scope="row"><code>{item.sourceId}</code> / <code>{item.correlationId}</code></th>
          <td><strong>{item.originalRequirementsOutstanding} original receipts outstanding</strong>
            <details><summary>View five per-gate handoff requirements</summary><ol>{item.handoff.map(check=><li key={check.gate}>
              <strong>{check.gate}</strong> · {check.custodian}: {check.requiredOriginalArtifact}. Artifact: {check.originalArtifact}; independent reviewer: {check.independentReviewer}; witness separation: {check.witnessSeparation}; ready: no.
            </li>)}</ol></details></td>
          <td><details><summary>{item.exceptions.length} unresolved synthetic reviewer exception(s)</summary>
            {item.exceptions.length?<ol>{item.exceptions.map(entry=><li key={entry.exceptionId}>
              <time dateTime={entry.observedAt}>{entry.observedAt}</time> · {entry.exceptionId} · {entry.gate} / {entry.reviewerScope} · <strong>{entry.code}</strong> / {entry.priority} · {entry.state}. {entry.guidance}
            </li>)}</ol>:<p>No simulated exception; this does not verify any original receipt.</p>}
          </details></td>
          <td><details><summary>{item.decisionTrace.length} linked HOLD trace event(s)</summary>
            {item.decisionTrace.length?<ol>{item.decisionTrace.map(event=><li key={event.traceId}>
              <time dateTime={event.observedAt}>{event.observedAt}</time> · {event.kind} / {event.originId} · {event.gate} · <strong>{event.disposition}</strong>: {event.reason}
            </li>)}</ol>:<p>No synthetic trace. Real owner decisions remain unverified.</p>}
          </details></td>
          <td><strong>{item.handoffState} / {item.closureState}</strong>
            <p>Source owner: {item.sourceOwnerDecision}; master owner: {item.masterOwnerDecision}; independent review: {item.independentReview}.</p>{item.guidance}</td>
        </tr>)}{visibleHandoffCases.length===0&&<tr><td colSpan={5}>No illustrative handoff matches these filters. All real original evidence and closure authorization remain unverified.</td></tr>}</tbody></table></div>
      <p><strong>HOLD:</strong> No document is uploaded, exception assigned, owner decision signed, source connected, message sent or incident closed. Original source and master-owner approvals, witness separation, pin custody, receiver proof, replay controls and scoped consent require independent verification outside this preview.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL399_ORIGINAL_EVIDENCE_HANDOFF_EXCEPTION_QUEUE_DECISION_TRACE.md" target="_blank" rel="noopener noreferrer">View QL-399 original evidence handoff and independent reviewer exception guidance</a>
    </section>
    <section className="ql400-assignment-preview" aria-labelledby="ql400-assignment-title">
      <h4 id="ql400-assignment-title">Operator handoff assignment, evidence freshness warnings and owner decision escalation · offline preview</h4>
      <p><strong>{assignmentReview.state} — assignment preview only; closure HOLD.</strong> These are proposed evidence-custodian <em>roles</em>, not named employees, actual assignments, live service-level deadlines or verified original owner decisions. All dates and source observations below are synthetic.</p>
      <div className="ql400-assignment-controls" aria-label="Illustrative assignment escalation filters">
        <label htmlFor="ql400-source-filter">Source shell
          <select id="ql400-source-filter" value={assignmentFilters.sourceId}
            onChange={event=>setAssignmentFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All illustrated shells</option>
            {QL375_SHELLS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql400-attention-filter">Illustrative escalation priority
          <select id="ql400-attention-filter" value={assignmentFilters.attention}
            onChange={event=>setAssignmentFilters(previous=>({...previous,attention:event.target.value as QL400Filters['attention']}))}>
            <option value="ALL">All draft handoffs</option>
            <option value="OVERDUE">Simulated review deadline elapsed</option>
            <option value="CONFLICT">Independent conflict review</option>
            <option value="COLLECT_ORIGINAL">Collect original evidence</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {visibleAssignments.length} of {assignmentReview.count} role-only drafts; {assignmentReview.overdueCount} simulated overdue reviews, {assignmentReview.staleScenarioCount} stale scenario observations and {assignmentReview.conflictCount} linked synthetic conflicts; {assignmentReview.originalDecisionsVerified} original owner decisions verified and {assignmentReview.authorizedClosures} closures authorized.</p>
      <div className="ql400-table-scroll"><table><caption>Role-only assignment drafts and non-authorizing source evidence age</caption>
        <thead><tr><th scope="col">Source and gate</th><th scope="col">Role-only draft</th><th scope="col">Evidence freshness warning</th><th scope="col">Escalation guidance</th><th scope="col">Handoff provenance</th></tr></thead>
        <tbody>{visibleAssignments.map(item=><tr key={item.assignmentId}>
          <th scope="row"><code>{item.sourceId}</code> / <code>{item.correlationId}</code> / {item.gate}</th>
          <td><strong>{item.handoffStatus}</strong><p>Intended custodian: {item.intendedRole}</p>
            <p>Drafted: <time dateTime={item.draftedAt}>{item.draftedAt}</time></p>
            <p>Illustrative review due: <time dateTime={item.reviewDueAt}>{item.reviewDueAt}</time></p></td>
          <td><strong>{item.scenarioFreshness}</strong> · {item.scenarioAgeMinutes} minutes since last synthetic evidence snapshot.
            <p>Actual original evidence freshness: <strong>{item.originalEvidenceFreshness}</strong>. A recent example is not a new signed receipt.</p></td>
          <td><strong>{item.attention}</strong> · {item.guidance}
            <p>Source owner: {item.sourceOwnerDecision}; master owner: {item.masterOwnerDecision}; independent reviewer: {item.independentReviewer}; closure: <strong>{item.closureState}</strong>.</p></td>
          <td><details><summary>{item.linkedExceptionIds.length} exception(s) and {item.linkedTraceIds.length} trace reference(s)</summary>
            <ul>{item.linkedExceptionIds.map(id=><li key={id}>Exception: <code>{id}</code></li>)}
              {item.linkedTraceIds.map(id=><li key={id}>HOLD trace: <code>{id}</code></li>)}</ul>
            <p>These are scenario references only, never authenticated approvals.</p>
          </details></td>
        </tr>)}{visibleAssignments.length===0&&<tr><td colSpan={5}>No illustrative assignment matches these filters. Real owner decisions and assignments remain unverified.</td></tr>}</tbody></table></div>
      <p><strong>HOLD:</strong> No employee is assigned, reminder or escalation sent, evidence accepted, owner signed in, receiver enrolled or incident closed. Original source/master-owner approval and separate witnessed evidence must be verified independently in protected workflows.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL400_OPERATOR_ASSIGNMENT_FRESHNESS_OWNER_ESCALATION.md" target="_blank" rel="noopener noreferrer">View QL-400 assignment preview, freshness and owner escalation handoff</a>
    </section>
    <section className="ql401-escalation-timeline" aria-labelledby="ql401-escalation-title">
      <h4 id="ql401-escalation-title">Operator escalation timeline, handoff acknowledgement preview and safe recovery · offline only</h4>
      <p><strong>{escalationReview.state} — no authenticated acknowledgement or release of HOLD.</strong> All timeline events and role-based receipt marks are illustrative. A scenario acknowledgement never proves that a named worker, source owner, master owner or witness received, accepted or signed anything.</p>
      <div className="ql401-escalation-controls" aria-label="Illustrative escalation timeline filters">
        <label htmlFor="ql401-source-filter">Source shell
          <select id="ql401-source-filter" value={escalationFilters.sourceId}
            onChange={event=>setEscalationFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All illustrated shells</option>
            {QL375_SHELLS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql401-ack-filter">Illustrative acknowledgement
          <select id="ql401-ack-filter" value={escalationFilters.acknowledgement}
            onChange={event=>setEscalationFilters(previous=>({...previous,acknowledgement:event.target.value as QL401Filters['acknowledgement']}))}>
            <option value="ALL">All storyboard handoffs</option>
            <option value="SCENARIO_ACK_ONLY">Role marked received in scenario only</option>
            <option value="NO_SCENARIO_ACK">No scenario acknowledgement mark</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {visibleEscalations.length} of {escalationReview.total} illustrative escalation timelines; {escalationReview.scenarioAcknowledged} role-only scenario acknowledgement marks, {escalationReview.notAcknowledged} without marks, {escalationReview.lateIllustrativeAcks} late example marks; {escalationReview.authorizedHandoffs} verified handoffs and {escalationReview.authorizedClosures} authorized closures.</p>
      <div className="ql401-table-scroll"><table><caption>Source-bound HOLD trace, illustrative receipt and independent recovery steps</caption>
        <thead><tr><th scope="col">Source and assignment</th><th scope="col">Handoff acknowledgement</th><th scope="col">Chronological scenario timeline</th><th scope="col">Safe recovery</th></tr></thead>
        <tbody>{visibleEscalations.map(item=><tr key={item.assignmentId}>
          <th scope="row"><code>{item.sourceId}</code> / <code>{item.correlationId}</code><p>{item.gate} / {item.intendedRole}</p><code>{item.assignmentId}</code></th>
          <td><strong>{item.acknowledgementState}</strong><p>Illustrative mark: {item.acknowledgementAt?<time dateTime={item.acknowledgementAt}>{item.acknowledgementAt}</time>:'none'}</p>
            <p>Late scenario mark: {item.lateIllustrativeAck?'yes':'no'}.</p><p>Actual original evidence: {item.originalEvidence}; source owner: {item.sourceOwnerApproval}; master owner: {item.masterOwnerApproval}; independent witness: {item.independentWitness}.</p>
            <strong>Actual handoff not accepted; closure {item.closureState}.</strong></td>
          <td><details><summary>Review {item.timeline.length} source-linked scenario events</summary><ol>{item.timeline.map(event=><li key={event.eventId}>
            <time dateTime={event.at}>{event.at}</time> · <strong>{event.kind}</strong> · <code>{event.eventId}</code>: {event.description}
          </li>)}</ol><p>No event in this timeline authenticates owner consent, an operator, or actual evidence.</p></details></td>
          <td><strong>{item.attention} / HOLD</strong><details><summary>View {item.recoverySteps.length} non-executable recovery checks</summary>
            <ol>{item.recoverySteps.map((step,index)=><li key={index}>{step}</li>)}</ol>
          </details></td>
        </tr>)}{visibleEscalations.length===0&&<tr><td colSpan={4}>No illustrative escalation matches these filters. Missing scenario marks do not prove real staff have been contacted.</td></tr>}</tbody>
      </table></div>
      <p><strong>HOLD:</strong> No assignment accepted, acknowledgement signed, message transmitted, retry scheduled, approval recorded, source connected or incident closed. Real recovery requires authenticated owner, witness, signing custody, receiver and consent verification outside this preview.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL401_ESCALATION_TIMELINE_ACKNOWLEDGEMENT_RECOVERY.md" target="_blank" rel="noopener noreferrer">View QL-401 timeline, acknowledgement and safe recovery handoff</a>
    </section>
    <section className="ql402-recovery-audit" aria-labelledby="ql402-recovery-title">
      <h4 id="ql402-recovery-title">Recovery decision review, acknowledgement drift audit and independent owner sign-off · offline preview</h4>
      <p><strong>{recoveryReview.state} — no real recovery decision or original owner sign-off.</strong> Every change below compares role-only scenario references, not source-signed acknowledgements. A missing or reappearing example reference never proves delivery, authorization, a witnessed signature or closure.</p>
      <div className="ql402-recovery-controls" aria-label="Illustrative recovery drift review filters">
        <label htmlFor="ql402-source-filter">Source shell
          <select id="ql402-source-filter" value={recoveryFilters.sourceId}
            onChange={event=>setRecoveryFilters(previous=>({...previous,sourceId:event.target.value}))}>
            <option value="ALL">All illustrated shells</option>
            {QL375_SHELLS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label htmlFor="ql402-drift-filter">Illustrative acknowledgement drift
          <select id="ql402-drift-filter" value={recoveryFilters.drift}
            onChange={event=>setRecoveryFilters(previous=>({...previous,drift:event.target.value as QL402Filters['drift']}))}>
            <option value="ALL">All scenario reviews</option>
            <option value="DRIFT_ONLY">Dropped or restored scenario reference</option>
            <option value="UNCHANGED">No scenario reference drift</option>
          </select>
        </label>
      </div>
      <p role="status" aria-live="polite">Showing {visibleRecovery.length} of {recoveryReview.total} source-scoped recovery reviews; {recoveryReview.reviewed} with scenario review notes, {recoveryReview.driftEvents} illustrative acknowledgement reference changes, {recoveryReview.awaitingOriginalSignoffs} original gate checks still outstanding, {recoveryReview.originalOwnerDecisionsVerified} verified owner decisions, {recoveryReview.authorizedClosures} authorized closures.</p>
      <div className="ql402-table-scroll"><table><caption>Recovery decision history, scenario-only drift and five independent original sign-off prerequisites</caption>
        <thead><tr><th scope="col">Source and role</th><th scope="col">Recovery decision review</th><th scope="col">Acknowledgement drift</th><th scope="col">Independent sign-off checklist</th></tr></thead>
        <tbody>{visibleRecovery.map(item=><tr key={item.assignmentId}>
          <th scope="row"><code>{item.sourceId}</code> / <code>{item.correlationId}</code>
            <p>{item.gate} / {item.reviewerRole}</p><code>{item.assignmentId}</code></th>
          <td><strong>{item.recoveryState} / {item.closureState}</strong>
            <p>Latest scenario intent: {item.latestIntent??'NONE'}. No intent can authorize a handoff.</p>
            <details><summary>{item.decisionTrace.length} HOLD-preserving decision trace(s)</summary>
              {item.decisionTrace.length?<ol>{item.decisionTrace.map(note=><li key={note.reviewId}>
                <time dateTime={note.observedAt}>{note.observedAt}</time> · <code>{note.reviewId}</code> · {note.intent} / {note.disposition}. {note.reason}
              </li>)}</ol>:<p>No scenario review note; real operator status is unknown.</p>}
            </details></td>
          <td><strong>{item.driftEvents} scenario reference change(s)</strong>
            <p>Baseline: <code>{item.baselineScenarioAcknowledgementId??'NO_SCENARIO_REFERENCE'}</code>.</p>
            <details><summary>Compare sample acknowledgement references</summary>
              {item.decisionTrace.length?<ol>{item.decisionTrace.map(note=><li key={note.reviewId}>
                <strong>{note.drift}</strong> · before: <code>{note.priorScenarioAcknowledgementId??'NONE'}</code> · after: <code>{note.referencedScenarioAcknowledgementId??'NONE'}</code>.
              </li>)}</ol>:<p>No scenario decision to compare. Actual receipt status remains unknown.</p>}
            </details></td>
          <td><strong>{item.signoffsVerified} of {item.signoffChecklist.length} original checks verified</strong>
            <p>Source owner signed: no; master owner signed: no; independent witness attested: no.</p>
            <details><summary>View separately verified original requirements</summary><ol>{item.signoffChecklist.map(check=><li key={check.gate}>
              <strong>{check.gate}</strong> / {check.custodian}: {check.requirement} · original: {check.originalReceipt}; independent witness: {check.independentWitness}; signed decision: {check.signedOriginalDecision}.
            </li>)}</ol></details>
            <strong>Original evidence unverified — HOLD.</strong></td>
        </tr>)}{visibleRecovery.length===0&&<tr><td colSpan={4}>No illustrative recovery review matches these filters. No original sign-off is inferred.</td></tr>}</tbody>
      </table></div>
      <p><strong>HOLD:</strong> No employee assigned, real acknowledgement accepted, owner signed, witness attested, message sent, retry scheduled, receiver activated, tenant data shared or incident closed. Original source/master-owner proof and independently witnessed custody must be reviewed through protected workflows.</p>
      <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL402_RECOVERY_ACKNOWLEDGEMENT_DRIFT_OWNER_SIGNOFF.md" target="_blank" rel="noopener noreferrer">View QL-402 recovery audit and independent sign-off handoff</a>
    </section>
    <div className="ql375-source-grid" aria-label="Read-only six-app source cards">
      {QL375_SHELLS.map(item=><button type="button" key={item.id}
        className={selected===item.id?'ql375-source-card ql375-active':'ql375-source-card'}
        onClick={()=>{navigated.current=true;setSelected(item.id);}}
        aria-pressed={selected===item.id} aria-controls="ql375-source-detail">
        <strong>{item.name}</strong><small>Source ID: {item.id}</small>
        <span className={`ql375-status ql375-${status.kind}`}>{status.label}</span>
      </button>)}
    </div>
    <section id="ql375-source-detail" aria-labelledby="ql375-detail-title" className="ql375-source-detail">
      <h4 tabIndex={-1} ref={detailHeading} id="ql375-detail-title">{shell.name} · source details</h4>
      <dl><div><dt>Source ID</dt><dd><code>{shell.id}</code></dd></div>
        <div><dt>Repository identity</dt><dd><code>{shell.repository}</code></dd></div>
        <div><dt>Expected health handler</dt><dd><code>{contract.handler}</code></dd></div>
        <div><dt>Registry reconciliation</dt><dd>Awaiting source identity claim · not connected by inference</dd></div>
        <div><dt>Authority boundary</dt><dd>{contract.connectionAuthority}</dd></div>
        <div><dt>Tenant boundary</dt><dd>{shell.boundary}</dd></div>
        <div><dt>Connection evidence</dt><dd>{status.label}</dd></div></dl>
      <p role={status.kind==='stop'?'alert':'status'}>{status.detail}</p>
      <p><strong>Private TEST, customer data, connection changes and source activation: not authorized.</strong></p>
      {truth.snapshotAt&&<small>Aggregate server readback at {new Date(truth.snapshotAt).toLocaleString()} · expires after two minutes</small>}
    </section>
    <nav aria-label="Safe owner help navigation" className="ql375-help">
      <h4>Safe help and next steps</h4>
      <ul>{QL375_HELP_LINKS.map(link=><li key={link.id}>
        <a href={link.href} {...(link.href.startsWith('https://')?{target:'_blank',rel:'noopener noreferrer'}:{})}>{link.label}</a>
        <small>{link.description}</small>
      </li>)}</ul>
      <p>Help links never submit enrollment, change permissions or open customer records.</p>
    </nav>
  </div>;
}
