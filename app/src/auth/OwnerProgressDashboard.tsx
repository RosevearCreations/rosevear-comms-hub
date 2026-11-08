import { useEffect, useState } from 'react';
import {QL369_SHA256,readOwnerProgress,type OwnerCeremonyGateway}
  from './ql369OwnerEnrollment';
import {ownerProgressGuidance,type OwnerProgress,type ProgressAttestationState}
  from './ql370OwnerProgress';
import {OwnerCeremonyGuide} from './OwnerCeremonyGuide';

type Props={
  gateway:OwnerCeremonyGateway|null;
  ownerRole:'source'|'master';
  mfaVerified:boolean;
  intentSha256:string;
  refreshSequence:number;
  onClearLocal:()=>void;
};
const statusText=(status:ProgressAttestationState|undefined):string=>({
  NOT_RECORDED:'No matching attestation',
  CURRENT:'Current at last server check',
  EXPIRED:'Expired — renew required',
  REVOKED_OR_STALE:'Session or factor no longer valid'
}[status??'NOT_RECORDED']);
function time(value:string|null|undefined){
  if(!value)return 'Not recorded';
  return Number.isFinite(Date.parse(value))?new Date(value).toLocaleString():'Unavailable';
}

export function OwnerProgressDashboard({
  gateway,ownerRole,mfaVerified,intentSha256,refreshSequence,onClearLocal
}:Props){
  const [snapshot,setSnapshot]=useState<OwnerProgress|null>(null);
  const [loading,setLoading]=useState(false);
  const [failed,setFailed]=useState(false);
  const [refreshClick,setRefreshClick]=useState(0);
  const digest=intentSha256.trim().toLowerCase();
  const validDigest=QL369_SHA256.test(digest)&&digest!=='0'.repeat(64);
  const hasIncompleteDigest=digest.length>0&&!validDigest;
  const peer=ownerRole==='source'?'Jack':'Ree';

  useEffect(()=>{
    if(!gateway||!mfaVerified||hasIncompleteDigest){
      setSnapshot(null);setLoading(false);setFailed(false);
      return;
    }
    let cancelled=false;
    setLoading(true);setFailed(false);
    void readOwnerProgress(gateway,ownerRole,validDigest?digest:null).then(result=>{
      if(cancelled)return;
      setSnapshot(result.progress);
      setFailed(!result.ok);setLoading(false);
    });
    return ()=>{cancelled=true;};
  },[gateway,ownerRole,mfaVerified,hasIncompleteDigest,validDigest,digest,refreshSequence,refreshClick]);

  const guidance=ownerProgressGuidance(snapshot,validDigest);
  const holds=snapshot?.connectionsState==='DISCONNECTED / HOLD'&&
    snapshot.totalApplicationShells===6&&snapshot.heldApplicationShells===6;
  return (
    <section className="ql368-security ql370-progress" aria-label="QL-370 protected original owner progress">
      <div className="ql370-heading">
        <div>
          <p className="ql370-eyebrow">QL-370 · OWNER-ONLY READBACK</p>
          <h2>Our enrollment progress</h2>
        </div>
        <button id="ql370-refresh-status" type="button" className="ql368-link-button"
          disabled={!mfaVerified||!gateway||loading||hasIncompleteDigest}
          onClick={()=>setRefreshClick(x=>x+1)}>
          {loading?'Checking…':'Refresh server status'}
        </button>
      </div>
      <p className="ql368-help">Only Ree or Jack, with a current authenticated MFA session, can see this redacted server snapshot. It does not perform enrollment.</p>
      {!mfaVerified&&<p role="status" className="ql367-notice">Finish the authenticator challenge to load protected progress and security audit evidence.</p>}
      {hasIncompleteDigest&&<p role="status" className="ql367-notice">Enter the complete original 64-character intent SHA-256 below to compare both attestations.</p>}
      {loading&&<p role="status">Checking current protected owner records…</p>}
      {failed&&<p role="alert" className="ql367-notice">The server did not confirm the progress readback. Nothing was activated; retry after checking the current MFA session.</p>}
      {!loading&&snapshot&&<>
        <div className="ql370-grid">
          <div className="ql370-stat">
            <span>Our session</span>
            <strong className="ql370-verified">AAL2 verified</strong>
            <small>Rechecked by Supabase Auth and Postgres</small>
          </div>
          <div className="ql370-stat">
            <span>Our attestation</span>
            <strong>{validDigest?statusText(snapshot.ownAttestation.state):'Enter an intent first'}</strong>
            <small>{validDigest?'Expires: '+time(snapshot.ownAttestation.expiresAt):'No digest is sent or displayed'}</small>
          </div>
          <div className="ql370-stat">
            <span>{peer}'s attestation</span>
            <strong>{validDigest?statusText(snapshot.peerAttestation.state):'Not yet checked'}</strong>
            <small>{validDigest?'Expires: '+time(snapshot.peerAttestation.expiresAt):'Independent verification required'}</small>
          </div>
          <div className="ql370-stat">
            <span>Owner memberships</span>
            <strong>{snapshot.activeOwnerMemberships} / 2 active</strong>
            <small>{snapshot.ownerMembershipActive?'Our owner record is active':'Our owner record remains inactive'}</small>
          </div>
        </div>
        <div className={holds?'ql370-hold':'ql370-warning'} role={holds?'status':'alert'}>
          <strong>{holds?'All six application shells remain DISCONNECTED / HOLD':
            'Application HOLD requires manual investigation'}</strong>
          <span>{holds?'No customer access, private TEST, child tenancy or connections are enabled by this view.':
            'The protected shell count or isolation state has drifted. Do not proceed with activation.'}</span>
        </div>
        <div className="ql370-audit">
          <h3>Security audit visibility</h3>
          <dl>
            <div><dt>Original offline decisions</dt><dd>{snapshot.offlineApprovalState===
              'VERIFIED_AT_ORIGINAL_ACTIVATION'?'Verified at the recorded activation':
              'Not observable until the final signed packet is submitted'}</dd></div>
            <div><dt>One-time activation receipt</dt><dd>{snapshot.audit.activationRecorded?
              'Recorded '+time(snapshot.audit.activationAt):'Not recorded'}</dd></div>
            <div><dt>Verified activation audit events</dt><dd>{snapshot.audit.verifiedActivationEvents}</dd></div>
            <div><dt>Last verified event</dt><dd>{time(snapshot.audit.lastVerifiedEventAt)}</dd></div>
            <div><dt>Snapshot verified</dt><dd>{time(snapshot.snapshotAt)}</dd></div>
          </dl>
          <p className="ql368-help">This is a limited original-owner activation audit, not a full log of failed sign-ins. It never reveals passwords, authenticator codes, keys, tokens, peer emails, factor IDs, signatures or receipt digests.</p>
        </div>
      </>}
      <OwnerCeremonyGuide progress={loading||failed?null:snapshot}
        mfaVerified={mfaVerified} ownerRole={ownerRole} intentSupplied={validDigest}/>
      <div className="ql370-recovery">
        <h3>{mfaVerified?guidance.heading:'Finish MFA before reviewing progress'}</h3>
        <p>{mfaVerified?guidance.message:
          'A password recovery link alone cannot grant AAL2 or sign an original owner decision.'}</p>
        <details>
          <summary>How we safely recover an interrupted ceremony</summary>
          <ol>
            <li>Confirm both owners can sign in on their own machines and complete authenticator MFA.</li>
            <li>If an attestation is expired or stale, recheck the 24-hour QL-368 evidence and one-hour QL-369 activation decision; never reuse expired signatures.</li>
            <li>While the original intent is valid, each owner may explicitly attest again for a new 30-minute window. Otherwise prepare a fresh original offline intent and independent signatures.</li>
            <li>Only Ree submits the two separately signed activation decisions. An interrupted browser cannot create a signed approval.</li>
          </ol>
          <button type="button" className="ql368-link-button" onClick={onClearLocal}>
            Clear this browser's ceremony selections
          </button>
          <p className="ql368-help">Clearing selections removes only local input values. It does not revoke a Supabase session, reset MFA, delete server evidence or activate membership.</p>
        </details>
      </div>
    </section>
  );
}
