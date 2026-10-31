// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {Ql286AuthorityOutcomeConflictAging} from '../Ql286AuthorityOutcomeConflictAging';
import {QL270_SOURCES} from '../ql270ConnectionCentre';
import {QL282_ACK_WORKSTREAM,ql282PrepareIssuerReview,ql282PrepareException} from '../ql282IssuerPublicationReview';
import {ql276CaptureOwnerObservation} from '../ql276EvidenceIntake';
import {ql277CompareAccessibility} from '../ql277DriftReview';
import {ql278CreateRetestTicket} from '../ql278FollowupDesk';
import {ql279PrepareReviewerDraft,ql279PrepareArrivalClaim} from '../ql279ReviewerCustodyEscalation';
import {ql280PrepareReviewerReceipt} from '../ql280ReceiptReconciliation';
import {ql281PrepareChallengeRequest} from '../ql281SignatureProofCustody';
import {ql283PrepareTrustReference,ql283PrepareOwnerFollowup,ql283PrepareManualRecheck} from '../ql283IssuerTrustOwnerFollowup';
import {ql284PrepareCrossCheck,ql284PrepareOwnerResponse,ql284PrepareSourceFollowup} from '../ql284ReviewerCrosscheckOwnerResponse';
import {QL285_OBSERVED_AT,QL285_PUBLIC_SOURCE_RECHECK,ql285PrepareAuthorityAudit,ql285PrepareProvenance,
  ql285PrepareDeltaWorkItem} from '../ql285IssuerAuthorityProvenanceDelta';
import {QL286_OBSERVED_AT,QL286_PUBLIC_SOURCE_RECHECK,QL286_REVIEW_OUTCOMES,QL286_PROVENANCE_CONFLICTS,
  ql286PinnedProofUrl,ql286CompareAuthorityOutcome,ql286PrepareConflictFollowup,
  ql286PrepareAgingFollowup,ql286ExceptionAging,ql286AuditPacket}
  from '../ql286AuthorityOutcomeConflictAging';

const t=(iso:string)=>new Date(iso);
let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
function button(label:string){const element=[...host.querySelectorAll<HTMLButtonElement>('button')]
  .find(row=>row.getAttribute('aria-label')===label||row.textContent?.includes(label));
  if(!element)throw Error(`Missing button ${label}`);return element;}
function input(selector:string,value:string){const element=host.querySelector<HTMLInputElement>(selector)!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(element,value);
  element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));}

function authorityFixture(){
  const capture=(outcome:'observed'|'issue',when:string)=>{
    const r=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
      note:'An independent on-device local keyboard focus observation.'},t(when));
    if(!r.ok)throw Error(r.reason);return r.record;
  };
  const comparison=ql277CompareAccessibility(capture('observed','2026-10-31T02:55:00Z'),capture('issue','2026-10-31T02:56:00Z'));
  const ticket=ql278CreateRetestTicket(comparison);if(!ticket.ok)throw Error(ticket.reason);
  const reviewer=ql279PrepareReviewerDraft(ticket.ticket,'REVIEW-286-CASE','EVIDENCE_INCOMPLETE',
    'Original independent challenge signature remains absent.',t('2026-10-31T02:59:00Z'));
  if(!reviewer.ok)throw Error(reviewer.reason);
  const receipt=ql280PrepareReviewerReceipt(reviewer.draft,'RECEIPT-286-CASE',t('2026-10-31T03:06:00Z'));
  if(!receipt.ok)throw Error(receipt.reason);
  const challenge=ql281PrepareChallengeRequest(receipt.claim,'CHALLENGE-286-CASE',t('2026-10-31T03:47:00Z'));
  if(!challenge.ok)throw Error(challenge.reason);
  const issuer=ql282PrepareIssuerReview(challenge.request,'ISSUER-286-CASE',t('2026-10-31T04:22:00Z'));
  if(!issuer.ok)throw Error(issuer.reason);
  const trust=ql283PrepareTrustReference(issuer.request,'TRUST-286-CASE',t('2026-10-31T05:17:00Z'));
  if(!trust.ok)throw Error(trust.reason);
  const cross=ql284PrepareCrossCheck(trust.draft,'CROSSCHECK-286-CASE',t('2026-10-31T13:35:00Z'));
  if(!cross.ok)throw Error(cross.reason);
  const authority=ql285PrepareAuthorityAudit(cross.draft,'AUTHORITY-286-CASE',t('2026-10-31T14:02:00Z'));
  if(!authority.ok)throw Error(authority.reason);return authority.draft;
}
function provenanceFixture(source:'icamp'|'yw'='icamp'){
  const exception=ql282PrepareException(source,'EXCEPTION-286-CASE',t('2026-10-31T04:22:00Z'));
  if(!exception.ok)throw Error(exception.reason);
  const owner=ql283PrepareOwnerFollowup(exception.draft,'FOLLOWUP-286-CASE',t('2026-10-31T05:17:00Z'));
  if(!owner.ok)throw Error(owner.reason);
  const response=ql284PrepareOwnerResponse(owner.draft,'RESPONSE-286-CASE','ORIGINAL_SOURCE_CLAIMED',t('2026-10-31T13:35:00Z'));
  if(!response.ok)throw Error(response.reason);
  const previous=ql285PrepareProvenance(response.draft,'PROVENANCE-286-CASE','OWNER_SOURCE_REFERENCE',t('2026-10-31T14:02:00Z'));
  if(!previous.ok)throw Error(previous.reason);return previous.draft;
}
function agingFixture(source:'rosiedazzlers'|'yw'='rosiedazzlers'){
  const recheck=ql283PrepareManualRecheck(source,'RECHECK-286-CASE',t('2026-10-31T05:17:00Z'));
  if(!recheck.ok)throw Error(recheck.reason);
  const followup=ql284PrepareSourceFollowup(recheck.draft,'REVALIDATE-286-CASE',t('2026-10-31T13:35:00Z'));
  if(!followup.ok)throw Error(followup.reason);
  const previous=ql285PrepareDeltaWorkItem(followup.draft,'DELTA-286-CASE',t('2026-10-31T14:02:00Z'));
  if(!previous.ok)throw Error(previous.reason);return previous.draft;
}
async function renderSeeded(){await act(async()=>root.unmount());root=createRoot(host);
  await act(async()=>root.render(<Ql286AuthorityOutcomeConflictAging
    authorityAudits={[authorityFixture()]} provenanceReviews={[provenanceFixture()]}
    deltaWorkItems={[agingFixture()]} arrivalClaims={[]} onOpenQl285={()=>{}} onOpenEvidence={()=>{}}/>));}

describe('QL-286 independent authority outcome comparison, original provenance conflicts and six-source aging',()=>{
  it('pins six newly observed public main refs and six exact HTTP 404s, with five moved and one unchanged',()=>{
    expect(QL286_OBSERVED_AT).toBe('2026-10-31T14:28:28Z');
    expect(new Set(QL286_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    const snapshot=ql286ExceptionAging('2026-10-31T14:30:00Z');
    expect(snapshot).toMatchObject({moved:5,unchanged:1,missing:6,sources:6,originalsAccepted:0,
      authenticatedSourceGets:0,automaticPolling:false,release:'DISCONNECTED / HOLD'});
    expect(snapshot.rows.filter(row=>row.moved).map(row=>row.source)).toEqual(['ai-data-platform','devilndove','rosiedazzlers','icamp','rosevear-ai-hub']);
    expect(snapshot.rows.filter(row=>!row.moved).map(row=>row.source)).toEqual(['yw']);
    QL286_PUBLIC_SOURCE_RECHECK.forEach(row=>{expect(row.sha).toMatch(/^[0-9a-f]{40}$/);expect(row.http).toBe(404);
      expect(ql286PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);});
    expect(()=>ql286PinnedProofUrl('fake' as never)).toThrow('UNKNOWN_QL286_SOURCE');
  });

  it('ages only real fixed public observations, with a 24-hour recheck and 72-hour aging band',()=>{
    expect(ql286ExceptionAging(QL286_OBSERVED_AT)).toMatchObject({ageHours:0,freshness:'CURRENT_PINNED_SNAPSHOT',
      nextRecheckAt:'2026-11-01T14:28:28.000Z'});
    expect(ql286ExceptionAging('2026-11-01T14:28:28Z').freshness).toBe('RECHECK_DUE');
    expect(ql286ExceptionAging('2026-11-03T14:28:28Z').rows[0].bucket).toBe('OVER_72_HOURS');
    expect(ql286ExceptionAging('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql286ExceptionAging('2026-10-31T14:28:27Z').ageHours).toBeNull();
    expect(t(QL286_OBSERVED_AT).getTime()).toBeGreaterThan(t(QL285_OBSERVED_AT).getTime());
  });

  it('counts unverified notices after the QL-286 pin and detects old source pins without claiming proof',()=>{
    const early=ql279PrepareArrivalClaim('rosiedazzlers','SOURCE_PUBLICATION_NOTICE','NOTICE-286-EARLY',t('2026-10-31T14:01:00Z'));
    const late=ql279PrepareArrivalClaim('yw','SOURCE_PUBLICATION_NOTICE','NOTICE-286-LATE',t('2026-10-31T14:35:00Z'));
    if(!early.ok||!late.ok)throw Error('Invalid local notice');
    const report=ql286ExceptionAging('2026-10-31T14:40:00Z',[early.claim,late.claim],[agingFixture()]);
    expect(report.rows.find(row=>row.source==='rosiedazzlers')).toMatchObject({notices:1,postSnapshotNotices:0,stalePinNotices:1,linkedManualItems:1});
    expect(report.rows.find(row=>row.source==='yw')).toMatchObject({notices:1,postSnapshotNotices:1,stalePinNotices:1});
    expect(report.rows.every(row=>!row.originalVerified&&!row.automaticGET)).toBe(true);
  });

  it('compares a genuine unverified issuer audit with seven gates unmet and no invented decision',()=>{
    expect(QL286_REVIEW_OUTCOMES).toHaveLength(3);
    const result=ql286CompareAuthorityOutcome(authorityFixture(),'OUTCOME-286-CASE','CHALLENGE_RETURN_NOT_RECEIVED',t('2026-10-31T14:31:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({checkId:'keyboard',previousCase:'AUTHORITY-286-CASE',unmetGates:7,
      newVerifiedGates:0,issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',challenge:'NOT_ISSUED',
      signature:'NOT_VERIFIED',independentlyReviewed:false,disposition:'LOCAL_OUTCOME_COMPARISON_ONLY',
      state:'AUTHORITY_REVIEW_STILL_OPEN'});
  });

  it('rejects forged issuer gates, challenge issuance, verified review, secrets and bad time',()=>{
    const prior=authorityFixture();const run=(row:typeof prior,ref='OUTCOME-286-CASE',outcome='AUTHORITY_CHAIN_UNCORROBORATED',when='2026-10-31T14:31:00Z')=>
      ql286CompareAuthorityOutcome(row,ref,outcome as never,t(when));
    expect(run({...prior,verified:1 as never}).ok).toBe(false);
    expect(run({...prior,issuer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...prior,challenge:'ISSUED' as never}).ok).toBe(false);
    expect(run({...prior,gates:[] as never}).ok).toBe(false);
    expect(run({...prior,gates:prior.gates.map(g=>({...g,status:'VERIFIED'})) as never}).ok).toBe(false);
    expect(run(prior,'token-private').ok).toBe(false);
    expect(run(prior,'bad').ok).toBe(false);
    expect(run(prior,'OUTCOME-286-CASE','APPROVED').ok).toBe(false);
    expect(run(prior,'OUTCOME-286-CASE','AUTHORITY_CHAIN_UNCORROBORATED','2026-10-31T14:27:00Z').ok).toBe(false);
    expect(run(prior,'OUTCOME-286-CASE','AUTHORITY_CHAIN_UNCORROBORATED','invalid').ok).toBe(false);
  });

  it('quarantines a provenance conflict with the latest source SHA, no receipt and no routing',()=>{
    expect(QL286_PROVENANCE_CONFLICTS).toHaveLength(3);
    const result=ql286PrepareConflictFollowup(provenanceFixture('icamp'),'CONFLICT-286-CASE',
      'ORIGINAL_CUSTODY_RECEIPT_MISSING',t('2026-10-31T14:31:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'icamp',ownerIdentity:'NOT_AUTHENTICATED',
      originalReceipt:'NOT_VERIFIED',original:'HTTP_404_AT_IMMUTABLE_PIN',routed:false,resolved:false,
      sourceVerified:false,disposition:'PROVENANCE_CONFLICT_OPEN',state:'LOCAL_QUARANTINED_FOLLOWUP'});
    expect(result.draft.priorSha).toBe(QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='icamp')?.sha);
    expect(result.draft.latestSha).toBe(QL286_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='icamp')?.sha);
  });

  it('rejects false owner authentication, accepted original, counterfeit source SHA and conflict types',()=>{
    const prior=provenanceFixture();const run=(row:typeof prior,ref='CONFLICT-286-CASE',type='SOURCE_PIN_CHANGED',when='2026-10-31T14:31:00Z')=>
      ql286PrepareConflictFollowup(row,ref,type as never,t(when));
    expect(run({...prior,ownerIdentity:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(run({...prior,originalReceipt:'VERIFIED' as never}).ok).toBe(false);
    expect(run({...prior,resolved:true as never}).ok).toBe(false);
    expect(run({...prior,routed:true as never}).ok).toBe(false);
    expect(run({...prior,latestSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prior,priorSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prior,source:'missing' as never}).ok).toBe(false);
    expect(run(prior,'secret-private').ok).toBe(false);
    expect(run(prior,'bad').ok).toBe(false);
    expect(run(prior,'CONFLICT-286-CASE','RECONCILED').ok).toBe(false);
    expect(run(prior,'CONFLICT-286-CASE','SOURCE_PIN_CHANGED','2026-10-31T14:27:00Z').ok).toBe(false);
    expect(run(provenanceFixture('yw'),'CONFLICT-286-CASE','SOURCE_PIN_CHANGED').ok).toBe(false);
    expect(run(provenanceFixture('yw'),'CONFLICT-286-CASE','ORIGINAL_CUSTODY_RECEIPT_MISSING').ok).toBe(true);
  });

  it('creates an unscheduled, unexecuted local aging worklist, including unchanged Yard Workers source',()=>{
    const moved=ql286PrepareAgingFollowup(agingFixture(),'AGING-286-CASE',t('2026-10-31T14:31:00Z'));
    expect(moved.ok).toBe(true);if(!moved.ok)throw Error(moved.reason);
    expect(moved.draft).toMatchObject({source:'rosiedazzlers',sourceChanged:true,scheduled:false,executed:false,
      originalAccepted:false,state:'LOCAL_SOURCE_EXCEPTION_AGING_RECHECK_PENDING'});
    const unchanged=ql286PrepareAgingFollowup(agingFixture('yw'),'AGING-286-YW',t('2026-10-31T14:31:00Z'));
    expect(unchanged.ok&&unchanged.draft.sourceChanged).toBe(false);
  });

  it('rejects prematurely scheduled source work, forged original acceptance and invalid time',()=>{
    const prior=agingFixture();const run=(row:typeof prior,ref='AGING-286-CASE',when='2026-10-31T14:31:00Z')=>
      ql286PrepareAgingFollowup(row,ref,t(when));
    expect(run({...prior,reviewScheduled:true as never}).ok).toBe(false);
    expect(run({...prior,reviewExecuted:true as never}).ok).toBe(false);
    expect(run({...prior,originalAccepted:true as never}).ok).toBe(false);
    expect(run({...prior,observedSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prior,priorSha:'0'.repeat(40)}).ok).toBe(false);
    expect(run({...prior,sourceChanged:false as never}).ok).toBe(false);
    expect(run({...prior,source:'unregistered' as never}).ok).toBe(false);
    expect(run(prior,'password-private').ok).toBe(false);
    expect(run(prior,'bad').ok).toBe(false);
    expect(run(prior,'AGING-286-CASE','2026-10-31T14:27:00Z').ok).toBe(false);
  });

  it('keeps ACK Under Review and source integration Disconnected/Hold in every audit packet',()=>{
    const packet=JSON.parse(ql286AuditPacket([],[],[],'2026-10-31T14:32:00Z'));
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER'});
    expect(packet.ackDeliveryEvidence).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.integrationSecurity).toMatchObject({state:'DISCONNECTED / HOLD',originalsAccepted:0,authenticatedGETs:0,
      realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false});
    expect(packet.authorityOutcome).toMatchObject({verified:0,issuedChallenges:0,independentReviews:0});
    expect(packet.sourceExceptionAging).toMatchObject({moved:5,unchanged:1,missing:6,automaticPolling:false});
  });

  it('exposes QL-286 from the IT command toolbar with accessible empty prerequisites',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer outcomes, Proof-B conflicts & exception aging').click());
    expect(host.querySelector('[data-ql286-desk]')).not.toBeNull();
    expect(button('Prepare pending reviewer outcome comparison').disabled).toBe(true);
    expect(host.textContent).toContain('No QL-285 authority audit in this session');
    expect(host.textContent).toContain('Parked for later');
    await act(async()=>button('03 Six-app exception aging').click());
    expect(host.querySelectorAll('[aria-label="QL-286 source exception aging ledger"] [role="row"]')).toHaveLength(7);
    expect(host.querySelectorAll('[aria-label="QL-286 source exception aging ledger"] a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    expect(button('Prepare local aging follow-up').disabled).toBe(true);
    expect(host.textContent).toContain('QL-286');
  });

  it('filters changed and unchanged public SHA pins and never marks any Proof-B as accepted',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer outcomes, Proof-B conflicts & exception aging').click());
    await act(async()=>button('03 Six-app exception aging').click());
    await act(async()=>button('Changed pins (5)').click());
    expect(host.querySelectorAll('[aria-label="QL-286 source exception aging ledger"] [role="row"]')).toHaveLength(6);
    await act(async()=>button('Unchanged pins (1)').click());
    expect(host.querySelectorAll('[aria-label="QL-286 source exception aging ledger"] [role="row"]')).toHaveLength(2);
    expect(host.textContent).toContain('Yard Workers');
    await act(async()=>button('Recalculate age only').click());
    expect(host.textContent).toContain('no new GET was performed');
  });

  it('preserves QL-285 navigation and shows isolated Under Review ACK in all topics',async()=>{
    await act(async()=>button('IT Command').click());
    await act(async()=>button('Reviewer outcomes, Proof-B conflicts & exception aging').click());
    await act(async()=>button('02 Proof-B conflicts').click());
    expect(host.textContent).toContain('No QL-285 quarantined provenance claim');
    expect(button('Prepare quarantined conflict follow-up').disabled).toBe(true);
    await act(async()=>button('Open QL-285 provenance claim').click());
    expect(host.querySelector('[data-ql285-desk]')).not.toBeNull();
    expect(host.textContent).toContain('Under Review');
  });

  it('prepares all three seeded local cases while preserving read-only ACK and copy packet',async()=>{
    await renderSeeded();
    await act(async()=>input('#ql286-outcome-ref','OUTCOME-286-UI'));
    await act(async()=>button('Prepare pending reviewer outcome comparison').click());
    expect(host.textContent).toContain('AUTHORITY REVIEW STILL OPEN');
    await act(async()=>button('02 Proof-B conflicts').click());
    await act(async()=>input('#ql286-conflict-ref','CONFLICT-286-UI'));
    await act(async()=>button('Prepare quarantined conflict follow-up').click());
    expect(host.textContent).toContain('PROVENANCE CONFLICT OPEN');
    await act(async()=>button('03 Six-app exception aging').click());
    await act(async()=>input('#ql286-aging-ref','AGING-286-UI'));
    await act(async()=>button('Prepare local aging follow-up').click());
    expect(host.textContent).toContain('LOCAL SOURCE EXCEPTION AGING RECHECK PENDING');
    const copy=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copy}});
    await act(async()=>button('Copy local QL-286 packet').click());
    expect(copy).toHaveBeenCalledOnce();
    const payload=JSON.parse(copy.mock.calls[0][0] as string);
    expect(payload.authorityOutcome.comparisons).toHaveLength(1);
    expect(payload.proofBProvenance.conflicts).toHaveLength(1);
    expect(payload.localAgingFollowups).toHaveLength(1);
    expect(payload.ackDeliveryEvidence.status).toBe('UNDER_REVIEW');
    await act(async()=>button('Clear QL-286 local drafts').click());
    expect(JSON.parse((host.querySelector('#ql286-packet') as HTMLTextAreaElement).value).localAgingFollowups).toHaveLength(0);
  });

  it('does not send the packet if clipboard is unavailable and keeps original workstreams on hold',async()=>{
    await renderSeeded();
    await act(async()=>button('Copy local QL-286 packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
    expect(host.textContent).toContain('UNDER REVIEW');
  });
});
