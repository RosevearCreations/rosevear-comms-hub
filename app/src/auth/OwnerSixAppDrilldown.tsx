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
import {ownerEntryTruth} from './ql374OwnerEntry';
import './ql375OwnerStatus.css';

type Props={truth:ReturnType<typeof ownerEntryTruth>};

/** No source API calls or tenant links: all six rows use the same honest
 * aggregate protected owner readback and an immutable public identity map. */
export function OwnerSixAppDrilldown({truth}:Props){
  const [selected,setSelected]=useState<(typeof QL375_SHELLS)[number]['id']>('yw');
  const [incidentFilters,setIncidentFilters]=useState<QL392Filters>(QL392_DEFAULT_FILTERS);
  const [followUpCorrelation,setFollowUpCorrelation]=useState('correlation-ql392-workshop');
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
