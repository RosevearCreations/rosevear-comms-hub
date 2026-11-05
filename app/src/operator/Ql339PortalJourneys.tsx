import './ql339-portal-journeys.css';

/** Public operator display deliberately cannot read private child portal receipts. */
const BUSINESS_SHELLS=[
  {name:'Yard Workers',scope:'Independent property-care tenants'},
  {name:'iCamp',scope:'Independent campground tenants'},
  {name:'Rosie Dazzlers',scope:'Independent detailing customers'},
  {name:'Devil n Dove',scope:'Independent workshop and commerce customers'},
] as const;

export function Ql339PortalJourneys(){
  return <section className="ql339-portal" aria-labelledby="ql339-title" data-portal-connection="DISCONNECTED / HOLD">
    <div className="ql339-head"><div>
      <p className="ql339-kicker">QL-339 · private client portal custody</p>
      <h4 id="ql339-title">Child-safe portal journeys</h4>
      <p>One shared management view is planned. Each business owns its customer data and consent.
        This screen contains <strong>no live customer records</strong> and cannot activate a connection.</p>
    </div><span className="ql339-badge" role="status">TEST · DISCONNECTED / HOLD</span></div>
    <div className="ql339-grid" role="list" aria-label="Four independently isolated business portals">
      {BUSINESS_SHELLS.map(s=><article key={s.name} role="listitem">
        <h5>{s.name}</h5><p>{s.scope}</p>
        <span>Consent: not yet independently verified</span>
        <small>Portal events: not activated · no customer-wide view</small>
      </article>)}
    </div>
    <div className="ql339-action"><div>
      <h5>What must happen before our first customer journey?</h5>
      <ol>
        <li>Verify one original source application and authenticate a read-only TEST connection.</li>
        <li>Approve one exact tenant and child delegation using the source-app owner controls.</li>
        <li>Verify the consent receipt, original signer, role and session expiry, and retention rule.</li>
        <li>Run cross-business 403, duplicate-event, opt-out and export-denial tests.</li>
      </ol>
      <p><strong>Security rule:</strong> an opt-out, revoked session or expired authorization stops access;
        no outbound message, export or automatic child connection is permitted.</p>
    </div><a href="https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/build-records/QL-339_CHILD_SAFE_PORTAL_CONSENT_HOLD.md"
      target="_blank" rel="noopener noreferrer">Owner setup and privacy checklist ↗</a></div>
    <details><summary>ⓘ What does QL-339 actually install?</summary>
      <p>A server-only source-signed event verifier, private append-only consent/portal receipt table,
        exact tenant/child/subject query checks, and denial tests. It does not create a live customer portal,
        enroll users, start a Windows relay, or publish customer records. Those need independently authenticated
        owner and source-side TEST authorizations.</p></details>
  </section>;
}
