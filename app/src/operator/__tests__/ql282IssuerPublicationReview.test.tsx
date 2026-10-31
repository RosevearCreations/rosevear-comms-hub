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
import {ql279PrepareArrivalClaim,ql279PrepareReviewerDraft} from '../ql279ReviewerCustodyEscalation';
import {ql280PrepareReviewerReceipt} from '../ql280ReceiptReconciliation';
import {QL281_PUBLIC_SOURCE_RECHECK,QL281_REVIEWER_CHALLENGE_GATES,ql281PrepareChallengeRequest} from '../ql281SignatureProofCustody';
import {QL282_OBSERVED_AT,QL282_PUBLIC_SOURCE_RECHECK,QL282_ISSUER_READINESS_GATES,QL282_ACK_WORKSTREAM,
  ql282AckParking,ql282AuditPacket,ql282PinnedProofUrl,ql282PrepareException,ql282PrepareIssuerReview,ql282PublicationTriage}
  from '../ql282IssuerPublicationReview';

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
  await act(async()=>button('Issuer readiness & proof exception review').click());}
function originalChallenge(){
  const capture=(outcome:'observed'|'issue',when:string)=>{
    const result=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
      note:'Checked the keyboard focus state on a real local device.'},new Date(when));
    if(!result.ok)throw Error(result.reason);return result.record;
  };
  const comparison=ql277CompareAccessibility(capture('observed','2026-10-31T02:55:00Z'),capture('issue','2026-10-31T02:56:00Z'));
  const ticket=ql278CreateRetestTicket(comparison);if(!ticket.ok)throw Error(ticket.reason);
  const reviewer=ql279PrepareReviewerDraft(ticket.ticket,'REVIEW-282-REF','EVIDENCE_INCOMPLETE',
    'An independent original signature receipt has not been verified.',new Date('2026-10-31T02:59:00Z'));
  if(!reviewer.ok)throw Error(reviewer.reason);
  const receipt=ql280PrepareReviewerReceipt(reviewer.draft,'RECEIPT-282-REF',new Date('2026-10-31T03:06:00Z'));
  if(!receipt.ok)throw Error(receipt.reason);
  const challenge=ql281PrepareChallengeRequest(receipt.claim,'CHALLENGE-282-REF',new Date('2026-10-31T03:47:00Z'));
  if(!challenge.ok)throw Error(challenge.reason);return challenge.request;
}

describe('QL-282 issuer readiness, source publication triage and ACK workstream parked Under Review',()=>{
  it('records six actual immutable GitHub HTTP 404 source checks, four moved and two unchanged since QL-281',()=>{
    expect(QL282_OBSERVED_AT).toBe('2026-10-31T04:18:55Z');
    expect(QL282_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL282_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    for(const row of QL282_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);expect(row.http).toBe(404);
      expect(ql282PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);expect(ql282PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');}
    const triage=ql282PublicationTriage('2026-10-31T04:22:00Z');
    expect(triage).toMatchObject({moved:4,unchanged:2,missing:6,sources:6,originalsAccepted:0,authenticatedSourceGets:0,
      release:'DISCONNECTED / HOLD',freshness:'PINNED_RECENT'});
    expect(triage.rows.filter(row=>row.moved).map(row=>row.source)).toEqual(['devilndove','rosiedazzlers','icamp','rosevear-ai-hub']);
    expect(QL281_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(()=>ql282PinnedProofUrl('bad-source' as never)).toThrow('UNKNOWN_QL282_SOURCE');
  });

  it('keeps publication snapshot freshness and arrival notice chronology explicit without an automatic poll',()=>{
    expect(ql282PublicationTriage('2026-11-01T04:18:55Z').freshness).toBe('PUBLIC_RECHECK_DUE');
    expect(ql282PublicationTriage('2026-10-31T04:18:54Z')).toMatchObject({freshness:'CLOCK_REVIEW',ageHours:null});
    expect(ql282PublicationTriage('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql282PublicationTriage(QL282_OBSERVED_AT).nextRecheckAt).toBe('2026-11-01T04:18:55.000Z');
    const old=ql279PrepareArrivalClaim('devilndove','SOURCE_PUBLICATION_NOTICE','NOTICE-282-OLD',new Date('2026-10-31T04:00:00Z'));
    const future=ql279PrepareArrivalClaim('ai-data-platform','SOURCE_PUBLICATION_NOTICE','NOTICE-282-NEW',new Date('2026-10-31T04:21:00Z'));
    if(!old.ok||!future.ok)throw Error('Invalid fixture');
    const triage=ql282PublicationTriage('2026-10-31T04:22:00Z',[old.claim,future.claim]);
    expect(triage.rows.find(row=>row.source==='devilndove')).toMatchObject({notices:1,stalePinNotices:1,postSnapshotNotices:0});
    expect(triage.rows.find(row=>row.source==='ai-data-platform')).toMatchObject({notices:1,stalePinNotices:0,postSnapshotNotices:1});
  });

  it('requires seven independent issuer verification gates and never issues a challenge from a reference',()=>{
    expect(QL282_ISSUER_READINESS_GATES.map(row=>row.id)).toEqual(['issuer-identity','owner-scope','issuer-pin','nonce','expiry','transport','audit']);
    expect(QL281_REVIEWER_CHALLENGE_GATES).toHaveLength(7);
    const result=ql282PrepareIssuerReview(originalChallenge(),'ISSUER-282-REVIEW',new Date('2026-10-31T04:22:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.request).toMatchObject({checkId:'keyboard',challengeRequestClaim:'CHALLENGE-282-REF',
      verified:0,issuer:'NOT_AUTHENTICATED',nonce:'NOT_ISSUED',signature:'NOT_VERIFIED',
      ownerApproval:'NOT_GIVEN',disposition:'ISSUER_READINESS_REVIEW_ONLY',state:'DRAFT_NOT_SENT'});
    expect(result.request.gates).toHaveLength(7);
  });

  it('rejects forged issued challenges, altered predecessor gates, secrets and invalid temporal order',()=>{
    const challenge=originalChallenge();const prepare=(modified:typeof challenge,ref='ISSUER-282-REVIEW',when='2026-10-31T04:22:00Z')=>
      ql282PrepareIssuerReview(modified,ref,new Date(when));
    expect(prepare({...challenge,challenge:'ISSUED' as never}).ok).toBe(false);
    expect(prepare({...challenge,signature:'VERIFIED' as never}).ok).toBe(false);
    expect(prepare({...challenge,ownerAcceptance:'GIVEN' as never}).ok).toBe(false);
    expect(prepare({...challenge,requirements:[] as never}).ok).toBe(false);
    expect(prepare({...challenge,requirements:[...challenge.requirements].map(gate=>({...gate,status:'VERIFIED'})) as never}).ok).toBe(false);
    expect(prepare(challenge,'sk-private-secret').ok).toBe(false);
    expect(prepare(challenge,'bad').ok).toBe(false);
    expect(prepare(challenge,'ISSUER-282-REVIEW','2026-10-31T03:42:00Z').ok).toBe(false);
    expect(prepare(challenge,'ISSUER-282-REVIEW','invalid').ok).toBe(false);
  });

  it('creates only local unsent publication exception triage, retaining source-specific immutable evidence',()=>{
    const changed=ql282PrepareException('icamp','EXCEPTION-282-ICAMP',new Date('2026-10-31T04:22:00Z'));
    expect(changed.ok).toBe(true);if(!changed.ok)throw Error(changed.reason);
    expect(changed.draft).toMatchObject({source:'icamp',reference:'EXCEPTION-282-ICAMP',
      reason:'SOURCE_SHA_MOVED_ORIGINAL_MISSING',original:'HTTP_404_AT_IMMUTABLE_PIN',routed:false,resolved:false,state:'LOCAL_REVIEW_DRAFT'});
    const same=ql282PrepareException('yw','EXCEPTION-282-YW',new Date('2026-10-31T04:22:00Z'));
    expect(same.ok&&same.draft.reason).toBe('UNCHANGED_SHA_ORIGINAL_MISSING');
    expect(ql282PublicationTriage('2026-10-31T04:22:00Z').rows.every(row=>row.resolution==='PUBLICATION_EXCEPTION_OPEN'&&!row.authenticatedOriginal)).toBe(true);
  });

  it('rejects unknown source triage, secret references, malformed refs and prerecheck timestamps',()=>{
    expect(ql282PrepareException('unknown' as never,'EXCEPTION-282-CASE',new Date('2026-10-31T04:22:00Z')).ok).toBe(false);
    expect(ql282PrepareException('yw','Bearer-token',new Date('2026-10-31T04:22:00Z')).ok).toBe(false);
    expect(ql282PrepareException('yw','bad',new Date('2026-10-31T04:22:00Z')).ok).toBe(false);
    expect(ql282PrepareException('yw','EXCEPTION-282-CASE',new Date('2026-10-31T04:18:54Z')).ok).toBe(false);
    expect(ql282PrepareException('yw','EXCEPTION-282-CASE',new Date('invalid')).ok).toBe(false);
  });

  it('honours owner direction: six-app ACK delivery evidence is UNDER REVIEW and PARKED, no new actions',()=>{
    expect(QL282_ACK_WORKSTREAM).toMatchObject({status:'UNDER_REVIEW',disposition:'PARKED_FOR_LATER',
      activeFollowup:false,deliveryEvidenceCollection:false,notificationEnabled:false,originalDeliveryVerified:0,ownerTestApproval:'NOT_GIVEN'});
    const parked=ql282AckParking([]);expect(parked).toHaveLength(6);
    expect(parked.every(row=>row.status==='UNDER_REVIEW'&&row.disposition==='PARKED_FOR_LATER'&&
      !row.actionsEnabled&&row.authenticatedDelivery===0)).toBe(true);
    expect(parked.find(row=>row.source==='icamp')?.legacyUnverifiedReferences).toBe(0);
  });

  it('keeps ACK Under Review separately from immutable Proof-B security HOLD in the release packet',()=>{
    const packet=ql282AuditPacket([],[],[],'2026-10-31T04:22:00Z');
    expect(packet).toContain('4 moved / 2 unchanged / 6/6 HTTP 404');
    expect(packet).toContain('Six-app acknowledgement delivery evidence: UNDER_REVIEW / PARKED_FOR_LATER');
    expect(packet).toContain('Independent issuer readiness: 0/7 authenticated');
    expect(packet).toContain('Underlying integrations: DISCONNECTED / HOLD');
    expect(packet).toContain('No challenge issued');
  });

  it('shows three accessible QL-282 panels, explicit parked ACK label and no active delivery controls',async()=>{
    await openDesk();expect(host.querySelector('[data-ql282-desk]')).not.toBeNull();
    expect(button('Prepare issuer readiness review claim').disabled).toBe(true);
    await act(async()=>button('02 Proof-B publication exceptions').click());
    expect(host.querySelectorAll('.ql278-aging-row:not(.head)')).toHaveLength(6);
    await act(async()=>button('SHA changed (4)').click());expect(host.querySelectorAll('.ql278-aging-row:not(.head)')).toHaveLength(4);
    await act(async()=>button('SHA unchanged (2)').click());expect(host.querySelectorAll('.ql278-aging-row:not(.head)')).toHaveLength(2);
    await act(async()=>button('03 ACK delivery evidence · Under Review').click());
    expect(host.querySelector('#ql282-ack-title')?.textContent).toContain('UNDER REVIEW');
    expect(host.querySelectorAll('.ql282-parked .ql281-source-grid article')).toHaveLength(6);
    expect(host.querySelector('.ql282-parked input')).toBeNull();
    expect(host.querySelector('.ql282-parked button')).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('follows a session-only QL-278/279/280/281 unsigned request into QL-282 issuer readiness',async()=>{
    await openDesk();await act(async()=>button('Open QL-281 challenge source').click());
    await act(async()=>button('Open QL-280 receipt desk').click());
    await act(async()=>button('Open QL-279 source drafts').click());
    await act(async()=>button('Open QL-278 retest queue').click());
    await act(async()=>select('#ql278-outcome','observed'));
    await act(async()=>input('#ql278-note','Initial keyboard focus was visible on this local device.'));
    await act(async()=>button('Capture fresh baseline').click());
    await act(async()=>select('#ql278-outcome','issue'));
    await act(async()=>input('#ql278-note','Later keyboard focus was no longer visible on this device.'));
    await act(async()=>button('Compare & queue if needed').click());
    await act(async()=>button('Reviewer decisions & custody watch').click());
    await act(async()=>input('#ql279-reviewer-ref','REVIEW-282-LOCAL'));
    await act(async()=>input('#ql279-reviewer-note','No original signed independent reviewer device witness has arrived.'));
    await act(async()=>button('Prepare reviewer disposition draft').click());
    await act(async()=>button('Reviewer receipts & acknowledgement audit').click());
    await act(async()=>input('#ql280-reviewer-ref','RECEIPT-282-LOCAL'));
    await act(async()=>button('Prepare original reviewer receipt request claim').click());
    await act(async()=>button('Signature, proof freshness & ACK custody').click());
    await act(async()=>input('#ql281-challenge-reference','CHALLENGE-282-LOCAL'));
    await act(async()=>button('Prepare signature challenge request claim').click());
    await act(async()=>button('Issuer readiness & proof exception review').click());
    expect(host.textContent).toContain('CHALLENGE-282-LOCAL');
    await act(async()=>input('#ql282-issuer-ref','ISSUER-282-LOCAL'));
    await act(async()=>button('Prepare issuer readiness review claim').click());
    expect(host.textContent).toContain('ISSUER-282-LOCAL');
    expect(host.textContent).toContain('nonce NOT ISSUED');
    expect(localStorage.length).toBe(0);
  });

  it('prepares and clears only local publication triage without changing under-review ACK decision',async()=>{
    await openDesk();await act(async()=>button('02 Proof-B publication exceptions').click());
    await act(async()=>select('#ql282-source','icamp'));
    await act(async()=>input('#ql282-exception-ref','EXCEPTION-282-LOCAL'));
    await act(async()=>button('Prepare local source publication triage').click());
    expect(host.textContent).toContain('EXCEPTION-282-LOCAL');
    expect(host.textContent).toContain('External routing NO');
    await act(async()=>button('Clear QL-282 local drafts').click());
    expect(host.textContent).toContain('parked acknowledgement decision were preserved');
    await act(async()=>button('03 ACK delivery evidence · Under Review').click());
    expect(host.textContent).toContain('UNDER REVIEW · PARKED');
    expect(localStorage.length).toBe(0);
  });

  it('makes the audit packet copy-only with clipboard fallback',async()=>{
    await openDesk();expect(host.querySelector<HTMLTextAreaElement>('#ql282-packet')?.readOnly).toBe(true);
    await act(async()=>button('Copy QL-282 review packet').click());expect(host.textContent).toContain('Clipboard unavailable');
    const copied=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async()=>button('Copy QL-282 review packet').click());expect(copied).toHaveBeenCalledOnce();
    expect(copied.mock.calls[0][0]).toContain('UNDER_REVIEW / PARKED_FOR_LATER');
    expect(localStorage.length).toBe(0);
  });

  it('preserves responsive keyboard accessibility, forced colours and reduced motion',()=>{
    const css=readFileSync('src/operator/ql282-issuer-publication.css','utf8');
    expect(css).toContain('max-width:610px');expect(css).toContain('focus-visible');
    expect(css).toContain('forced-colors:active');expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
