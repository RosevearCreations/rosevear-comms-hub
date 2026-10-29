import { useState } from 'react';
import {QL260_RELEASE,QL260_OBSERVED,QL260_SOURCE_REPORTS,
  inspectQl260Narratives,ql260AppHandoff,ql260SanitizedPortfolio,
  type Ql260System} from './ql260NarrativeReturnTriage';

export function Ql260NarrativeTriage(){
  const [selected,setSelected]=useState<Ql260System>('ai-data-platform');
  const [copyMessage,setCopyMessage]=useState('');
  const review=inspectQl260Narratives();
  const current=QL260_SOURCE_REPORTS.find(row=>row.system===selected)!;
  const handoff=ql260AppHandoff(selected);

  async function copy(text:string,label:string){
    try{await navigator.clipboard.writeText(text);
      setCopyMessage(`${label} copied. This is not a verified signature or TEST authorization.`);}
    catch{setCopyMessage('Browser copy unavailable. Select the text below and copy it manually.');}
  }

  return <section className="ql245-panel" data-ql260-release={QL260_RELEASE}
    aria-labelledby="ql260-five-replies-title">
    <h4 id="ql260-five-replies-title">QL-260 · Real five-app return triage and next owner actions (HELD)</h4>
    <p>We received <strong>{review.narrativeReplies}/6 narrative updates</strong> in the
      owner's handoff, but <strong>0/6 actual QL-258 sanitized owner-status JSON packets</strong>.
      Rosie Dazzlers' response concerns booking functionality; iCamp has no new reply
      in this handoff. A narrative or GREEN production build is not signer evidence.</p>
    <p>New public GitHub-only source check on <strong>{QL260_OBSERVED}</strong>:
      the original <code>docs/integration/ql246-source-proof.json</code> is still
      <strong> HTTP 404 at all six immutable main revisions</strong> below.
      These are dated source observations, not live gateway test results.</p>
    <div className="ql245-scroll"><table>
      <caption>Public source and owner-forwarded summary only; no keys, owner identity or private gateway probed.</caption>
      <thead><tr><th scope="col">App</th><th scope="col">Latest main</th>
        <th scope="col">Original proof</th><th scope="col">Owner return</th>
        <th scope="col">Signer</th><th scope="col">Nonproduction / relay</th></tr></thead>
      <tbody>{review.queue?.map(row=><tr key={row.repository}>
        <th scope="row">{row.name}</th>
        <td><a href={`https://github.com/RosevearCreations/${row.repository}/commit/${row.checkedMainSha}`}
          target="_blank" rel="noopener noreferrer">{row.checkedMainSha.slice(0,12)}</a></td>
        <td><strong>HTTP 404</strong></td><td>{row.reportedResponse}</td>
        <td>{row.signer}</td><td>{row.tenant}</td>
      </tr>)}</tbody>
    </table></div>
    <p><strong>Next source app handoff:</strong> Choose an app to see precisely what it
      needs to return. The text contains no credentials or identities and sends nothing.</p>
    <div className="ql260-handoff-controls">
      <label htmlFor="ql260-selected-app">Application
        <select id="ql260-selected-app" value={selected}
          onChange={event=>{setSelected(event.target.value as Ql260System);setCopyMessage('');}}>
          {QL260_SOURCE_REPORTS.map(row=><option value={row.system} key={row.system}>{row.name}</option>)}
        </select>
      </label>
      <p>{current.nextAction}</p>
      <button type="button" onClick={()=>void copy(handoff,`${current.name} QL-260 handoff`)}>
        Copy {current.name} next-action handoff
      </button>
      <textarea rows={10} readOnly value={handoff} aria-label="Selected QL-260 sanitized app handoff"/>
      <button type="button" onClick={()=>void copy(ql260SanitizedPortfolio(),'Six-app QL-260 status')}>
        Copy sanitized six-app blocker summary
      </button>
      <textarea rows={9} readOnly value={ql260SanitizedPortfolio()}
        aria-label="QL-260 sanitized six-app blocker summary"/>
      {copyMessage&&<p role="status" className="ql245-message">{copyMessage}</p>}
    </div>
    <p>Owner TEST: <strong>NOT_GIVEN</strong>; authenticated gateway GETs:
      <strong> 0</strong>; connections <strong>DISCONNECTED</strong>;
      <strong> {review.livePilotHolds}/12 live prerequisites HELD</strong>.
      Production Yard Workers company records are <strong>not</strong> a verified
      isolated nonproduction test tenant. The optional Windows relay remains off.</p>
  </section>;
}
