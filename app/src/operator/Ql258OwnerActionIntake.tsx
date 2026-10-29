import { useState } from 'react';
import { QL258_APPS, QL258_OBSERVED, QL258_PROOF_PATH, QL258_RELEASE,
  QL258_STEPS, newQl258Ledger, ql258SanitizedHandoff, updateQl258Step,
  type Ql258App, type Ql258Progress } from './ql258OwnerActionChecklist';

const PROGRESS:ReadonlyArray<{value:Ql258Progress,label:string}>=[
  {value:'NOT_REPORTED',label:'Not started / not reported'},
  {value:'OWNER_REPORTS_IN_PROGRESS',label:'We are working on it (unverified)'},
  {value:'OWNER_REPORTS_DONE_NOT_VERIFIED',label:'We say done (still unverified)'}
];

export function Ql258OwnerActionIntake(){
  const [selected,setSelected]=useState<Ql258App>('ai-data-platform');
  const [ledger,setLedger]=useState(newQl258Ledger);
  const [copyStatus,setCopyStatus]=useState('');
  const app=QL258_APPS.find(row=>row.system===selected)!;
  const report=ledger[selected];
  const handoff=ql258SanitizedHandoff(selected,report);
  const completed=QL258_STEPS.filter(step=>report[step.key]==='OWNER_REPORTS_DONE_NOT_VERIFIED').length;

  async function copyHandoff(){
    try{
      await navigator.clipboard.writeText(handoff);
      setCopyStatus(`${app.name} handoff copied; owner reports are not verified proof.`);
    }catch{
      setCopyStatus('Browser copy is unavailable. Select and copy the text below manually.');
    }
  }

  return <section className="ql245-panel" data-ql258-release={QL258_RELEASE}
    aria-labelledby="ql258-owner-action-title">
    <h4 id="ql258-owner-action-title">QL-258 · Six-app owner setup checklist and safe return packet (HELD)</h4>
    <p>A new <strong>public GitHub-only</strong> check on {QL258_OBSERVED} found
      {' '}<code>{QL258_PROOF_PATH}</code> missing (HTTP 404) at all six immutable
      {' '}<code>main</code> snapshots below. Application deployments may be GREEN,
      but source-proof publication is a different gate.</p>
    <div className="ql245-scroll"><table>
      <caption>New dated source snapshot; these links do not run a gateway or key request.</caption>
      <thead><tr><th scope="col">Application</th><th scope="col">Observed main</th>
        <th scope="col">Signed source proof</th></tr></thead>
      <tbody>{QL258_APPS.map(item=><tr key={item.repository}>
        <th scope="row">{item.name}</th>
        <td><a target="_blank" rel="noopener noreferrer"
          href={`https://github.com/RosevearCreations/${item.repository}/commit/${item.mainSha}`}>
          {item.mainSha.slice(0,12)}</a></td>
        <td><strong>HTTP 404 / HELD</strong></td>
      </tr>)}</tbody>
    </table></div>
    <p>This worksheet records only <strong>what we report doing</strong>. It cannot verify
      a person's identity, a private-key store, a fingerprint, a tenant, or a signed proof.
      No names, passwords, tokens, private addresses or credentials are requested.
      Entries stay in this page's temporary memory until refresh; the app sends nothing.</p>
    <div className="ql258-owner-controls">
      <label htmlFor="ql258-app">Choose one application
        <select id="ql258-app" value={selected} onChange={event=>{
          setSelected(event.target.value as Ql258App);setCopyStatus('');
        }}>
          {QL258_APPS.map(item=><option key={item.system} value={item.system}>{item.name}</option>)}
        </select>
      </label>
      <p role="status">{app.name} · {completed} owner-reported done (not independently verified).
        {' '}Connection: <strong>DISCONNECTED</strong>; TEST-only authorization: <strong>NOT_GIVEN</strong>.</p>
      <div className="ql258-owner-grid">{QL258_STEPS.map(step=>{
        const disabled=step.key==='tenantIsolation'&&!app.tenantIsolationRequired;
        return <label key={step.key} htmlFor={`ql258-${step.key}`}>
          <strong>{step.label}</strong><small>{step.hint}</small>
          <select id={`ql258-${step.key}`} value={report[step.key]}
            disabled={disabled} onChange={event=>{
              setLedger(previous=>updateQl258Step(previous,selected,step.key,
                event.target.value as Ql258Progress));setCopyStatus('');
            }}>
            {disabled?<option value="NOT_APPLICABLE">Not applicable to this app</option>:
              PROGRESS.map(item=><option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </label>;
      })}</div>
      <div className="ql245-actions">
        <button type="button" onClick={()=>void copyHandoff()}>Copy sanitized {app.name} handoff</button>
        <button type="button" onClick={()=>{
          const clean=newQl258Ledger();
          setLedger(previous=>({...previous,[selected]:clean[selected]}));
          setCopyStatus('Selected app report reset; no external record was changed.');
        }}>Reset selected app</button>
      </div>
      {copyStatus&&<p role="status" className="ql245-message">{copyStatus}</p>}
      <label htmlFor="ql258-handoff">Nonsecret app-specific return packet (copy and forward after review)
        <textarea id="ql258-handoff" readOnly rows={11} value={handoff}/>
      </label>
    </div>
    <p><strong>Next real action:</strong> appoint roles and choose private key hosts outside
      this browser; have each source app return genuine signed source A→B, independently
      witnessed pin/custody evidence, and separately authenticated owner TEST-only permission
      before any bounded nonproduction GET. <strong>No live pilot or calls/SMS.</strong></p>
  </section>;
}
