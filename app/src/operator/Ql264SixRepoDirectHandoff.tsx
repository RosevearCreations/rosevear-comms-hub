import {useState} from 'react';
import {QL264_RELEASE,QL264_GUIDE_PATH,QL264_TEST_SLOT,
  ql264SixAppCoordinationReport} from './ql264SixRepoDirectHandoff';

export function Ql264SixRepoDirectHandoff(){
  const [reviewed,setReviewed]=useState(false);
  const [message,setMessage]=useState('');
  const report=ql264SixAppCoordinationReport();
  const output=JSON.stringify({...report,conditionalSlotReview:
    reviewed?'OFFLINE_REVIEWED_NOT_AUTHORIZED':'NOT_REVIEWED'},null,2);
  async function copyReport(){
    try{await navigator.clipboard.writeText(output);
      setMessage('Sanitized QL-264 report copied. Private role and TEST authorization remain unverified.');
    }catch{setMessage('Clipboard unavailable; select and copy the read-only report below.');}
  }
  return <section className="ql245-panel" data-ql264-release={QL264_RELEASE}
    aria-labelledby="ql264-title">
    <h4 id="ql264-title">QL-264 · Six GitHub source-app handoffs, original private proof and conditional GET-only TEST review (HELD)</h4>
    <p>We placed the source-specific connection instructions directly in the six companion
      GitHub repositories. Follow each repository link below. This is a documentation
      handoff, <strong>not a deployed connector, signer, private approval or authenticated test</strong>.
      AI Data Platform is the proposed gateway; Comms Hub remains the coordinator.</p>
    <div className="ql245-scroll"><table>
      <caption>Historical 29 October public proof observations before QL-264 documentation commits; verify new main SHAs independently.</caption>
      <thead><tr><th scope="col">Source</th><th scope="col">Repo-local QL-264 guide</th>
        <th scope="col">Historical proof</th><th scope="col">Next private blocker</th></tr></thead>
      <tbody>{report.rows.map(row=><tr key={row.system}>
        <th scope="row">{row.name}</th>
        <td><a href={row.directGitHubGuide} rel="noopener noreferrer" target="_blank">
          Open source-repo handoff</a><p><code>{QL264_GUIDE_PATH}</code></p></td>
        <td><code>{row.historicalPreHandoffMainSha.slice(0,12)}</code><p>
          {row.originalProofAtHistoricalSha}</p></td>
        <td>{row.sourceSpecificAction}</td>
      </tr>)}</tbody>
    </table></div>
    <p><strong>Real receipts:</strong> One original nonsecret Rosie owner-status packet,
      zero independently authenticated private custody decisions, zero verified signed
      source A→proof B, zero verified nonproduction tenant approvals, zero owner TEST
      authorizations and <strong>zero authenticated gateway GETs</strong>.</p>
    <p>Conditional future slot: <strong>{QL264_TEST_SLOT.testSlot}</strong>. Only after
      actual separate private review and owner TEST authorization may a later operator
      consider at most <strong>nine read-only GETs per app in fifteen minutes</strong>:
      two positive health/capabilities GETs and seven required denials. No credentials,
      endpoints, time, connection, relay or rollback execution is configured by this screen.</p>
    <button type="button" onClick={()=>{
      setReviewed(true);setMessage('Reviewed the proposal offline. No TEST authorization or GET was granted.');
    }}>Review conditional TEST slot offline · remain HELD</button>
    <button type="button" onClick={()=>void copyReport()}>Copy six-app QL-264 sanitized coordination report</button>
    {message&&<p role="status" className="ql245-message">{message}</p>}
    <textarea readOnly value={output} rows={9} aria-label="QL-264 six-source coordination report" />
    <p><strong>DISCONNECTED / HOLD · 12/12 live pilot prerequisites HELD.</strong>
      No calls, SMS, payments, booking writes, provider posts, home-network access,
      private relay, privileged data access or authenticated GETs can run here.</p>
  </section>;
}
