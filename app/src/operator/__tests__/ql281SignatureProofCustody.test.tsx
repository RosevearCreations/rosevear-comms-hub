// @vitest-environment jsdom
import { act } from 'react';
import { createRoot,type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_SOURCES } from '../ql270ConnectionCentre';
import { ql276CaptureOwnerObservation } from '../ql276EvidenceIntake';
import { ql277CompareAccessibility } from '../ql277DriftReview';
import { ql278CreateRetestTicket } from '../ql278FollowupDesk';
import { ql279PrepareArrivalClaim,ql279PrepareEscalation,ql279PrepareReviewerDraft } from '../ql279ReviewerCustodyEscalation';
import { QL280_PUBLIC_SOURCE_RECHECK,ql280PrepareAckClaim,ql280PrepareReviewerReceipt } from '../ql280ReceiptReconciliation';
import { QL281_OBSERVED_AT,QL281_PUBLIC_SOURCE_RECHECK,QL281_REVIEWER_CHALLENGE_GATES,QL281_ACK_CUSTODY_GATES,
  ql281AuditPacket,ql281CustodyQueue,ql281PinnedProofUrl,ql281PrepareAckCustody,
  ql281PrepareChallengeRequest,ql281PublicationDiff } from '../ql281SignatureProofCustody';

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});});
function button(label:string){const result=[...host.querySelectorAll<HTMLButtonElement>('button')].find(row=>row.getAttribute('aria-label')===label||row.textContent?.includes(label));
  if(!result)throw Error(`Button missing: ${label}`);return result;}
function input(selector:string,value:string){const el=host.querySelector<HTMLInputElement|HTMLTextAreaElement>(selector)!;
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(el,value);
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
function select(selector:string,value:string){const el=host.querySelector<HTMLSelectElement>(selector)!;
  el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}
async function openDesk(){await act(async()=>button('IT Command').click());
  await act(async()=>button('Signature, proof freshness & ACK custody').click());}
function reviewerReceipt(){
  const observation=(outcome:'observed'|'issue',time:string)=>{
    const record=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
      note:'Observed the accessible keyboard focus state on an actual local device.'},new Date(time));
    if(!record.ok)throw Error(record.reason);return record.record;
  };
  const comparison=ql277CompareAccessibility(observation('observed','2026-10-31T02:55:00Z'),observation('issue','2026-10-31T02:56:00Z'));
  const ticket=ql278CreateRetestTicket(comparison);if(!ticket.ok)throw Error(ticket.reason);
  const reviewer=ql279PrepareReviewerDraft(ticket.ticket,'REVIEW-281-CLAIM','EVIDENCE_INCOMPLETE',
    'Signed reviewer evidence and independent device witness still missing.',new Date('2026-10-31T02:58:00Z'));
  if(!reviewer.ok)throw Error(reviewer.reason);
  const receipt=ql280PrepareReviewerReceipt(reviewer.draft,'RECEIPT-281-CLAIM',new Date('2026-10-31T03:06:00Z'));
  if(!receipt.ok)throw Error(receipt.reason);return receipt.claim;
}
function ackClaim(){const draft=ql279PrepareEscalation('rosiedazzlers','PROOF_STILL_404',new Date('2026-10-31T03:01:00Z'));
  const claim=ql280PrepareAckClaim(draft,'ACK-281-CLAIM',new Date('2026-10-31T03:08:00Z'));
  if(!claim.ok)throw Error(claim.reason);return {draft,claim:claim.claim};}

describe('QL-281 independent signature challenge, Proof-B publication diff and acknowledgement custody',()=>{
  it('records six immutable actual public source 404 outcomes, with exactly three moved since QL-280',()=>{
    expect(QL281_OBSERVED_AT).toBe('2026-10-31T03:45:13Z');
    expect(QL281_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL281_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    for(const row of QL281_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);expect(row.http).toBe(404);
      expect(ql281PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);expect(ql281PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');}
    const diff=ql281PublicationDiff('2026-10-31T03:50:00Z');
    expect(diff).toMatchObject({moved:3,unchanged:3,missing:6,sourceCount:6,originalSignedProofsAccepted:0,
      authenticatedGatewayGets:0,release:'DISCONNECTED / HOLD',freshness:'PINNED_RECENT'});
    expect(diff.rows.filter(row=>row.shaMoved).map(row=>row.source)).toEqual(['devilndove','rosiedazzlers','rosevear-ai-hub']);
    expect(diff.rows.every(row=>row.publication==='ORIGINAL_PROOF_NOT_PUBLISHED_AT_PIN'&&!row.originalVerified)).toBe(true);
    expect(QL280_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(()=>ql281PinnedProofUrl('unknown' as never)).toThrow('UNKNOWN_QL281_SOURCE');
  });

  it('flags snapshot age, clock skew, later notices and obsoleted source notices without false proof acceptance',()=>{
    expect(ql281PublicationDiff('2026-11-01T03:45:13Z').freshness).toBe('PUBLIC_RECHECK_DUE');
    expect(ql281PublicationDiff('2026-10-31T03:45:12Z')).toMatchObject({freshness:'CLOCK_REVIEW',snapshotAgeHours:null});
    expect(ql281PublicationDiff('not-a-date').freshness).toBe('CLOCK_REVIEW');
    expect(ql281PublicationDiff(QL281_OBSERVED_AT).nextRecheckAt).toBe('2026-11-01T03:45:13.000Z');
    const old=ql279PrepareArrivalClaim('devilndove','SOURCE_PUBLICATION_NOTICE','NOTICE-281-OLD',new Date('2026-10-31T03:00:00Z'));
    const recent=ql279PrepareArrivalClaim('ai-data-platform','SOURCE_PUBLICATION_NOTICE','NOTICE-281-NEW',new Date('2026-10-31T03:46:00Z'));
    if(!old.ok||!recent.ok)throw Error('Fixtures invalid');
    const report=ql281PublicationDiff('2026-10-31T03:50:00Z',[old.claim,recent.claim]);
    expect(report.rows.find(row=>row.source==='devilndove')).toMatchObject({noticeCount:1,obsoleteNotices:1,postSnapshotNotices:0});
    expect(report.rows.find(row=>row.source==='ai-data-platform')).toMatchObject({noticeCount:1,obsoleteNotices:0,postSnapshotNotices:1});
  });

  it('lists seven independent signature challenge gates and prepares an unissued reference-only request',()=>{
    expect(QL281_REVIEWER_CHALLENGE_GATES.map(row=>row.id)).toEqual(['reviewer','issuer','nonce','document','signature','witness','owner']);
    const result=ql281PrepareChallengeRequest(reviewerReceipt(),'CHALLENGE-281-REF',new Date('2026-10-31T03:47:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.request).toMatchObject({checkId:'keyboard',challengeRequestReferenceClaim:'CHALLENGE-281-REF',
      verified:0,challenge:'NOT_ISSUED',signature:'NOT_VERIFIED',ownerAcceptance:'NOT_GIVEN',state:'DRAFT_NOT_SENT'});
    expect(result.request.requirements).toHaveLength(7);
  });

  it('refuses claimed accepted reviewer receipts, corrupted preconditions, secrets and out-of-order clocks',()=>{
    const receipt=reviewerReceipt();
    const prepare=(modified:typeof receipt,reference='CHALLENGE-281-REF',when='2026-10-31T03:47:00Z')=>
      ql281PrepareChallengeRequest(modified,reference,new Date(when));
    expect(prepare({...receipt,verified:1 as never}).ok).toBe(false);
    expect(prepare({...receipt,authentication:'AUTHENTICATED' as never}).ok).toBe(false);
    expect(prepare({...receipt,preconditions:[] as never}).ok).toBe(false);
    expect(prepare({...receipt,state:'SENT' as never}).ok).toBe(false);
    expect(prepare(receipt,'sk-private-credential').ok).toBe(false);
    expect(prepare(receipt,'bad').ok).toBe(false);
    expect(prepare(receipt,'CHALLENGE-281-REF','2026-10-31T03:00:00Z').ok).toBe(false);
    expect(prepare(receipt,'CHALLENGE-281-REF','invalid').ok).toBe(false);
  });

  it('exposes six authenticated acknowledgement custody gates; every app remains unverified',()=>{
    expect(QL281_ACK_CUSTODY_GATES.map(row=>row.id)).toEqual(['outbound','recipient','reply','signer','chain','owner']);
    const {draft,claim}=ackClaim();const queue=ql281CustodyQueue([claim],[draft]);
    expect(queue).toHaveLength(6);
    expect(queue.find(row=>row.source==='rosiedazzlers')).toMatchObject({ackReferenceClaims:1,unsentEscalations:1,
      originalOutboundReceipts:0,authenticatedResponses:0,custodyVerified:false,status:'REFERENCE_CLAIM_CUSTODY_UNVERIFIED'});
    expect(queue.find(row=>row.source==='icamp')?.status).toBe('AWAITING_REFERENCE_CLAIM');
    const custody=ql281PrepareAckCustody(claim,'CUSTODY-281-REF',new Date('2026-10-31T03:47:00Z'));
    expect(custody.ok).toBe(true);if(!custody.ok)throw Error(custody.reason);
    expect(custody.request).toMatchObject({source:'rosiedazzlers',verified:0,delivery:'NOT_RECORDED',
      response:'NOT_RECEIVED',acceptance:'BLOCKED_PENDING_ORIGINAL_CUSTODY',state:'DRAFT_NOT_SENT'});
    expect(custody.request.gates).toHaveLength(6);
  });

  it('blocks forged delivered/accepted ACKs, secret references, invalid source and time reversal',()=>{
    const {claim}=ackClaim();const prepare=(modified:typeof claim,ref='CUSTODY-281-REF',at='2026-10-31T03:47:00Z')=>
      ql281PrepareAckCustody(modified,ref,new Date(at));
    expect(prepare({...claim,delivery:'DELIVERED' as never}).ok).toBe(false);
    expect(prepare({...claim,acknowledgement:'VERIFIED' as never}).ok).toBe(false);
    expect(prepare({...claim,accepted:true as never}).ok).toBe(false);
    expect(prepare({...claim,source:'unknown' as never}).ok).toBe(false);
    expect(prepare(claim,'Bearer-secret').ok).toBe(false);
    expect(prepare(claim,'no').ok).toBe(false);
    expect(prepare(claim,'CUSTODY-281-REF','2026-10-31T03:00:00Z').ok).toBe(false);
    expect(prepare(claim,'CUSTODY-281-REF','invalid').ok).toBe(false);
  });

  it('creates a copy-only complete release packet with zero claims of authenticated original or notification',()=>{
    const {draft,claim}=ackClaim();const report=ql281AuditPacket([],[],[claim],[draft],'2026-10-31T03:50:00Z');
    expect(report).toContain('3 moved / 3 unchanged / 6/6 original Proof-B HTTP 404');
    expect(report).toContain('Original reviewer signature challenge verifications: 0/7');
    expect(report).toContain('Authenticated escalation acknowledgement custody: 0/6');
    expect(report).toContain('No challenge issued, signature checked, outbound message delivered');
    expect(report).toContain('DISCONNECTED / HOLD');
  });

  it('mounts an accessible QL-281 desk and blocks request actions without prior genuine session drafts',async()=>{
    await openDesk();expect(host.querySelector('[data-ql281-desk]')).not.toBeNull();
    expect(host.textContent).toContain('No QL-280 reviewer receipt reference in this session');
    expect(button('Prepare signature challenge request claim').disabled).toBe(true);
    await act(async()=>button('02 Publication freshness diff').click());
    expect(host.querySelectorAll('.ql278-aging-row:not(.head)')).toHaveLength(6);
    expect(host.textContent).toContain('SHA MOVED');expect(host.textContent).toContain('HTTP 404');
    await act(async()=>button('03 Escalation ACK custody').click());
    expect(host.querySelectorAll('.ql281-source-grid article')).toHaveLength(6);
    expect(button('Prepare acknowledgement custody review claim').disabled).toBe(true);
    expect(localStorage.length).toBe(0);
  });

  it('carries QL-279 → QL-280 reviewer claim across panel switches to a QL-281 request, never as signed',async()=>{
    await openDesk();await act(async()=>button('Open QL-280 receipt desk').click());
    await act(async()=>button('Open QL-279 source drafts').click());
    await act(async()=>button('Open QL-278 retest queue').click());
    await act(async()=>select('#ql278-outcome','observed'));
    await act(async()=>input('#ql278-note','Initial keyboard focus was visible on this real local device.'));
    await act(async()=>button('Capture fresh baseline').click());
    await act(async()=>select('#ql278-outcome','issue'));
    await act(async()=>input('#ql278-note','Later keyboard focus disappeared from this same device.'));
    await act(async()=>button('Compare & queue if needed').click());
    await act(async()=>button('Reviewer decisions & custody watch').click());
    await act(async()=>input('#ql279-reviewer-ref','REVIEW-281-LOCAL'));
    await act(async()=>input('#ql279-reviewer-note','Independent device witness and signer identity remain unverified.'));
    await act(async()=>button('Prepare reviewer disposition draft').click());
    await act(async()=>button('Reviewer receipts & acknowledgement audit').click());
    await act(async()=>input('#ql280-reviewer-ref','RECEIPT-281-LOCAL'));
    await act(async()=>button('Prepare original reviewer receipt request claim').click());
    await act(async()=>button('Signature, proof freshness & ACK custody').click());
    expect(host.textContent).toContain('RECEIPT-281-LOCAL');
    await act(async()=>input('#ql281-challenge-reference','CHALLENGE-281-LOCAL'));
    await act(async()=>button('Prepare signature challenge request claim').click());
    expect(host.textContent).toContain('CHALLENGE-281-LOCAL');
    expect(host.textContent).toContain('Challenge NOT ISSUED');
    expect(host.textContent).toContain('signature NOT VERIFIED');
    expect(localStorage.length).toBe(0);
  });

  it('preserves ACK reference across QL-279/280/281 and never claims delivery or verified custody',async()=>{
    await openDesk();await act(async()=>button('03 Escalation ACK custody').click());
    await act(async()=>button('Open QL-279 escalation source').click());
    await act(async()=>button('03 Six-app escalation follow-up').click());
    await act(async()=>select('#ql279-escalation-source','icamp'));
    await act(async()=>button('Prepare unsent escalation draft').click());
    await act(async()=>button('Reviewer receipts & acknowledgement audit').click());
    await act(async()=>button('03 Escalation acknowledgement aging').click());
    await act(async()=>input('#ql280-ack-ref','ACK-281-LOCAL'));
    await act(async()=>button('Prepare unverified acknowledgement claim').click());
    await act(async()=>button('Signature, proof freshness & ACK custody').click());
    await act(async()=>button('03 Escalation ACK custody').click());
    expect(host.textContent).toContain('1 ACK reference claim(s)');
    await act(async()=>input('#ql281-custody-reference','CUSTODY-281-LOCAL'));
    await act(async()=>button('Prepare acknowledgement custody review claim').click());
    expect(host.textContent).toContain('CUSTODY-281-LOCAL');
    expect(host.textContent).toContain('Original outbound NOT RECORDED');
    expect(host.textContent).toContain('response NOT RECEIVED');
    expect(localStorage.length).toBe(0);
  });

  it('keeps a read-only packet copy-only and clears only QL-281 local request drafts',async()=>{
    await openDesk();expect(host.querySelector<HTMLTextAreaElement>('#ql281-packet')?.readOnly).toBe(true);
    await act(async()=>button('Copy QL-281 audit packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async()=>button('Copy QL-281 audit packet').click());
    expect(copied).toHaveBeenCalledOnce();expect(copied.mock.calls[0][0]).toContain('QL-281');
    await act(async()=>button('Clear QL-281 local requests').click());
    expect(host.textContent).toContain('QL-279 and QL-280 source drafts remain in this session');
    expect(localStorage.length).toBe(0);
  });

  it('preserves modern responsive layout, keyboard focus, high contrast and reduced-motion support',()=>{
    const css=readFileSync('src/operator/ql281-signature-proof-custody.css','utf8');
    expect(css).toContain('max-width:610px');expect(css).toContain('focus-visible');
    expect(css).toContain('forced-colors:active');expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
