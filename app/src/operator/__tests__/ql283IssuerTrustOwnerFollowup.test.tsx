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
import {QL282_PUBLIC_SOURCE_RECHECK,QL282_ACK_WORKSTREAM,ql282PrepareIssuerReview,ql282PrepareException} from '../ql282IssuerPublicationReview';
import {QL283_OBSERVED_AT,QL283_PUBLIC_SOURCE_RECHECK,QL283_ISSUER_TRUST_GATES,
  ql283PinnedProofUrl,ql283SourceQueue,ql283PrepareTrustReference,ql283PrepareOwnerFollowup,
  ql283PrepareManualRecheck,ql283AuditPacket} from '../ql283IssuerTrustOwnerFollowup';

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
  await act(async()=>button('Issuer trust, owner follow-up & SHA recheck').click());}
function originalIssuer(){
  const capture=(outcome:'observed'|'issue',when:string)=>{
    const result=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
      note:'Independent focus check recorded on a local device.'},new Date(when));
    if(!result.ok)throw Error(result.reason);return result.record;
  };
  const comparison=ql277CompareAccessibility(capture('observed','2026-10-31T02:55:00Z'),capture('issue','2026-10-31T02:56:00Z'));
  const ticket=ql278CreateRetestTicket(comparison);if(!ticket.ok)throw Error(ticket.reason);
  const reviewer=ql279PrepareReviewerDraft(ticket.ticket,'REVIEW-283-CASE','EVIDENCE_INCOMPLETE',
    'Original independent reviewer signature evidence remains absent.',new Date('2026-10-31T02:59:00Z'));
  if(!reviewer.ok)throw Error(reviewer.reason);
  const receipt=ql280PrepareReviewerReceipt(reviewer.draft,'RECEIPT-283-CASE',new Date('2026-10-31T03:06:00Z'));
  if(!receipt.ok)throw Error(receipt.reason);
  const challenge=ql281PrepareChallengeRequest(receipt.claim,'CHALLENGE-283-CASE',new Date('2026-10-31T03:47:00Z'));
  if(!challenge.ok)throw Error(challenge.reason);
  const issuer=ql282PrepareIssuerReview(challenge.request,'ISSUER-283-CASE',new Date('2026-10-31T04:22:00Z'));
  if(!issuer.ok)throw Error(issuer.reason);return issuer.request;
}
function originalException(source:'yw'|'icamp'='yw'){
  const result=ql282PrepareException(source,'EXCEPTION-283-CASE',new Date('2026-10-31T04:22:00Z'));
  if(!result.ok)throw Error(result.reason);return result.draft;
}

describe('QL-283 issuer trust reference, publication owner follow-up and public SHA recheck queue',()=>{
  it('pins all six independently observed public main SHAs, all moved with HTTP 404 original proofs',()=>{
    expect(QL283_OBSERVED_AT).toBe('2026-10-31T05:13:30Z');
    expect(QL283_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL283_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    for(const row of QL283_PUBLIC_SOURCE_RECHECK){
      expect(row.sha).toMatch(/^[0-9a-f]{40}$/);expect(row.http).toBe(404);
      expect(row.sha).not.toBe(QL282_PUBLIC_SOURCE_RECHECK.find(old=>old.source===row.source)?.sha);
      expect(ql283PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
      expect(ql283PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');
    }
    expect(ql283SourceQueue('2026-10-31T05:15:00Z')).toMatchObject({moved:6,unchanged:0,missing:6,
      sources:6,originalsAccepted:0,authenticatedSourceGets:0,automaticPolling:false,
      release:'DISCONNECTED / HOLD',freshness:'PINNED_RECENT'});
    expect(()=>ql283PinnedProofUrl('unknown' as never)).toThrow('UNKNOWN_QL283_SOURCE');
  });

  it('calculates queue freshness and independent revisit due time without pretending to poll',()=>{
    expect(ql283SourceQueue('2026-11-01T05:13:30Z').freshness).toBe('PUBLIC_RECHECK_DUE');
    expect(ql283SourceQueue('2026-10-31T05:13:29Z')).toMatchObject({freshness:'CLOCK_REVIEW',ageHours:null});
    expect(ql283SourceQueue('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql283SourceQueue(QL283_OBSERVED_AT).nextRecheckAt).toBe('2026-11-01T05:13:30.000Z');
    expect(ql283SourceQueue(QL283_OBSERVED_AT).rows.every(row=>row.status==='RECHECK_REQUIRED'&&
      row.reason==='SHA_CHANGED_ORIGINAL_404'&&!row.authenticatedOriginal&&!row.originalAccepted)).toBe(true);
  });

  it('keeps source-specific later notices unverified and old-pin notices stale',()=>{
    const old=ql279PrepareArrivalClaim('devilndove','SOURCE_PUBLICATION_NOTICE','NOTICE-283-OLD',new Date('2026-10-31T05:00:00Z'));
    const later=ql279PrepareArrivalClaim('yw','SOURCE_PUBLICATION_NOTICE','NOTICE-283-LATER',new Date('2026-10-31T05:15:00Z'));
    if(!old.ok||!later.ok)throw Error('Invalid notice fixture');
    const queue=ql283SourceQueue('2026-10-31T05:16:00Z',[old.claim,later.claim]);
    expect(queue.rows.find(row=>row.source==='devilndove')).toMatchObject({notices:1,postSnapshotNotices:0,stalePinNotices:1});
    expect(queue.rows.find(row=>row.source==='yw')).toMatchObject({notices:1,postSnapshotNotices:1,stalePinNotices:1});
  });

  it('prepares only unsigned trust review references with seven unsatisfied gates',()=>{
    const result=ql283PrepareTrustReference(originalIssuer(),'TRUST-283-CASE',new Date('2026-10-31T05:16:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(QL283_ISSUER_TRUST_GATES).toHaveLength(7);
    expect(result.draft).toMatchObject({checkId:'keyboard',issuerReadinessReference:'ISSUER-283-CASE',
      verified:0,issuer:'NOT_AUTHENTICATED',keyPin:'NOT_VERIFIED',challenge:'NOT_ISSUED',
      ownerApproval:'NOT_GIVEN',disposition:'TRUST_REFERENCE_REVIEW_ONLY',state:'DRAFT_NOT_SENT'});
  });

  it('rejects forged trust predecessor states, unverified gate manipulation and credential-like refs',()=>{
    const issuer=originalIssuer();const prepare=(row:typeof issuer,ref='TRUST-283-CASE',when='2026-10-31T05:16:00Z')=>
      ql283PrepareTrustReference(row,ref,new Date(when));
    expect(prepare({...issuer,issuer:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(prepare({...issuer,nonce:'ISSUED' as never}).ok).toBe(false);
    expect(prepare({...issuer,signature:'VERIFIED' as never}).ok).toBe(false);
    expect(prepare({...issuer,ownerApproval:'GIVEN' as never}).ok).toBe(false);
    expect(prepare({...issuer,gates:[] as never}).ok).toBe(false);
    expect(prepare({...issuer,gates:[...issuer.gates].map(gate=>({...gate,state:'VERIFIED'})) as never}).ok).toBe(false);
    expect(prepare(issuer,'secret-private').ok).toBe(false);
    expect(prepare(issuer,'bad').ok).toBe(false);
    expect(prepare(issuer,'TRUST-283-CASE','2026-10-31T04:18:00Z').ok).toBe(false);
    expect(prepare(issuer,'TRUST-283-CASE','invalid').ok).toBe(false);
  });

  it('prepares local unsent publication owner follow-up retaining both immutable source SHAs',()=>{
    const result=ql283PrepareOwnerFollowup(originalException('icamp'),'OWNER-283-FOLLOWUP',new Date('2026-10-31T05:16:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'icamp',original:'HTTP_404_AT_IMMUTABLE_PIN',
      ownerContacted:false,routed:false,resolved:false,state:'DRAFT_NOT_SENT'});
    expect(result.draft.originalSourceSha).not.toBe(result.draft.currentSourceSha);
    expect(result.draft.currentSourceSha).toBe(QL283_PUBLIC_SOURCE_RECHECK.find(row=>row.source==='icamp')?.sha);
  });

  it('rejects forged resolved publication exception, secrets, missing sources and old timestamps',()=>{
    const exception=originalException();const prepare=(row:typeof exception,ref='OWNER-283-FOLLOWUP',when='2026-10-31T05:16:00Z')=>
      ql283PrepareOwnerFollowup(row,ref,new Date(when));
    expect(prepare({...exception,resolved:true as never}).ok).toBe(false);
    expect(prepare({...exception,routed:true as never}).ok).toBe(false);
    expect(prepare({...exception,sourceSha:'0'.repeat(40)}).ok).toBe(false);
    expect(prepare({...exception,source:'unregistered' as never}).ok).toBe(false);
    expect(prepare(exception,'sk-private').ok).toBe(false);
    expect(prepare(exception,'bad').ok).toBe(false);
    expect(prepare(exception,'OWNER-283-FOLLOWUP','2026-10-31T05:13:29Z').ok).toBe(false);
    expect(prepare(exception,'OWNER-283-FOLLOWUP','invalid').ok).toBe(false);
  });

  it('queues manual public GET work only and validates source, reference and chronology',()=>{
    const result=ql283PrepareManualRecheck('yw','RECHECK-283-CASE',new Date('2026-10-31T05:16:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({source:'yw',action:'MANUAL_PUBLIC_ORIGINAL_RECHECK',
      scheduled:false,executed:false,state:'DRAFT_NOT_SENT'});
    expect(ql283PrepareManualRecheck('unknown' as never,'RECHECK-283-CASE',new Date()).ok).toBe(false);
    expect(ql283PrepareManualRecheck('yw','token-private',new Date()).ok).toBe(false);
    expect(ql283PrepareManualRecheck('yw','bad',new Date()).ok).toBe(false);
    expect(ql283PrepareManualRecheck('yw','RECHECK-283-CASE',new Date('2026-10-31T05:13:29Z')).ok).toBe(false);
  });

  it('preserves ACK Under Review/Parked independently from integration HOLD in the QL-283 audit packet',()=>{
    const packet=JSON.parse(ql283AuditPacket([],[],[],'2026-10-31T05:16:00Z'));
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER'});
    expect(packet.ackDelivery).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',active:false,action:'NONE'});
    expect(packet.security).toMatchObject({integrations:'DISCONNECTED / HOLD',authenticatedGateways:0,realCalls:0,sms:0,
      signerAccess:false,ownerTestApproval:false});
    expect(packet.sourceRecheck).toMatchObject({moved:6,missing:6,automaticPolling:false});
  });

  it('renders accessible topic navigation with all six immutable public source pins and parked ACK',async()=>{
    await openDesk();expect(host.querySelector('[data-ql283-desk]')).not.toBeNull();
    expect(button('Prepare trust reference review').disabled).toBe(true);
    await act(async()=>button('03 Six-app SHA recheck queue').click());
    expect(host.querySelectorAll('.ql283-source-row:not(.heading)')).toHaveLength(6);
    expect(host.querySelectorAll('.ql283-source-row a[href*="ql246-source-proof.json"]')).toHaveLength(6);
    expect(host.textContent).toContain('6 / 6');
    expect(host.querySelector('#ql283-ack-title')?.textContent).toContain('UNDER REVIEW');
    expect(host.querySelector('.ql283-parked-note button')).toBeNull();
    expect(host.querySelector('.ql283-parked-note input')).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('carries QL-282 local publication exception into QL-283 owner draft without sending',async()=>{
    await openDesk();await act(async()=>button('Open QL-282 issuer source').click());
    await act(async()=>button('02 Proof-B publication exceptions').click());
    await act(async()=>select('#ql282-source','icamp'));
    await act(async()=>input('#ql282-exception-ref','EXCEPTION-283-LOCAL'));
    await act(async()=>button('Prepare local source publication triage').click());
    await act(async()=>button('Issuer trust, owner follow-up & SHA recheck').click());
    await act(async()=>button('02 Publication owner follow-up').click());
    expect(host.textContent).toContain('EXCEPTION-283-LOCAL');
    await act(async()=>input('#ql283-owner-ref','OWNER-283-LOCAL'));
    await act(async()=>button('Prepare unsent owner follow-up').click());
    expect(host.textContent).toContain('OWNER-283-LOCAL');
    expect(host.textContent).toContain('owner contacted NO');
    expect(localStorage.length).toBe(0);
  });

  it('carries an unsigned QL-282 issuer case into QL-283 trust review with no key auth',async()=>{
    await openDesk();await act(async()=>button('Open QL-282 issuer source').click());
    await act(async()=>button('Open QL-281 challenge source').click());
    await act(async()=>button('Open QL-280 receipt desk').click());
    await act(async()=>button('Open QL-279 source drafts').click());
    await act(async()=>button('Open QL-278 retest queue').click());
    await act(async()=>select('#ql278-outcome','observed'));
    await act(async()=>input('#ql278-note','Observed focus was visible on my local keyboard device.'));
    await act(async()=>button('Capture fresh baseline').click());
    await act(async()=>select('#ql278-outcome','issue'));
    await act(async()=>input('#ql278-note','Later keyboard focus could not be seen on the same device.'));
    await act(async()=>button('Compare & queue if needed').click());
    await act(async()=>button('Reviewer decisions & custody watch').click());
    await act(async()=>input('#ql279-reviewer-ref','REVIEW-283-LOCAL'));
    await act(async()=>input('#ql279-reviewer-note','Original independent signed reviewer receipt remains unverified.'));
    await act(async()=>button('Prepare reviewer disposition draft').click());
    await act(async()=>button('Reviewer receipts & acknowledgement audit').click());
    await act(async()=>input('#ql280-reviewer-ref','RECEIPT-283-LOCAL'));
    await act(async()=>button('Prepare original reviewer receipt request claim').click());
    await act(async()=>button('Signature, proof freshness & ACK custody').click());
    await act(async()=>input('#ql281-challenge-reference','CHALLENGE-283-LOCAL'));
    await act(async()=>button('Prepare signature challenge request claim').click());
    await act(async()=>button('Issuer readiness & proof exception review').click());
    await act(async()=>input('#ql282-issuer-ref','ISSUER-283-LOCAL'));
    await act(async()=>button('Prepare issuer readiness review claim').click());
    await act(async()=>button('Issuer trust, owner follow-up & SHA recheck').click());
    expect(host.textContent).toContain('ISSUER-283-LOCAL');
    await act(async()=>input('#ql283-trust-ref','TRUST-283-LOCAL'));
    await act(async()=>button('Prepare trust reference review').click());
    expect(host.textContent).toContain('TRUST-283-LOCAL');
    expect(host.textContent).toContain('key pin NOT VERIFIED');
    expect(localStorage.length).toBe(0);
  });

  it('adds and clears local rechecks; clipboard packet is copy-only and fallback-safe',async()=>{
    await openDesk();await act(async()=>button('03 Six-app SHA recheck queue').click());
    await act(async()=>select('#ql283-recheck-source','yw'));
    await act(async()=>input('#ql283-recheck-ref','RECHECK-283-LOCAL'));
    await act(async()=>button('Add to local manual recheck queue').click());
    expect(host.textContent).toContain('RECHECK-283-LOCAL');
    expect(host.textContent).toContain('executed NO');
    expect(host.querySelector<HTMLTextAreaElement>('#ql283-packet')?.readOnly).toBe(true);
    await act(async()=>button('Copy QL-283 local review packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async()=>button('Copy QL-283 local review packet').click());expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('PARKED_FOR_LATER');
    await act(async()=>button('Clear QL-283 local drafts').click());
    expect(host.textContent).not.toContain('RECHECK-283-LOCAL');expect(localStorage.length).toBe(0);
  });

  it('respects visible focus, smaller screens, forced-colors and reduced-motion settings',()=>{
    const css=readFileSync('src/operator/ql283-issuer-trust-followup.css','utf8');
    expect(css).toContain('max-width:600px');expect(css).toContain('focus-visible');
    expect(css).toContain('forced-colors:active');expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
