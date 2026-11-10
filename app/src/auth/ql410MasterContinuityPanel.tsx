import {QL375_SHELLS} from './ql375OwnerStatus';
import {QL409_DEMO_CAPTURED,QL409_DEMO_EVENTS,reviewQl409AuditDecisions} from './ql409AuditDecisionReview';
import {buildQl410DecisionExport,reviewQl410HostObservation} from './ql410MasterContinuity';
import type {QL405SourceId} from './ql405AcknowledgementLedger';

export default function QL410MasterContinuityPanel({sourceId}:{sourceId:QL405SourceId}){
  const now=Date.now();
  const records=QL409_DEMO_EVENTS.filter(item=>item.sourceId===sourceId);
  const review=reviewQl409AuditDecisions(sourceId,records,now);
  const observation=reviewQl410HostObservation(sourceId,null,now);
  const shell=QL375_SHELLS.find(item=>item.id===sourceId);
  const download=()=>{
    const exportData=buildQl410DecisionExport(sourceId,records,Date.now(),QL409_DEMO_CAPTURED);
    const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download=`ql410-${sourceId}-demonstration.json`;
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  };
  return <section className="ql410-master-review" aria-labelledby="ql410-title">
    <h4 id="ql410-title">QL-410 · Owner continuity and Master Shell monitoring</h4>
    <p><strong>Receiver OFF · HOLD.</strong> {shell?.name}: export and operator follow-up are illustrative only. No original receipt or private audit record is present.</p>
    <button type="button" onClick={download}>Download source-scoped demo JSON</button>
    <p role="status">Ree server <strong>DESKTOP-AE894KC</strong> · Uptime <strong>{observation.status}</strong> · Connection HOLD · No authenticated live host observation.</p>
    <div className="ql410-scroll"><table><caption>Owner exception continuity · demonstration</caption>
      <thead><tr><th scope="col">Case</th><th scope="col">Next owner action</th><th scope="col">Route</th></tr></thead>
      <tbody>{review.worklist.map(item=><tr key={item.eventId}><th scope="row">{item.caseId}</th>
        <td>{item.priority}</td><td>{item.route}</td></tr>)}
        {!review.worklist.length&&<tr><td colSpan={3}>No demo cases. Original evidence still requires independent review.</td></tr>}</tbody>
    </table></div>
    <p><strong>Master roles:</strong> AI Data Platform owns uptime trends, validation and intelligence; Comms Hub owns operator exceptions, notifications and recovery; Rosevear AI Hub on Ree's original Windows machine is the local observer and automation host. This UI does not install a scheduler, poll sources or mark a peer CONNECTED.</p>
    <p>Receiver-OFF recovery: confirm the original Windows observation and service state; independently review failures and evidence freshness; keep owner authorization, signatures and one-TEST ceremony separate.</p>
    <a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL410_MASTER_MONITORING_EXPORT_RECOVERY.md" target="_blank" rel="noopener noreferrer">QL-410 owner and Master Shell handoff</a>
  </section>;
}
