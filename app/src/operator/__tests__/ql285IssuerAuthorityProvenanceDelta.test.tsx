// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {readFileSync} from 'node:fs';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OperatorShell} from '../OperatorShell';
import {QL270_SOURCES} from '../ql270ConnectionCentre';
import {ql276CaptureOwnerObservation} from '../ql276EvidenceIntake';
import {ql277CompareAccessibility} from '../ql277DriftReview';
import {ql278CreateRetestTicket} from '../ql278FollowupDesk';
import {ql279PrepareReviewerDraft,ql279PrepareArrivalClaim} from '../ql279ReviewerCustodyEscalation';
import {ql280PrepareReviewerReceipt} from '../ql280ReceiptReconciliation';
import {ql281PrepareChallengeRequest} from '../ql281SignatureProofCustody';
import {QL282_ACK_WORKSTREAM,ql282PrepareIssuerReview,ql282PrepareException} from '../ql282IssuerPublicationReview';
import {ql283PrepareTrustReference,ql283PrepareOwnerFollowup,ql283PrepareManualRecheck} from '../ql283IssuerTrustOwnerFollowup';
import {QL284_PUBLIC_SOURCE_RECHECK,ql284PrepareCrossCheck,ql284PrepareOwnerResponse,ql284PrepareSourceFollowup}
  from '../ql284ReviewerCrosscheckOwnerResponse';
import {QL285_OBSERVED_AT,QL285_PUBLIC_SOURCE_RECHECK,QL285_AUTHORITY_CHALLENGE_GATES,
  QL285_PROVENANCE_CLAIM_TYPES,ql285PinnedProofUrl,ql285PublicationDelta,ql285PrepareAuthorityAudit,
  ql285PrepareProvenance,ql285PrepareDeltaWorkItem,ql285AuditPacket} from '../ql285IssuerAuthorityProvenanceDelta';

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
function button(label:string){const result=[...host.querySelectorAll<HTMLButtonElement>('button')].find(row=>row.getAttribute('aria-label')===label||row.textContent?.includes(label));
  if(!result)throw Error(`Missing button ${label}`);return result;}
function input(selector:string,value:string){const element=host.querySelector<HTMLInputElement|HTMLTextAreaElement>(selector)!;
  const proto=element instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(element,value);
  element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));}
function select(selector:string,value:string){const element=host.querySelector<HTMLSelectElement>(selector)!;
  element.value=value;element.dispatchEvent(new Event('change',{bubbles:true}));}
async function openDesk(){await act(async()=>button('IT Command').click());
  await act(async()=>button('Issuer authority, owner provenance & source deltas').click());}
function crosscheckFixture(){
  const capture=(outcome:'observed'|'issue',when:string)=>{
    const result=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
      note:'Local keyboard focus observation recorded on a real device.'},new Date(when));
    if(!result.ok)throw Error(result.reason);return result.record;
  };
  const compare=ql277CompareAccessibility(capture('observed','2026-10-31T02:55:00Z'),capture('issue','2026-10-31T02:56:00Z'));
  const ticket=ql278CreateRetestTicket(compare);if(!ticket.ok)throw Error(ticket.reason);
  const reviewer=ql279PrepareReviewerDraft(ticket.ticket,'REVIEW-285-CASE','EVIDENCE_INCOMPLETE',
    'Independent original signature receipt is still missing.',new Date('2026-10-31T02:59:00Z'));
  if(!reviewer.ok)throw Error(reviewer.reason);
  const receipt=ql280PrepareReviewerReceipt(reviewer.draft,'RECEIPT-285-CASE',new Date('2026-10-31T03:06:00Z'));
  if(!receipt.ok)throw Error(receipt.reason);
  const challenge=ql281PrepareChallengeRequest(receipt.claim,'CHALLENGE-285-CASE',new Date('2026-10-31T03:47:00Z'));
  if(!challenge.ok)throw Error(challenge.reason);
  const issuer=ql282PrepareIssuerReview(challenge.request,'ISSUER-285-CASE',new Date('2026-10-31T04:22:00Z'));
  if(!issuer.ok)throw Error(issuer.reason);
  const trust=ql283PrepareTrustReference(issuer.request,'TRUST-285-CASE',new Date('2026-10-31T05:17:00Z'));
  if(!trust.ok)throw Error(trust.reason);
  const cross=ql284PrepareCrossCheck(trust.draft,'CROSSCHECK-285-CASE',new Date('2026-10-31T13:35:00Z'));
  if(!cross.ok)throw Error(cross.reason);return cross.draft;
}
function responseFixture(source:'yw'|'icamp'='yw'){
  const exception=ql282PrepareException(source,'EXCEPTION-285-CASE',new Date('2026-10-31T04:22:00Z'));
  if(!exception.ok)throw Error(exception.reason);
  const followup=ql283PrepareOwnerFollowup(exception.draft,'FOLLOWUP-285-CASE',new Date('2026-10-31T05:17:00Z'));
  if(!followup.ok)throw Error(followup.reason);
  const response=ql284PrepareOwnerResponse(followup.draft,'RESPONSE-285-CASE','ORIGINAL_SOURCE_CLAIMED',new Date('2026-10-31T13:35:00Z'));
  if(!response.ok)throw Error(response.reason);return response.draft;
}
function sourceFixture(source:'rosiedazzlers'|'yw'='rosiedazzlers'){
  const recheck=ql283PrepareManualRecheck(source,'RECHECK-285-CASE',new Date('2026-10-31T05:17:00Z'));
  if(!recheck.ok)throw Error(recheck.reason);
  const followup=ql284PrepareSourceFollowup(recheck.draft,'REVALIDATE-285-CASE',new Date('2026-10-31T13:35:00Z'));
  if(!followup.ok)throw Error(followup.reason);return followup.draft;
}

describe('QL-285 independent issuer authority challenge preconditions, owner provenance and public source delta',()=>{
  it('records actual six immutable main refs, five changed, one unchanged and all HTTP 404 original paths',()=>{
    expect(QL285_OBSERVED_AT).toBe('2026-10-31T13:58:08Z');
    expect(QL285_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL285_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    for(const row of QL285_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);expect(row.http).toBe(404);
      expect(ql285PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
      expect(ql285PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');}
    const delta=ql285PublicationDelta('2026-10-31T14:01:00Z');
    expect(delta).toMatchObject({moved:5,unchanged:1,missing:6,sources:6,originalsAccepted:0,
      authenticatedSourceGets:0,automaticPolling:false,freshness:'PINNED_RECENT',release:'DISCONNECTED / HOLD'});
    expect(delta.rows.filter(row=>row.moved).map(row=>row.source)).toEqual(['ai-data-platform','devilndove','rosiedazzlers','icamp','rosevear-ai-hub']);
    expect(delta.rows.filter(row=>!row.moved).map(row=>row.source)).toEqual(['yw']);
    expect(()=>ql285PinnedProofUrl('unregistered' as never)).toThrow('UNKNOWN_QL285_SOURCE');
  });

  it('preserves correct delta status, 24-hour expiry, future clocks and manual-only recheck policy',()=>{
    expect(ql285PublicationDelta('2026-11-01T13:58:08Z').freshness).toBe('PUBLIC_RECHECK_DUE');
    expect(ql285PublicationDelta('2026-10-31T13:58:07Z')).toMatchObject({freshness:'CLOCK_REVIEW',ageHours:null});
    expect(ql285PublicationDelta('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql285PublicationDelta(QL285_OBSERVED_AT).nextRecheckAt).toBe('2026-11-01T13:58:08.000Z');
    const delta=ql285PublicationDelta(QL285_OBSERVED_AT);
    expect(delta.rows.every(row=>row.queue==='PUBLICATION_EXCEPTION_DELTA_REVIEW'&&!row.originalVerified&&!row.authenticatedGET)).toBe(true);
    expect(delta.rows.find(row=>row.source==='yw')?.reason).toBe('UNCHANGED_SHA_ORIGINAL_404');
    expect(delta.rows.find(row=>row.source==='icamp')?.reason).toBe('CHANGED_SHA_ORIGINAL_404');
  });

  it('flags post-snapshot arrival notices and outdated immutable source pins without accepting them',()=>{
    const old=ql279PrepareArrivalClaim('rosiedazzlers','SOURCE_PUBLICATION_NOTICE','NOTICE-285-OLD',new Date('2026-10-31T13:45:00Z'));
    const late=ql279PrepareArrivalClaim('yw','SOURCE_PUBLICATION_NOTICE','NOTICE-285-LATE',new Date('2026-10-31T14:01:00Z'));
    if(!old.ok||!late.ok)throw Error('Invalid notice fixture');
    const delta=ql285PublicationDelta('2026-10-31T14:02:00Z',[old.claim,late.claim]);
    expect(delta.rows.find(row=>row.source==='rosiedazzlers')).toMatchObject({notices:1,postSnapshotNotices:0,stalePinNotices:1});
    expect(delta.rows.find(row=>row.source==='yw')).toMatchObject({notices:1,postSnapshotNotices:1,stalePinNotices:1});
  });

  it('prepares unissued issuer trust authority challenge audit with seven unsatisfied conditions',()=>{
    expect(QL285_AUTHORITY_CHALLENGE_GATES).toHaveLength(7);
    const result=ql285PrepareAuthorityAudit(crosscheckFixture(),'AUTHORITY-285-CASE',new Date('2026-10-31T14:01:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({checkId:'keyboard',crosscheckReference:'CROSSCHECK-285-CASE',
      verified:0,issuer:'NOT_AUTHENTICATED',reviewer:'NOT_AUTHENTICATED',challenge:'NOT_ISSUED',
      signature:'NOT_VERIFIED',ownerApproval:'NOT_GIVEN',
      disposition:'AUTHORITY_CHALLENGE_PRECONDITIONS_ONLY',state:'LOCAL_UNVERIFIED_AUDIT'});
  });

  it('rejects forged reviewer/issuer authority, altered predecessor gates, secret references and invalid chronology',()=>{
    const cross=crosscheckFixture();const prepare=(row:typeof cross,ref='AUTHORITY-285-CASE',when='2026-10-31T14:01:00Z')=>
      ql285PrepareAuthorityAudit(row,ref,new Date(when));
    expect(prepare({...cross,verified:1 as never}).ok).toBe(false);
    expect(prepare({...cross,reviewer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(prepare({...cross,issuer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(prepare({...cross,keyPin:'VERIFIED' as never}).ok).toBe(false);
    expect(prepare({...cross,signature:'VERIFIED' as never}).ok).toBe(false);
    expect(prepare({...cross,gates:[] as never}).ok).toBe(false);
    expect(prepare({...cross,gates:[...cross.gates].map(row=>({...row,status:'VERIFIED'})) as never}).ok).toBe(false);
    expect(prepare(cross,'token-private').ok).toBe(false);
    expect(prepare(cross,'bad').ok).toBe(false);
    expect(prepare(cross,'AUTHORITY-285-CASE','2026-10-31T13:34:00Z').ok).toBe(false);
    expect(prepare(cross,'AUTHORITY-285-CASE','invalid').ok).toBe(false);
  });

  it('quarantines unverified owner provenance references, retaining prior/current source pin drift',()=>{
    expect(QL285_PROVENANCE_CLAIM_TYPES).toHaveLength(3);
    const result=ql285PrepareProvenance(responseFixture('icamp'),'PROVENANCE-285-CASE',
      'INDEPENDENT_WITNESS_REFERENCE',new Date('2026-10-31T14:01:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'icamp',provenanceType:'INDEPENDENT_WITNESS_REFERENCE',
      ownerIdentity:'NOT_AUTHENTICATED',originalReceipt:'NOT_VERIFIED',
      original:'HTTP_404_AT_IMMUTABLE_PIN',provenance:'UNAVAILABLE_FOR_INDEPENDENT_RECONCILIATION',
      routed:false,resolved:false,disposition:'QUARANTINED_REFERENCE_CLAIM',state:'LOCAL_UNVERIFIED_REVIEW'});
    expect(result.draft.priorSha).toBe(QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='icamp')?.sha);
    expect(result.draft.latestSha).toBe(QL285_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='icamp')?.sha);
  });

  it('rejects forged original owner identity, claimed receipt verification and unknown provenance types',()=>{
    const response=responseFixture();const prepare=(row:typeof response,ref='PROVENANCE-285-CASE',type='OWNER_SOURCE_REFERENCE',when='2026-10-31T14:01:00Z')=>
      ql285PrepareProvenance(row,ref,type as never,new Date(when));
    expect(prepare({...response,ownerIdentity:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(prepare({...response,responseReceipt:'VERIFIED' as never}).ok).toBe(false);
    expect(prepare({...response,externallyContacted:true as never}).ok).toBe(false);
    expect(prepare({...response,routed:true as never}).ok).toBe(false);
    expect(prepare({...response,resolved:true as never}).ok).toBe(false);
    expect(prepare({...response,observedSourceSha:'0'.repeat(40)}).ok).toBe(false);
    expect(prepare({...response,source:'unknown' as never}).ok).toBe(false);
    expect(prepare(response,'secret-private').ok).toBe(false);
    expect(prepare(response,'bad').ok).toBe(false);
    expect(prepare(response,'PROVENANCE-285-CASE','UNSUPPORTED').ok).toBe(false);
    expect(prepare(response,'PROVENANCE-285-CASE','OWNER_SOURCE_REFERENCE','2026-10-31T13:58:07Z').ok).toBe(false);
    expect(prepare(response,'PROVENANCE-285-CASE','OWNER_SOURCE_REFERENCE','invalid').ok).toBe(false);
  });

  it('creates an unscheduled/never-executed source delta work item after genuine QL-284 local predecessor',()=>{
    const changed=ql285PrepareDeltaWorkItem(sourceFixture('rosiedazzlers'),'DELTA-285-CASE',new Date('2026-10-31T14:01:00Z'));
    expect(changed.ok).toBe(true);if(!changed.ok)throw Error(changed.reason);
    expect(changed.draft).toMatchObject({source:'rosiedazzlers',sourceChanged:true,
      previousCase:'REVALIDATE-285-CASE',original:'HTTP_404_AT_IMMUTABLE_PIN',
      reviewScheduled:false,reviewExecuted:false,originalAccepted:false,
      state:'LOCAL_PENDING_PUBLICATION_DELTA_REVIEW'});
    const unchanged=ql285PrepareDeltaWorkItem(sourceFixture('yw'),'DELTA-285-YW',new Date('2026-10-31T14:01:00Z'));
    expect(unchanged.ok&&unchanged.draft.sourceChanged).toBe(false);
  });

  it('rejects false executed source work, mismatched immutable predecessor SHA, secrets and invalid clocks',()=>{
    const followup=sourceFixture();const prepare=(row:typeof followup,ref='DELTA-285-CASE',when='2026-10-31T14:01:00Z')=>
      ql285PrepareDeltaWorkItem(row,ref,new Date(when));
    expect(prepare({...followup,taskScheduled:true as never}).ok).toBe(false);
    expect(prepare({...followup,taskExecuted:true as never}).ok).toBe(false);
    expect(prepare({...followup,originalAccepted:true as never}).ok).toBe(false);
    expect(prepare({...followup,observedSha:'0'.repeat(40)}).ok).toBe(false);
    expect(prepare({...followup,source:'unregistered' as never}).ok).toBe(false);
    expect(prepare(followup,'password-private').ok).toBe(false);
    expect(prepare(followup,'bad').ok).toBe(false);
    expect(prepare(followup,'DELTA-285-CASE','2026-10-31T13:58:07Z').ok).toBe(false);
    expect(prepare(followup,'DELTA-285-CASE','invalid').ok).toBe(false);
  });

  it('preserves user-directed ACK Under Review separately from six-app integration security HOLD',()=>{
    const packet=JSON.parse(ql285AuditPacket([],[],[],'2026-10-31T14:01:00Z'));
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER'});
    expect(packet.ackDeliveryEvidence).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.integrationSecurity).toMatchObject({state:'DISCONNECTED / HOLD',originalsAccepted:0,
      authenticatedGETs:0,realCalls:0,sms:0,signerAccess:false,ownerTestApproval:false});
    expect(packet.publicationDelta).toMatchObject({moved:5,unchanged:1,missing:6,automaticPolling:false});
    expect(packet.authorityChallenge).toMatchObject({verified:0,challengeIssued:false});
    expect(packet.ownerProvenance).toMatchObject({authenticatedOwnerResponses:0,originalsVerified:0});
  });

  it('renders accessible review topics, 5/1 source drift filters, six immutable links and parked ACK',async()=>{
    await openDesk();expect(host.querySelector('[data-ql285-desk]')).not.toBeNull();
    expect(button('Prepare authority challenge audit').disabled).toBe(true);
    await act(async()=>button('03 Six-app publication deltas').click());
    expect(host.querySelectorAll('.ql283-source-row:not(.heading)')).toHaveLength(6);
    await act(async()=>button('SHA moved (5)').click());expect(host.querySelectorAll('.ql283-source-row:not(.heading)')).toHaveLength(5);
    await act(async()=>button('SHA unchanged (1)').click());expect(host.querySelectorAll('.ql283-source-row:not(.heading)')).toHaveLength(1);
    await act(async()=>button('All sources (6)').click());
    expect(host.querySelectorAll('.ql283-source-row a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    expect(host.querySelector('#ql285-ack-title')?.textContent).toContain('UNDER REVIEW');
    expect(host.querySelector('.ql283-parked-note input')).toBeNull();
    expect(host.querySelector('.ql283-parked-note button')).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('carries QL-284 unverified owner-response claim into QL-285 provenance quarantine without external sends',async()=>{
    await openDesk();await act(async()=>button('Open QL-284 cross-check source').click());
    await act(async()=>button('Open QL-283 trust source').click());
    await act(async()=>button('Open QL-282 issuer source').click());
    await act(async()=>button('02 Proof-B publication exceptions').click());
    await act(async()=>select('#ql282-source','icamp'));
    await act(async()=>input('#ql282-exception-ref','EXCEPTION-285-LOCAL'));
    await act(async()=>button('Prepare local source publication triage').click());
    await act(async()=>button('Issuer trust, owner follow-up & SHA recheck').click());
    await act(async()=>button('02 Publication owner follow-up').click());
    await act(async()=>input('#ql283-owner-ref','FOLLOWUP-285-LOCAL'));
    await act(async()=>button('Prepare unsent owner follow-up').click());
    await act(async()=>button('Reviewer cross-check, owner response & Proof-B revalidation').click());
    await act(async()=>button('02 Publication owner response').click());
    await act(async()=>input('#ql284-owner-ref','RESPONSE-285-LOCAL'));
    await act(async()=>button('Record unverified response claim').click());
    await act(async()=>button('Issuer authority, owner provenance & source deltas').click());
    await act(async()=>button('02 Owner response provenance').click());
    expect(host.textContent).toContain('RESPONSE-285-LOCAL');
    await act(async()=>select('#ql285-provenance-type','CUSTODIAN_RECEIPT_REFERENCE'));
    await act(async()=>input('#ql285-provenance-ref','PROVENANCE-285-LOCAL'));
    await act(async()=>button('Prepare quarantined provenance review').click());
    expect(host.textContent).toContain('PROVENANCE-285-LOCAL');
    expect(host.textContent).toContain('original receipt NOT VERIFIED');
    expect(localStorage.length).toBe(0);
  });

  it('carries QL-284 manual public source follow-up into QL-285 local publication delta worklist',async()=>{
    await openDesk();await act(async()=>button('Open QL-284 cross-check source').click());
    await act(async()=>button('Open QL-283 trust source').click());
    await act(async()=>button('03 Six-app SHA recheck queue').click());
    await act(async()=>select('#ql283-recheck-source','rosiedazzlers'));
    await act(async()=>input('#ql283-recheck-ref','RECHECK-285-LOCAL'));
    await act(async()=>button('Add to local manual recheck queue').click());
    await act(async()=>button('Reviewer cross-check, owner response & Proof-B revalidation').click());
    await act(async()=>button('03 Six-app Proof-B revalidation').click());
    await act(async()=>input('#ql284-recheck-ref','REVALIDATE-285-LOCAL'));
    await act(async()=>button('Prepare manual source follow-up').click());
    await act(async()=>button('Issuer authority, owner provenance & source deltas').click());
    await act(async()=>button('03 Six-app publication deltas').click());
    await act(async()=>input('#ql285-delta-ref','DELTA-285-LOCAL'));
    await act(async()=>button('Prepare local delta review item').click());
    expect(host.textContent).toContain('DELTA-285-LOCAL');
    expect(host.textContent).toContain('executed NO');
    expect(localStorage.length).toBe(0);
  });

  it('keeps QL-285 packet read-only, copy-only and safe on clipboard denial and clear',async()=>{
    await openDesk();expect(host.querySelector<HTMLTextAreaElement>('#ql285-packet')?.readOnly).toBe(true);
    await act(async()=>button('Copy QL-285 local audit packet').click());expect(host.textContent).toContain('Clipboard unavailable');
    const copied=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async()=>button('Copy QL-285 local audit packet').click());expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('PARKED_FOR_LATER');
    await act(async()=>button('Clear QL-285 local drafts').click());
    expect(host.textContent).toContain('immutable observations and parked ACK decision were preserved');
    expect(localStorage.length).toBe(0);
  });

  it('preserves keyboard focus, mobile layout, forced colors and reduced motion',()=>{
    const css=readFileSync('src/operator/ql285-authority-provenance.css','utf8');
    expect(css).toContain('max-width:640px');expect(css).toContain('focus-visible');
    expect(css).toContain('forced-colors:active');expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
