import {useState,type FormEvent} from 'react';
import {QL258_APPS,type Ql258App} from './ql258OwnerActionChecklist';
import {type Ql259Ledger} from './ql259SixAppReturnReconciliation';
import {QL261_RELEASE,QL261_GUIDES,intakeQl261Packet,runQl261OfflinePreflight,
  checkQl261PublicProofs,ql261AppHandoff,type Ql261PublicCheck}
  from './ql261SixAppPreflight';

const STATUS={
  ACCEPTED_SELF_REPORTED_HELD:'Exact sanitized owner packet recorded as an unverified self-report only.',
  REJECTED_UNSAFE_OR_INVALID_PACKET:'Rejected: supply only unmodified QL-258 sanitized JSON (no keys, names or approvals).',
  DUPLICATE_IDENTICAL_NO_CHANGE_HELD:'Same packet was already recorded. No new evidence or authorization.',
  CONFLICT_REQUIRES_CLEAR_HELD:'Conflicting packet: clear the old local receipt before importing a replacement.'
} as const;

export function Ql261SixAppPreflight(){
  const [ledger,setLedger]=useState<Ql259Ledger>({});
  const [raw,setRaw]=useState('');
  const [selected,setSelected]=useState<Ql258App>('ai-data-platform');
  const [message,setMessage]=useState('');
  const [offline,setOffline]=useState<ReturnType<typeof runQl261OfflinePreflight>|null>(null);
  const [publicResults,setPublicResults]=useState<ReadonlyArray<Ql261PublicCheck>|null>(null);
  const [publicBusy,setPublicBusy]=useState(false);
  const [publicTime,setPublicTime]=useState('');

  const report=offline??runQl261OfflinePreflight(ledger);
  const selectedReport=report.rows.find(x=>x.system===selected)!;

  function importReturn(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const result=intakeQl261Packet(ledger,raw);
    setLedger(result.ledger);setOffline(null);setRaw('');
    setMessage(STATUS[result.status]);
  }
  function runLocalTest(){
    const result=runQl261OfflinePreflight(ledger);
    setOffline(result);
    setMessage(`Offline preflight completed: ${result.validOriginalOwnerPackets}/6 schema-valid owner packets; `+
      '0 independently verified signer/proof/TEST approvals. All connections remain HELD.');
  }
  async function runPublicCheck(){
    setPublicBusy(true);setPublicResults(null);setMessage('Checking six public GitHub URLs only…');
    try{
      const result=await checkQl261PublicProofs();
      setPublicResults(result);setPublicTime(new Date().toISOString());
      setMessage('Public source check completed. An HTTP 200 is file availability ONLY, not a valid signature or permission to connect.');
    }catch{
      setMessage('Public GitHub check could not complete. No connectivity or trust is inferred.');
    }finally{setPublicBusy(false);}
  }
  async function copy(value:string,label:string){
    try{await navigator.clipboard.writeText(value);
      setMessage(`${label} copied. Public/nonsecret handoff; all security and gateway gates remain HELD.`);
    }catch{setMessage('Copy unavailable. Select the read-only text and copy manually.');}
  }
  const handoff=ql261AppHandoff(selected);
  const exportText=JSON.stringify({...report,
    publicGithubCheck:publicResults?.map(row=>({...row}))??'NOT_RUN',
    publicGithubObservedAt:publicTime||null},null,2);

  return <section className="ql245-panel" data-ql261-release={QL261_RELEASE}
    aria-labelledby="ql261-preflight-title">
    <h4 id="ql261-preflight-title">QL-261 · Six application guides, original owner packet intake and safe test (HELD)</h4>
    <p>Each companion app has its own versioned implementation guide. Paste the actual
      <strong> QL-258 sanitized JSON</strong> only after we receive it from that app.
      Neither a past narrative nor a checkbox verifies signer custody, key pins,
      isolated tenants or owner TEST approval.</p>
    <form className="ql245-form" onSubmit={importReturn}>
      <label htmlFor="ql261-owner-packet">One original QL-258 sanitized owner JSON packet
        <textarea id="ql261-owner-packet" rows={5} maxLength={12000} required
          value={raw} onChange={event=>setRaw(event.target.value)}
          placeholder="Exact QL-258 nonsecret packet only. No identity, password, private key or tenant address." />
      </label>
      <div className="ql245-actions"><button type="submit">Validate original packet · HELD</button>
        <button type="button" onClick={runLocalTest}>Run six-app offline preflight test</button>
        <button type="button" disabled={publicBusy} onClick={()=>void runPublicCheck()}>
          {publicBusy?'Checking public GitHub…':'Run six public GitHub proof GETs (read only)'}
        </button></div>
    </form>
    <p>Tests are limited to <strong>local packet/schema checks</strong> and, only when
      requested, anonymous GETs to immutable <code>raw.githubusercontent.com</code>
      source-proof paths. <strong>They never contact an app gateway</strong>, send credentials,
      run private key challenges, authorize a trial or start the Windows relay.</p>
    {message&&<p role="status" className="ql245-message">{message}</p>}
    <div className="ql245-scroll"><table>
      <caption>Six app-specific prerequisites and safe test results; HTTP 200 does not authenticate any signer.</caption>
      <thead><tr><th scope="col">App / guide</th><th scope="col">Owner packet</th>
        <th scope="col">GitHub public proof</th><th scope="col">Custody</th>
        <th scope="col">Nonproduction</th><th scope="col">Test gate</th></tr></thead>
      <tbody>{report.rows.map(row=>{
        const publicRow=publicResults?.find(item=>item.system===row.system);
        return <tr key={row.system}>
          <th scope="row">{row.name}<p><code>{row.guide}</code></p></th>
          <td>{row.packet} (reported done: {row.selfReportedCompletedSteps})</td>
          <td><strong>{publicRow?`${publicRow.result} (${publicRow.httpStatus??'network error'})`
            :row.sourceRecheck}</strong></td>
          <td>{row.signerCustody}</td><td>{row.nonproductionTenant}</td>
          <td><strong>HELD / NO NETWORK TEST</strong></td>
        </tr>;
      })}</tbody>
    </table></div>
    <p>Original owner packet receipts: <strong>{report.validOriginalOwnerPackets}/6</strong> (schema only).
      {' '}Offline tests {offline?'RUN':'NOT_RUN'}; public source checks
      {' '}{publicResults?'RUN':'NOT_RUN'}{publicTime?` at ${publicTime}`:''}.
      {' '}Authenticated custody: <strong>0/6</strong>; authenticated gateway GETs:
      <strong> 0</strong>; <strong>12/12</strong> live pilot gates HELD.</p>
    <div className="ql261-handoff-controls">
      <label htmlFor="ql261-selected-app">Choose app-specific guide and action packet
        <select id="ql261-selected-app" value={selected}
          onChange={event=>{setSelected(event.target.value as Ql258App);setMessage('');}}>
          {QL261_GUIDES.map(guide=><option key={guide.system} value={guide.system}>
            {QL258_APPS.find(app=>app.system===guide.system)?.name}</option>)}
        </select>
      </label>
      <p><strong>Next action:</strong> {selectedReport.nextAction}</p>
      <button type="button" onClick={()=>{
        setLedger(previous=>{const next={...previous};delete next[selected];return next;});
        setOffline(null);setMessage('Cleared the selected temporary owner packet only.');
      }}>Clear selected local packet</button>
      <button type="button" onClick={()=>void copy(handoff,'App-specific handoff')}>
        Copy {selectedReport.name} instructions</button>
      <textarea readOnly rows={10} value={handoff} aria-label="Selected QL-261 app-specific handoff"/>
      <button type="button" onClick={()=>void copy(exportText,'Six-app preflight result')}>
        Copy sanitized six-app test report</button>
      <textarea readOnly rows={9} value={exportText} aria-label="QL-261 sanitized six-app preflight report"/>
    </div>
    <p><strong>Integration DISCONNECTED / HOLD.</strong> Packet entries and test results
      are in-memory only and reset on refresh; copy the nonsecret report before leaving.
      No service calls, SMS, dispatch, Etsy API requests or production data changes.</p>
  </section>;
}
