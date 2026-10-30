import {useState} from 'react';
import {QL265_SOURCE_APPS,ql265RunLocalSixAppPreflight} from './ql265LocalSixAppPreflight';

export function Ql265LocalSixAppPreflight(){
  const [report,setReport]=useState<ReturnType<typeof ql265RunLocalSixAppPreflight>|null>(null);
  return <section className="ql245-panel" aria-labelledby="ql265-title" data-ql265-mode="local-only">
    <h4 id="ql265-title">QL-265 · Six-app Comms Hub connections & local end-to-end contract check</h4>
    <p>Each source application has an I.T. or Connections interface with its own
      zero-network preflight. Open the application, navigate to the route below and
      use its <strong>Run local</strong> button. These screens show requirements;
      they never ask us to paste a token or enable production.</p>
    <div className="ql245-scroll"><table><thead><tr>
      <th scope="col">Source application</th><th scope="col">Where to open the connection screen</th>
      <th scope="col">GitHub source</th></tr></thead>
      <tbody>{QL265_SOURCE_APPS.map(source=><tr key={source.id}>
        <th scope="row">{source.id}</th><td><code>{source.ui}</code></td>
        <td><a href={`https://github.com/RosevearCreations/${source.repo}`}
          target="_blank" rel="noopener noreferrer">Open repository</a></td>
      </tr>)}</tbody></table></div>
    <p><strong>Local test:</strong> 2 synthetic read-only approvals and 7 denial
      scenarios per app (54 total). The test is pure in-memory logic; no actual
      HTTP request, private receipt, database access or signer validation occurs.</p>
    <button type="button" onClick={()=>setReport(ql265RunLocalSixAppPreflight())}>
      Run six-app LOCAL contract simulation (zero network)
    </button>
    {report&&<><p role="status"><strong>{report.localContractPass?'LOCAL CONTRACT PASS':'LOCAL CONTRACT FAIL'}</strong>
      {' '}· {report.scenarioCount} synthetic scenarios · {report.networkRequests} network requests.
      Actual connection: <strong>{report.remoteConnection}</strong>.</p>
      <textarea readOnly rows={12} aria-label="QL-265 synthetic six-app local test receipt"
        value={JSON.stringify(report,null,2)}/></>}
    <p>Do not interpret local PASS, successful software CI or public HTTP 200
      as proof of the real signing key, a distinct private witness, an isolated
      test tenant or owner TEST-only authorization. All 12 live-pilot holds stay in place.
      No live calls, SMS, customer records, payments, home network, relay or
      authenticated gateway GET is activated.</p>
  </section>;
}
