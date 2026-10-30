import {useState,type FormEvent} from 'react';
import {QL258_APPS,type Ql258App} from './ql258OwnerActionChecklist';
import {type Ql259Ledger} from './ql259SixAppReturnReconciliation';
import {QL263_RELEASE,QL263_OBSERVED,QL263_ROLE_OPTIONS,QL263_FUTURE_GET_PLAN,
  QL263_HUB_RETURN,QL263_ROSIE_ATTACHMENT_SHA256,ql263InitialOwnerLedger,
  intakeQl263OriginalPacket,ql263NewRoleLedger,ql263SetRole,
  ql263DecisionReview,ql263SourceReturnHandoff,
  type Ql263Role,type Ql263RoleDecision} from './ql263OriginalReceiptsAndTestPlan';

const MESSAGES={
  ACCEPTED_SELF_REPORTED_HELD:'Exact original QL-258 owner JSON recorded. Format is valid; independent human/key authentication is not established.',
  REJECTED_UNSAFE_OR_INVALID_PACKET:'Rejected invalid, substituted or unsafe owner JSON. Do not enter credentials, people or witness challenges.',
  DUPLICATE_IDENTICAL_NO_CHANGE_HELD:'Identical original owner JSON already recorded; no new proof.',
  CONFLICT_REQUIRES_CLEAR_HELD:'Conflicting owner JSON; clear this temporary entry before reimporting. Baseline Rosie attachment remains immutable.'
} as const;

export function Ql263OriginalReceiptReadiness(){
  const [owners,setOwners]=useState<Ql259Ledger>(ql263InitialOwnerLedger);
  const [raw,setRaw]=useState('');
  const [roles,setRoles]=useState(ql263NewRoleLedger);
  const [selected,setSelected]=useState<Ql258App>('rosiedazzlers');
  const [role,setRole]=useState<Ql263Role>('custodian');
  const [message,setMessage]=useState('');
  const [audited,setAudited]=useState(false);
  const review=ql263DecisionReview(owners,roles);
  const handoff=ql263SourceReturnHandoff(selected);
  const exportText=JSON.stringify({...review,
    actualRosieAttachmentSha256:QL263_ROSIE_ATTACHMENT_SHA256,
    sourceOfPrivateRoleDecisions:'OWNER_STATUS_ONLY_NOT_INDEPENDENTLY_AUTHENTICATED'},null,2);

  function importOwner(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const result=intakeQl263OriginalPacket(owners,raw);
    setOwners(result.ledger);setRaw('');setAudited(false);
    setMessage(MESSAGES[result.status]);
  }
  async function copy(text:string,label:string){
    try{await navigator.clipboard.writeText(text);
      setMessage(`${label} copied. No secret or independent TEST authorization is included.`);
    }catch{setMessage('Browser copy unavailable; select the read-only text below to copy it manually.');}
  }

  return <section className="ql245-panel" data-ql263-release={QL263_RELEASE}
    aria-labelledby="ql263-title">
    <h4 id="ql263-title">QL-263 · Original Rosie receipt, Hub Build 187 response and safe nonproduction GET-window plan (HELD)</h4>
    <p>Received <strong>one exact QL-258 sanitized owner JSON from Rosie Dazzlers</strong>.
      Its original source SHA is older than the latest main; all custodian/witness/reviewer
      steps are <strong>NOT_REPORTED</strong>. Received the Hub Build 187 narrative, but
      <strong> no Hub QL-258 JSON</strong>. Its source health/capabilities contract was tested
      in-process only; there is no original authenticated gateway or home-network receipt.</p>
    <p>Public source-only check ({QL263_OBSERVED}): six original proof paths still
      <strong> HTTP 404</strong> at their listed immutable main SHAs.
      Rosie, Devil n Dove and Rosevear AI Hub advanced from the QL-262 snapshot.
      This does not authenticate a signer or say anything about future commits.</p>
    <form className="ql245-form" onSubmit={importOwner}>
      <label htmlFor="ql263-original-packet">Add one more exact, nonsecret QL-258 owner packet
        <textarea id="ql263-original-packet" rows={5} maxLength={12000} required
          value={raw} onChange={event=>setRaw(event.target.value)}
          placeholder="Do not paste names, passwords, private signer keys, pin challenges, tenant URLs or provider tokens." />
      </label>
      <div className="ql245-actions"><button type="submit">Validate original packet · HELD</button>
        <button type="button" onClick={()=>{
          setAudited(true);setMessage('Offline nine-GET/15-minute plan reviewed only. No GET executed or authorized. All private gates HELD.');
        }}>Review bounded future GET-only plan (offline)</button></div>
    </form>
    <div className="ql263-role-controls">
      <label htmlFor="ql263-source">Source application
        <select id="ql263-source" value={selected}
          onChange={event=>setSelected(event.target.value as Ql258App)}>
          {QL258_APPS.map(app=><option key={app.system} value={app.system}>{app.name}</option>)}
        </select>
      </label>
      <label htmlFor="ql263-role">Private role to track (status only)
        <select id="ql263-role" value={role}
          onChange={event=>setRole(event.target.value as Ql263Role)}>
          <option value="custodian">Signer-key custodian</option>
          <option value="witness">Separate nonce witness</option>
          <option value="reviewer">Independent reviewer</option>
        </select>
      </label>
      <label htmlFor="ql263-role-decision">Owner's reported disposition, NOT authentication
        <select id="ql263-role-decision" value={roles[selected][role]}
          onChange={event=>{
            setRoles(previous=>ql263SetRole(previous,selected,role,event.target.value as Ql263RoleDecision));
            setAudited(false);
            setMessage('Recorded a nonsecret owner report only. A private out-of-band reviewer must still authenticate the real person/key.');
          }}>
          {QL263_ROLE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    </div>
    {message&&<p role="status" className="ql245-message">{message}</p>}
    <div className="ql245-scroll"><table>
      <caption>Original QL-258 JSON is a self-report; published proof files and private security facts are independently outstanding.</caption>
      <thead><tr><th scope="col">App</th><th scope="col">Owner JSON</th>
        <th scope="col">Current main / proof</th><th scope="col">Private roles</th>
        <th scope="col">Real TEST decision</th></tr></thead>
      <tbody>{review.rows.map(row=><tr key={row.system}>
        <th scope="row">{row.name}</th><td>{row.ownerPacket}
          {row.sourceDriftSinceOwnerPacket&&<p>Original owner SHA is historical · recheck required</p>}</td>
        <td>{row.sourceMainSha.slice(0,12)} / {row.proofAtSourceMain}</td>
        <td>{row.custodianRole} / {row.witnessRole} / {row.reviewerRole}</td>
        <td><strong>{row.ownerTest} / HOLD</strong></td>
      </tr>)}</tbody>
    </table></div>
    <p><strong>Received original packets:</strong> {review.originalOwnerPacketsReceived}/6.
      {' '}Hub synthetic contract: {QL263_HUB_RETURN.staticContract}.
      {' '}Authenticated signer/witness/reviewer decisions: <strong>0</strong>.
      {' '}Original signed proofs: <strong>0/6</strong>. All <strong>12/12</strong>
      {' '}live pilot prerequisites HELD.</p>
    <p><strong>Bounded proposed TEST window:</strong> only after separate owner authorization,
      at most <strong>{QL263_FUTURE_GET_PLAN.maxRequestsPerApp} GETs per app</strong>
      {' '}within <strong>{QL263_FUTURE_GET_PLAN.maxWindowMinutes} minutes</strong>:
      two positive <code>/health</code> and <code>/capabilities</code> GETs and seven
      independently witnessed denial cases. <strong>Not scheduled, no endpoints or credentials supplied,
      no request executed.</strong> Rollback and separate restricted test tenant review required.</p>
    <p>Offline plan: <strong>{audited?'REVIEWED_NOT_AUTHORIZED':'NOT_REVIEWED'}</strong>.
      Source A→proof B signature checks must be performed privately against real
      out-of-band pins using <code>node scripts/ql248-verify-source-proof-bundle.mjs</code>;
      never infer trust from this operator screen.</p>
    <button type="button" onClick={()=>void copy(handoff,'Selected source next-action packet')}>
      Copy {QL258_APPS.find(app=>app.system===selected)?.name} QL-263 source handoff</button>
    <textarea readOnly rows={9} value={handoff} aria-label="QL-263 selected source handoff"/>
    <button type="button" onClick={()=>void copy(exportText,'Six-app sanitized decision report')}>
      Copy QL-263 sanitized owner/private-role and future TEST report</button>
    <textarea readOnly rows={10} value={exportText} aria-label="QL-263 sanitized six-app report"/>
    <p><strong>Integration DISCONNECTED / HOLD.</strong> No live source GET, SMS, call,
      dispatch, provider post, relay installation or production write occurs here.
      Owner role selections and imported additional packets are cleared at refresh;
      the supplied nonsecret Rosie original receipt remains in the released source.</p>
  </section>;
}
