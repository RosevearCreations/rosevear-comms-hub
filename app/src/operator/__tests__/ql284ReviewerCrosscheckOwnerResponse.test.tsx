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
import {QL283_PUBLIC_SOURCE_RECHECK,ql283PrepareTrustReference,ql283PrepareOwnerFollowup,ql283PrepareManualRecheck}
  from '../ql283IssuerTrustOwnerFollowup';
import {QL284_OBSERVED_AT,QL284_PUBLIC_SOURCE_RECHECK,QL284_REVIEWER_CROSSCHECK_GATES,
  QL284_OWNER_RESPONSE_CLAIM_TYPES,ql284PinnedProofUrl,ql284SourceRevalidation,
  ql284PrepareCrossCheck,ql284PrepareOwnerResponse,ql284PrepareSourceFollowup,ql284AuditPacket}
  from '../ql284ReviewerCrosscheckOwnerResponse';

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
  await act(async()=>button('Reviewer cross-check, owner response & Proof-B revalidation').click());}
function trustFixture(){
  const capture=(outcome:'observed'|'issue',when:string)=>{
    const result=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
      note:'A real local keyboard focus observation is recorded.'},new Date(when));
    if(!result.ok)throw Error(result.reason);return result.record;
  };
  const comparison=ql277CompareAccessibility(capture('observed','2026-10-31T02:55:00Z'),capture('issue','2026-10-31T02:56:00Z'));
  const ticket=ql278CreateRetestTicket(comparison);if(!ticket.ok)throw Error(ticket.reason);
  const reviewer=ql279PrepareReviewerDraft(ticket.ticket,'REVIEW-284-CASE','EVIDENCE_INCOMPLETE',
    'Original signed reviewer evidence was not independently verified.',new Date('2026-10-31T02:59:00Z'));
  if(!reviewer.ok)throw Error(reviewer.reason);
  const receipt=ql280PrepareReviewerReceipt(reviewer.draft,'RECEIPT-284-CASE',new Date('2026-10-31T03:06:00Z'));
  if(!receipt.ok)throw Error(receipt.reason);
  const challenge=ql281PrepareChallengeRequest(receipt.claim,'CHALLENGE-284-CASE',new Date('2026-10-31T03:47:00Z'));
  if(!challenge.ok)throw Error(challenge.reason);
  const issuer=ql282PrepareIssuerReview(challenge.request,'ISSUER-284-CASE',new Date('2026-10-31T04:22:00Z'));
  if(!issuer.ok)throw Error(issuer.reason);
  const trust=ql283PrepareTrustReference(issuer.request,'TRUST-284-CASE',new Date('2026-10-31T05:17:00Z'));
  if(!trust.ok)throw Error(trust.reason);return trust.draft;
}
function ownerFixture(source:'yw'|'icamp'='yw'){
  const exception=ql282PrepareException(source,'EXCEPTION-284-CASE',new Date('2026-10-31T04:22:00Z'));
  if(!exception.ok)throw Error(exception.reason);
  const followup=ql283PrepareOwnerFollowup(exception.draft,'FOLLOWUP-284-CASE',new Date('2026-10-31T05:17:00Z'));
  if(!followup.ok)throw Error(followup.reason);return followup.draft;
}
function recheckFixture(){
  const result=ql283PrepareManualRecheck('rosiedazzlers','RECHECK-284-CASE',new Date('2026-10-31T05:17:00Z'));
  if(!result.ok)throw Error(result.reason);return result.draft;
}

describe('QL-284 independent reviewer reference cross-check, owner response intake and immutable source revalidation',()=>{
  it('records six actual public main SHA and immutable original path checks with four moved and two unchanged',()=>{
    expect(QL284_OBSERVED_AT).toBe('2026-10-31T13:31:38Z');
    expect(QL284_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL284_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    for(const row of QL284_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);expect(row.http).toBe(404);
      expect(ql284PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
      expect(ql284PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');}
    const r=ql284SourceRevalidation('2026-10-31T13:35:00Z');
    expect(r).toMatchObject({moved:4,unchanged:2,missing:6,sources:6,originalsAccepted:0,
      authenticatedSourceGets:0,automaticPolling:false,freshness:'PINNED_RECENT',release:'DISCONNECTED / HOLD'});
    expect(r.rows.filter(row=>row.moved).map(row=>row.source)).toEqual(['ai-data-platform','devilndove','rosiedazzlers','icamp']);
    expect(r.rows.filter(row=>!row.moved).map(row=>row.source)).toEqual(['yw','rosevear-ai-hub']);
    expect(()=>ql284PinnedProofUrl('unknown' as never)).toThrow('UNKNOWN_QL284_SOURCE');
  });

  it('enforces 24-hour freshness, invalid clocks and exact next public GET time without auto polling',()=>{
    expect(ql284SourceRevalidation('2026-11-01T13:31:38Z').freshness).toBe('PUBLIC_RECHECK_DUE');
    expect(ql284SourceRevalidation('2026-10-31T13:31:37Z')).toMatchObject({freshness:'CLOCK_REVIEW',ageHours:null});
    expect(ql284SourceRevalidation('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql284SourceRevalidation(QL284_OBSERVED_AT).nextRecheckAt).toBe('2026-11-01T13:31:38.000Z');
    expect(ql284SourceRevalidation(QL284_OBSERVED_AT).rows.every(row=>row.status==='ORIGINAL_PUBLICATION_EXCEPTION_OPEN'&&
      !row.originalVerified&&!row.authenticatedSourceGet)).toBe(true);
  });

  it('preserves pre/post-snapshot claims without treating outdated source pins as verified',()=>{
    const early=ql279PrepareArrivalClaim('devilndove','SOURCE_PUBLICATION_NOTICE','NOTICE-284-EARLY',new Date('2026-10-31T13:00:00Z'));
    const late=ql279PrepareArrivalClaim('yw','SOURCE_PUBLICATION_NOTICE','NOTICE-284-LATE',new Date('2026-10-31T13:35:00Z'));
    if(!early.ok||!late.ok)throw Error('Invalid notice fixtures');
    const r=ql284SourceRevalidation('2026-10-31T13:36:00Z',[early.claim,late.claim]);
    expect(r.rows.find(row=>row.source==='devilndove')).toMatchObject({notices:1,postSnapshotNotices:0,stalePinNotices:1});
    expect(r.rows.find(row=>row.source==='yw')).toMatchObject({notices:1,postSnapshotNotices:1,stalePinNotices:1});
  });

  it('prepares only pending independent trust cross-check with seven unverified gates',()=>{
    expect(QL284_REVIEWER_CROSSCHECK_GATES).toHaveLength(7);
    const result=ql284PrepareCrossCheck(trustFixture(),'CROSSCHECK-284-CASE',new Date('2026-10-31T13:35:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({checkId:'keyboard',trustReference:'TRUST-284-CASE',
      verified:0,reviewer:'NOT_AUTHENTICATED',issuer:'NOT_AUTHENTICATED',keyPin:'NOT_VERIFIED',
      signature:'NOT_VERIFIED',ownerApproval:'NOT_GIVEN',
      disposition:'INDEPENDENT_CROSSCHECK_PENDING',state:'LOCAL_UNVERIFIED_CLAIM'});
  });

  it('fails closed on forged trust gates, false issuer trust, secret references and invalid chronology',()=>{
    const trust=trustFixture();const prepare=(row:typeof trust,ref='CROSSCHECK-284-CASE',when='2026-10-31T13:35:00Z')=>
      ql284PrepareCrossCheck(row,ref,new Date(when));
    expect(prepare({...trust,verified:1 as never}).ok).toBe(false);
    expect(prepare({...trust,issuer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(prepare({...trust,keyPin:'VERIFIED' as never}).ok).toBe(false);
    expect(prepare({...trust,challenge:'ISSUED' as never}).ok).toBe(false);
    expect(prepare({...trust,gates:[] as never}).ok).toBe(false);
    expect(prepare({...trust,gates:[...trust.gates].map(g=>({...g,status:'VERIFIED'})) as never}).ok).toBe(false);
    expect(prepare(trust,'secret-review').ok).toBe(false);
    expect(prepare(trust,'bad').ok).toBe(false);
    expect(prepare(trust,'CROSSCHECK-284-CASE','2026-10-31T05:16:00Z').ok).toBe(false);
    expect(prepare(trust,'CROSSCHECK-284-CASE','invalid').ok).toBe(false);
  });

  it('intakes owner response as an explicitly unverified local claim without authentication or routing',()=>{
    expect(QL284_OWNER_RESPONSE_CLAIM_TYPES).toHaveLength(3);
    const result=ql284PrepareOwnerResponse(ownerFixture('icamp'),'RESPONSE-284-CASE',
      'ORIGINAL_SOURCE_CLAIMED',new Date('2026-10-31T13:35:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'icamp',responseType:'ORIGINAL_SOURCE_CLAIMED',
      ownerIdentity:'NOT_AUTHENTICATED',responseReceipt:'NOT_VERIFIED',
      original:'HTTP_404_AT_IMMUTABLE_PIN',externallyContacted:false,delivered:false,
      routed:false,resolved:false,state:'LOCAL_UNVERIFIED_CLAIM'});
    expect(result.draft.followupSourceSha).toBe(QL283_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='icamp')?.sha);
    expect(result.draft.observedSourceSha).toBe(QL284_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='icamp')?.sha);
  });

  it('rejects forged owner follow-up, unsupported response types and out-of-order claims',()=>{
    const owner=ownerFixture();const prepare=(row:typeof owner,ref='RESPONSE-284-CASE',type='ORIGINAL_PUBLICATION_PENDING',when='2026-10-31T13:35:00Z')=>
      ql284PrepareOwnerResponse(row,ref,type as never,new Date(when));
    expect(prepare({...owner,ownerContacted:true as never}).ok).toBe(false);
    expect(prepare({...owner,routed:true as never}).ok).toBe(false);
    expect(prepare({...owner,resolved:true as never}).ok).toBe(false);
    expect(prepare({...owner,currentSourceSha:'0'.repeat(40)}).ok).toBe(false);
    expect(prepare({...owner,source:'unknown' as never}).ok).toBe(false);
    expect(prepare(owner,'token-private').ok).toBe(false);
    expect(prepare(owner,'bad').ok).toBe(false);
    expect(prepare(owner,'RESPONSE-284-CASE','FORGED_RESPONSE').ok).toBe(false);
    expect(prepare(owner,'RESPONSE-284-CASE','ORIGINAL_PUBLICATION_PENDING','2026-10-31T13:31:37Z').ok).toBe(false);
    expect(prepare(owner,'RESPONSE-284-CASE','ORIGINAL_PUBLICATION_PENDING','invalid').ok).toBe(false);
  });

  it('prepares local manual revalidation follow-up from an unexecuted QL-283 source request only',()=>{
    const result=ql284PrepareSourceFollowup(recheckFixture(),'REVALIDATE-284-CASE',new Date('2026-10-31T13:35:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'rosiedazzlers',manualCaseReference:'RECHECK-284-CASE',
      original:'HTTP_404_AT_IMMUTABLE_PIN',taskScheduled:false,taskExecuted:false,
      originalAccepted:false,state:'LOCAL_PENDING_REVALIDATION_REVIEW'});
    expect(result.draft.previousSha).not.toBe(result.draft.observedSha);
  });

  it('rejects false completed manual rechecks, malformed source pins, secret refs and old clocks',()=>{
    const before=recheckFixture();const prepare=(row:typeof before,ref='REVALIDATE-284-CASE',when='2026-10-31T13:35:00Z')=>
      ql284PrepareSourceFollowup(row,ref,new Date(when));
    expect(prepare({...before,scheduled:true as never}).ok).toBe(false);
    expect(prepare({...before,executed:true as never}).ok).toBe(false);
    expect(prepare({...before,sourceSha:'0'.repeat(40)}).ok).toBe(false);
    expect(prepare({...before,source:'unknown' as never}).ok).toBe(false);
    expect(prepare(before,'password-private').ok).toBe(false);
    expect(prepare(before,'bad').ok).toBe(false);
    expect(prepare(before,'REVALIDATE-284-CASE','2026-10-31T13:31:37Z').ok).toBe(false);
    expect(prepare(before,'REVALIDATE-284-CASE','invalid').ok).toBe(false);
  });

  it('separates parked ACK delivery evidence from DISCONNECTED integration security in the packet',()=>{
    const packet=JSON.parse(ql284AuditPacket([],[],[],'2026-10-31T13:35:00Z'));
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER'});
    expect(packet.acknowledgementDeliveryEvidence).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.integrationSecurity).toMatchObject({state:'DISCONNECTED / HOLD',authenticatedGETs:0,realCalls:0,sms:0,
      signerAccess:false,ownerTestApproval:false});
    expect(packet.publicSourceRevalidation).toMatchObject({moved:4,unchanged:2,missing:6,automaticPolling:false});
  });

  it('renders three accessible topics, source drift filters, immutable public links and parked ACK',async()=>{
    await openDesk();expect(host.querySelector('[data-ql284-desk]')).not.toBeNull();
    expect(button('Prepare independent cross-check request').disabled).toBe(true);
    await act(async()=>button('03 Six-app Proof-B revalidation').click());
    expect(host.querySelectorAll('.ql283-source-row:not(.heading)')).toHaveLength(6);
    await act(async()=>button('Changed (4)').click());expect(host.querySelectorAll('.ql283-source-row:not(.heading)')).toHaveLength(4);
    await act(async()=>button('Unchanged (2)').click());expect(host.querySelectorAll('.ql283-source-row:not(.heading)')).toHaveLength(2);
    await act(async()=>button('All six (6)').click());
    expect(host.querySelectorAll('.ql283-source-row a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    expect(host.querySelector('#ql284-ack-title')?.textContent).toContain('UNDER REVIEW');
    expect(host.querySelector('.ql283-parked-note input')).toBeNull();
    expect(host.querySelector('.ql283-parked-note button')).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('preserves QL-283 owner follow-up into a QL-284 claimed owner response with no external action',async()=>{
    await openDesk();await act(async()=>button('Open QL-283 trust source').click());
    await act(async()=>button('Open QL-282 issuer source').click());
    await act(async()=>button('02 Proof-B publication exceptions').click());
    await act(async()=>select('#ql282-source','icamp'));
    await act(async()=>input('#ql282-exception-ref','EXCEPTION-284-LOCAL'));
    await act(async()=>button('Prepare local source publication triage').click());
    await act(async()=>button('Issuer trust, owner follow-up & SHA recheck').click());
    await act(async()=>button('02 Publication owner follow-up').click());
    await act(async()=>input('#ql283-owner-ref','FOLLOWUP-284-LOCAL'));
    await act(async()=>button('Prepare unsent owner follow-up').click());
    await act(async()=>button('Reviewer cross-check, owner response & Proof-B revalidation').click());
    await act(async()=>button('02 Publication owner response').click());
    expect(host.textContent).toContain('FOLLOWUP-284-LOCAL');
    await act(async()=>select('#ql284-owner-response-type','ORIGINAL_SOURCE_CLAIMED'));
    await act(async()=>input('#ql284-owner-ref','RESPONSE-284-LOCAL'));
    await act(async()=>button('Record unverified response claim').click());
    expect(host.textContent).toContain('RESPONSE-284-LOCAL');
    expect(host.textContent).toContain('Owner identity NOT AUTHENTICATED');
    expect(localStorage.length).toBe(0);
  });

  it('preserves QL-283 manual recheck predecessor across tabs for a new unsent source follow-up',async()=>{
    await openDesk();await act(async()=>button('Open QL-283 trust source').click());
    await act(async()=>button('03 Six-app SHA recheck queue').click());
    await act(async()=>select('#ql283-recheck-source','rosiedazzlers'));
    await act(async()=>input('#ql283-recheck-ref','RECHECK-284-LOCAL'));
    await act(async()=>button('Add to local manual recheck queue').click());
    await act(async()=>button('Reviewer cross-check, owner response & Proof-B revalidation').click());
    await act(async()=>button('03 Six-app Proof-B revalidation').click());
    await act(async()=>input('#ql284-recheck-ref','REVALIDATE-284-LOCAL'));
    await act(async()=>button('Prepare manual source follow-up').click());
    expect(host.textContent).toContain('REVALIDATE-284-LOCAL');
    expect(host.textContent).toContain('executed NO');
    expect(localStorage.length).toBe(0);
  });

  it('keeps clipboard export copy-only, clear local only, with safe fallback',async()=>{
    await openDesk();expect(host.querySelector<HTMLTextAreaElement>('#ql284-packet')?.readOnly).toBe(true);
    await act(async()=>button('Copy QL-284 local review packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async()=>button('Copy QL-284 local review packet').click());expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('PARKED_FOR_LATER');
    await act(async()=>button('Clear QL-284 local drafts').click());
    expect(host.textContent).toContain('pinned public observation and parked ACK status were preserved');
    expect(localStorage.length).toBe(0);
  });

  it('maintains keyboard focus, responsive grids, forced colours and reduced-motion support',()=>{
    const css=readFileSync('src/operator/ql284-reviewer-crosscheck.css','utf8');
    expect(css).toContain('max-width:640px');expect(css).toContain('focus-visible');
    expect(css).toContain('forced-colors:active');expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
