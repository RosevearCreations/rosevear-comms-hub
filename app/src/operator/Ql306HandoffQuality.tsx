import {useState} from 'react';
import {operatorOrganizations,type OrganizationId,type OperatorWorkspace} from './ql191Organizations';
import {ql306Audit,ql306LocalSummary,ql306Review,type Ql306LocalOutcome,type Ql306ReviewState} from './ql306HandoffQuality';
import './ql306-handoff-quality.css';

const options:readonly {value:Ql306LocalOutcome;label:string}[]=[
  {value:'not_reviewed',label:'Not reviewed'},
  {value:'needs_retest',label:'Needs local retest'},
  {value:'locally_consistent',label:'Locally consistent (not accepted)'},
  {value:'exception_noted',label:'Exception noted'}
];

export function Ql306HandoffQuality({organizationId,onSelectOrganization,onNavigate}:{organizationId:OrganizationId;onSelectOrganization:(id:OrganizationId)=>void;onNavigate:(workspace:OperatorWorkspace)=>void}){
  const [state,setState]=useState<Ql306ReviewState>({});
  const audit=ql306Audit(organizationId),summary=ql306LocalSummary(state,organizationId);
  return <section className="ql306" data-ql306-release="four-business-quality-regression-v1" aria-labelledby="ql306-title">
    <header><div><p className="ql271-eyebrow">QL-306 · Safe handoff regression</p><h3 id="ql306-title">Four-business handoff quality inspector</h3><p>Trace fictional inputs from intake, event replay and inbox through UNSENT draft, mock task and Management readback. These are checked-in example relationships, not real provider or staff outcomes.</p></div><strong>4 LANES · SYNTHETIC ONLY</strong></header>
    <p className="ql306-warning" role="note">No real customer data, external handoff, staff assignment, notification, call, dispatch or source gateway GET. A local consistency choice does not prove owner acceptance or certify a live service; all six source integrations remain DISCONNECTED / HOLD.</p>
    <div className="ql306-switcher" role="group" aria-label="Company-specific handoff review">{operatorOrganizations.map(company=><button type="button" key={company.id} aria-pressed={company.id===organizationId} onClick={()=>onSelectOrganization(company.id)}>{company.name}</button>)}</div>
    <div className="ql306-kpis"><div><small>Scenario lanes</small><strong>{audit.summary.lanes}</strong></div><div><small>Fictional source cards</small><strong>{audit.summary.fixtureQueue}</strong></div><div><small>Mock events / tasks</small><strong>{audit.summary.mockEvents} / {audit.summary.mockTasks}</strong></div><div><small>Idempotent replay</small><strong>PASS · LOCAL</strong></div><div><small>Local review</small><strong>{summary.consistent}/4 consistent</strong></div><div><small>Owner acceptance</small><strong>0 verified</strong></div></div>
    <div className="ql306-quality"><h4>{audit.company.name} · Source-linked handoff lanes</h4><p>Each lane has a source reference, explicit safe handoff destination and a local disposition. Open the existing workspace to rehearse the scenario.</p><ol>{audit.rows.map((row,index)=><li key={row.id}><div className="ql306-cardhead"><span>{String(index+1).padStart(2,'0')}</span><div><h5>{row.label}</h5><small>{row.sampleTitle}</small></div><strong>{row.incidentStatus.replaceAll('_',' ')}</strong></div><p>{row.requirement}</p><dl><div><dt>Source pin</dt><dd>{row.sourceReference}</dd></div><div><dt>Mock task</dt><dd>{row.taskReference}</dd></div><div><dt>Task snapshot</dt><dd>{row.taskSnapshot}</dd></div><div><dt>External actions</dt><dd>0 · UNSENT</dd></div></dl><div className="ql306-actions"><button type="button" onClick={()=>onNavigate(row.workspace)}>Open {row.label} workspace</button><label>Local quality disposition<select aria-label={`${row.label} quality disposition`} value={state[organizationId]?.[row.id]??'not_reviewed'} onChange={event=>setState(previous=>ql306Review(previous,organizationId,row.id,event.target.value as Ql306LocalOutcome))}>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div></li>)}</ol></div>
    <div className="ql306-foot"><h4>Cross-company regression contract</h4><p>Four distinct intake references, four company-scoped source queues, six mock events and four mock tasks per company. Source pin and task snapshot remain visible; local duplicate replay cannot create a second receipt.</p><div role="status" aria-live="polite">{summary.pending} pending · {summary.consistent} locally consistent · {summary.exceptions} local exceptions · 0 owner-verified · 0 external handoffs</div><p>Review labels are ephemeral. They do not change fixtures, source permissions, authorizations, gateway connections or the separate ACK delivery workstream.</p></div>
  </section>;
}
