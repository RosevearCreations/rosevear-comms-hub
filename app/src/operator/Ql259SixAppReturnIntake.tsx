import { useState, type FormEvent } from 'react';
import {QL259_OBSERVED,QL259_RELEASE,intakeQl259Packet,
  ql259Portfolio,ql259SanitizedPortfolio,type Ql259Ledger}
  from './ql259SixAppReturnReconciliation';
import {QL258_APPS,type Ql258App} from './ql258OwnerActionChecklist';

const MESSAGE={
  ACCEPTED_SELF_REPORTED_HELD:'Recorded sanitized self-report only. Custody, proof and permission are not authenticated.',
  REJECTED_UNSAFE_OR_INVALID_PACKET:'Rejected. Paste only an unchanged QL-258 sanitized JSON packet, without secrets or extra fields.',
  DUPLICATE_IDENTICAL_NO_CHANGE_HELD:'Identical return already recorded. No change or new evidence.',
  CONFLICT_REQUIRES_CLEAR_HELD:'Conflicting return for this app. Clear its temporary record before importing a replacement.'
} as const;

export function Ql259SixAppReturnIntake(){
  const [ledger,setLedger]=useState<Ql259Ledger>({});
  const [raw,setRaw]=useState('');
  const [feedback,setFeedback]=useState('');
  const [clearTarget,setClearTarget]=useState<Ql258App>('ai-data-platform');
  const rows=ql259Portfolio(ledger);
  const received=rows.filter(r=>r.returnStatus!=='NOT_RECEIVED').length;
  const exportText=ql259SanitizedPortfolio(ledger);

  function importReturn(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const result=intakeQl259Packet(ledger,raw);
    setLedger(result.ledger);
    setRaw('');
    setFeedback(MESSAGE[result.status]);
  }
  async function copyPortfolio(){
    try{await navigator.clipboard.writeText(exportText);
      setFeedback('Sanitized six-app summary copied. This is not a custody or owner approval receipt.');}
    catch{setFeedback('Browser copy unavailable. Select the summary below and copy it manually.');}
  }

  return <section className="ql245-panel" data-ql259-release={QL259_RELEASE}
    aria-labelledby="ql259-return-intake-title">
    <h4 id="ql259-return-intake-title">QL-259 · Collect six owner returns and reconcile source changes (HELD)</h4>
    <p>The {QL259_OBSERVED} public GitHub check found the original signed source-proof path
      {' '}<strong>HTTP 404 across all six newer main commits</strong>. We can now import
      the <em>sanitized QL-258 JSON</em> copied from each app's setup checklist.
      Import checks the packet format only. It does not verify people, signatures,
      tenant boundaries, credentials, owner TEST permission or a real gateway.</p>
    <p><strong>{received}/6 self-reported packets received.</strong> Every source has advanced
      since the previous QL-258 snapshot; its public source proof needs independent
      re-review before any TEST-only authorization. Nothing is uploaded or saved on refresh.</p>
    <form className="ql245-form" onSubmit={importReturn}>
      <label htmlFor="ql259-return-json">Paste one exact QL-258 sanitized return packet
        <textarea id="ql259-return-json" rows={6} maxLength={12000} required
          value={raw} onChange={event=>setRaw(event.target.value)}
          placeholder="Paste QL-258 JSON only. Never paste names, private keys, tokens or customer data." />
      </label>
      <div className="ql245-actions">
        <button type="submit">Validate and record owner report · HELD</button>
      </div>
    </form>
    {feedback&&<p role="status" className="ql245-message">{feedback}</p>}
    <div className="ql245-scroll"><table>
      <caption>Import status is only local schema validation, not a signed proof or authenticated witness.</caption>
      <thead><tr><th scope="col">App</th><th scope="col">Latest main</th>
        <th scope="col">Proof</th><th scope="col">Owner return</th>
        <th scope="col">Reported done</th><th scope="col">Source review</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.repository}>
        <th scope="row">{row.name}</th>
        <td><a href={`https://github.com/RosevearCreations/${row.repository}/commit/${row.observedMainSha}`}
          target="_blank" rel="noopener noreferrer">{row.observedMainSha.slice(0,12)}</a></td>
        <td><strong>HTTP 404</strong></td><td>{row.returnStatus}</td>
        <td>{row.selfReportedDone} / unverified</td>
        <td><strong>{row.sourceRecheckRequired?'RECHECK_REQUIRED_HELD':'NO_NEW_DRIFT_OBSERVED_HELD'}</strong></td>
      </tr>)}</tbody>
    </table></div>
    <div className="ql259-clear-controls">
      <label htmlFor="ql259-clear-app">Clear a mistaken local return (does not contact the app)
        <select id="ql259-clear-app" value={clearTarget}
          onChange={event=>setClearTarget(event.target.value as Ql258App)}>
          {QL258_APPS.map(app=><option key={app.system} value={app.system}>{app.name}</option>)}
        </select>
      </label>
      <button type="button" onClick={()=>{
        setLedger(previous=>{const next={...previous};delete next[clearTarget];return next;});
        setFeedback('Cleared only the selected temporary packet. All connections remain HELD.');
      }}>Clear selected local return</button>
    </div>
    <button type="button" onClick={()=>void copyPortfolio()}>
      Copy six-app sanitized status summary
    </button>
    <label className="ql259-summary-label" htmlFor="ql259-portfolio">
      Summary for the next owner handoff (no private evidence)
      <textarea id="ql259-portfolio" readOnly rows={9} value={exportText}/>
    </label>
    <p><strong>12/12 live pilot gates remain HELD.</strong> Authentic proof A→B,
      independent pinned custodian/witness review, nonproduction tenant verification
      where required, and separately authenticated owner TEST-only permission are
      still missing. No live GETs, calls, SMS, dispatch or home relay occur here.</p>
  </section>;
}
