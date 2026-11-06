import {useState} from 'react';
import {QL349_PUBLIC_SOURCES,refreshSixPublicSources,
  type Ql349PublicObservation} from './ql349PublicSourceRefresh';
import './ql349-connection-control.css';

/** Public metadata refresh is usable directly in a static client; private
 * signer/device operations are deliberately available only in the private Hub. */
export function Ql349ConnectionControlCenter(){
  const [observations,setObservations]=useState<Ql349PublicObservation[]>([]);
  const [busy,setBusy]=useState(false);
  async function refresh(){
    if(busy)return;
    setBusy(true);
    try{setObservations(await refreshSixPublicSources());}
    finally{setBusy(false);}
  }
  const checked=observations.length;
  const discovered=observations.filter(s=>s.state==='PUBLIC_MANIFEST_FOUND_TRUST_HELD'||
    s.state==='PUBLIC_MANIFEST_FOUND_UNPINNED_TRUST_HELD').length;
  const unpinned=observations.filter(s=>s.state==='PUBLIC_MANIFEST_FOUND_UNPINNED_TRUST_HELD').length;
  return <section className="ql349-control" aria-labelledby="ql349-title" data-ql349="public-discovery-private-test-held">
    <header><div><small>QL-349 · Connection Control Plane</small>
      <h4 id="ql349-title">One hub, six source contracts, no repeated key entry</h4>
      <p>Refresh each application's published contract automatically. Original owner keys and private credentials stay on their own machines; public discovery never activates a TEST connection.</p>
    </div><span className="ql349-hold">0/6 private connections · HOLD</span></header>
    <div className="ql349-actionbar"><button type="button" disabled={busy}
      onClick={refresh}>{busy?'Checking source contracts…':'Refresh six source contracts'}</button>
      <p role="status">{busy?'Checking immutable main-commit descriptors in order…':
        checked?`${discovered}/6 public descriptors found${unpinned?` (${unpinned} unpinned: GitHub API rate-limited)`:''} · 0 authenticated private connections · no source writes`:
          'No public source refresh in this session. Existing private status remains HOLD.'}</p></div>
    <div className="ql349-grid" aria-label="Per-application connection verification">
      {QL349_PUBLIC_SOURCES.map(source=>{
        const result=observations.find(x=>x.id===source.id);
        return <article key={source.id}>
          <div><strong>{source.label}</strong><span>DISCONNECTED / HOLD</span></div>
          <small>RosevearCreations/{source.repo}</small>
          <p>{result?.state==='PUBLIC_MANIFEST_FOUND_TRUST_HELD'?
            'Published descriptor found · original signer and TEST receipt not verified':
            result?.state==='PUBLIC_MANIFEST_FOUND_UNPINNED_TRUST_HELD'?
              'Public manifest found · API rate-limited, revision not pinned · signer still HOLD':
            result?.state==='PUBLIC_API_RATE_LIMIT_HELD'?
              'GitHub API rate-limited · raw manifest unavailable · retry later':
            result?.state==='PUBLIC_MANIFEST_INCOMPATIBLE_HELD'?'Manifest mismatch · independent review required':
            result?'Public descriptor unavailable · hold and retry later':
            'Awaiting public contract recheck · private handshake not observed'}</p>
          {result?.commitSha&&<small className="ql349-revision">Public revision: {result.commitSha.slice(0,10)} · no code changed</small>}
        </article>;
      })}
    </div>
    <div className="ql349-next"><strong>What happens next?</strong>
      <p>The private coordinator verifies original source-owner authority, then prepares one 90-second signed GET through the approved broker. Each source must independently sign its own response. A failed attempt is isolated for review; there are no unattended retries or automatic production grants.</p>
      <p><b>No new keys are requested here.</b> Existing original Windows/Jack keys and source-owned manifests are preserved. Actual receiver enrollment and private GETs cannot be authorized from this public preview.</p></div>
    <footer>Public GitHub GETs only on refresh · no private API calls · no customer records · no database changes · no calls or SMS.</footer>
  </section>;
}
