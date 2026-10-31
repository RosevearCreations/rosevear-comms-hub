// @vitest-environment jsdom
import { act } from 'react';
import { createRoot,type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_SOURCES } from '../ql270ConnectionCentre';
import { ql276CaptureOwnerObservation } from '../ql276EvidenceIntake';
import { ql277CompareAccessibility } from '../ql277DriftReview';
import { ql278CreateRetestTicket } from '../ql278FollowupDesk';
import { QL279_PUBLIC_SOURCE_RECHECK,ql279PrepareArrivalClaim,ql279PrepareEscalation,
  ql279PrepareReviewerDraft } from '../ql279ReviewerCustodyEscalation';
import { QL280_OBSERVED_AT,QL280_PUBLIC_SOURCE_RECHECK,QL280_REVIEWER_RECEIPT_PRECONDITIONS,
  ql280AckAging,ql280AuditPacket,ql280PinnedProofUrl,ql280PrepareAckClaim,
  ql280PrepareReviewerReceipt,ql280ProofReturns,ql280ReconcileArrival }
  from '../ql280ReceiptReconciliation';

let host:HTMLDivElement;let root:Root;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});localStorage.clear();
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{
  await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
});
function button(label:string){const match=[...host.querySelectorAll<HTMLButtonElement>('button')].find(item=>item.getAttribute('aria-label')===label||item.textContent?.includes(label));
  if(!match)throw Error(`Missing button ${label}`);return match;}
function select(selector:string,value:string){const field=host.querySelector<HTMLSelectElement>(selector)!;field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));}
function input(selector:string,value:string){const field=host.querySelector<HTMLInputElement|HTMLTextAreaElement>(selector)!;
  const descriptor=Object.getOwnPropertyDescriptor(field instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value')!;
  descriptor.set!.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}
async function openDesk(){await act(async()=>button('IT Command').click());await act(async()=>button('Reviewer receipts & acknowledgement audit').click());}
function observed(outcome:'issue'|'observed',at:string){const r=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
  note:'Checked actual operator keyboard focus sequence on the local device.'},new Date(at));if(!r.ok)throw Error(r.reason);return r.record;}
function reviewerDraft(){const comparison=ql277CompareAccessibility(observed('observed','2026-10-31T02:55:00Z'),observed('issue','2026-10-31T02:56:00Z'));
  const ticket=ql278CreateRetestTicket(comparison);if(!ticket.ok)throw Error(ticket.reason);
  const reviewer=ql279PrepareReviewerDraft(ticket.ticket,'REVIEW-280-CLAIM','EVIDENCE_INCOMPLETE',
    'Original signed independent accessibility review remains unavailable.',new Date('2026-10-31T02:58:00Z'));
  if(!reviewer.ok)throw Error(reviewer.reason);return reviewer.draft;}
function arrival(source:'devilndove'|'ai-data-platform',time='2026-10-31T03:00:00Z'){
  const result=ql279PrepareArrivalClaim(source,'CUSTODIAN_ORIGINAL_RETURN_NOTICE','CUST-280-CLAIM',new Date(time));
  if(!result.ok)throw Error(result.reason);return result.claim;}
function escalation(){return ql279PrepareEscalation('rosiedazzlers','PROOF_STILL_404',new Date('2026-10-31T02:59:00Z'));}

describe('QL-280 reviewer receipt preconditions, original Proof-B return reconciliation and escalation acknowledgement aging',()=>{
  it('pins six real current source main SHAs, all HTTP 404, with three moved and three unchanged',()=>{
    expect(QL280_OBSERVED_AT).toBe('2026-10-31T03:04:36Z');
    expect(QL280_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL280_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(item=>item.id)));
    for(const row of QL280_PUBLIC_SOURCE_RECHECK){expect(row.sha).toMatch(/^[0-9a-f]{40}$/);expect(row.http).toBe(404);
      expect(ql280PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);expect(ql280PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');}
    const report=ql280ProofReturns('2026-10-31T03:10:00Z');
    expect(report).toMatchObject({changed:3,unchanged:3,missing:6,total:6,acceptedProofs:0,verifiedCustodyReceipts:0,
      verifiedReviewerReceipts:0,release:'DISCONNECTED / HOLD',freshness:'PINNED_RECENT'});
    expect(report.rows.filter(row=>row.moved).map(row=>row.source)).toEqual(['devilndove','rosiedazzlers','rosevear-ai-hub']);
    expect(report.rows.every(row=>row.result==='PROOF_B_NOT_RETURNED'&&!row.originalAccepted)).toBe(true);
    expect(QL279_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
  });

  it('enforces 24-hour public snapshot freshness and clock-skew review without polling',()=>{
    expect(ql280ProofReturns('2026-11-01T03:04:36Z').freshness).toBe('PUBLIC_RECHECK_DUE');
    expect(ql280ProofReturns('2026-10-31T03:04:35Z')).toMatchObject({freshness:'CLOCK_REVIEW',ageHours:null});
    expect(ql280ProofReturns('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql280ProofReturns(QL280_OBSERVED_AT).nextPublicRecheckAt).toBe('2026-11-01T03:04:36.000Z');
    expect(()=>ql280PinnedProofUrl('invalid' as never)).toThrow('UNKNOWN_QL280_SOURCE');
  });

  it('requires six external reviewer receipt authenticity gates and never grants acceptance from a claim',()=>{
    expect(QL280_REVIEWER_RECEIPT_PRECONDITIONS.map(row=>row.key)).toEqual(['identity','original','key','device','witness','owner']);
    const result=ql280PrepareReviewerReceipt(reviewerDraft(),'RECEIPT-280-REF',new Date('2026-10-31T03:06:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.claim).toMatchObject({checkId:'keyboard',receiptReferenceClaim:'RECEIPT-280-REF',verified:0,
      authentication:'NOT_PERFORMED',acceptance:'BLOCKED_PENDING_ORIGINAL_SIGNED_REVIEW',state:'DRAFT_NOT_SENT'});
    expect(result.claim.preconditions).toHaveLength(6);
    expect(result.claim.preconditions.map(row=>row.state)).not.toContain('VERIFIED');
    expect(ql280PrepareReviewerReceipt({...reviewerDraft(),accepted:true as never},'RECEIPT-280-REF',new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280PrepareReviewerReceipt(reviewerDraft(),'Bearer-secret',new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280PrepareReviewerReceipt(reviewerDraft(),'bad',new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280PrepareReviewerReceipt(reviewerDraft(),'RECEIPT-280-REF',new Date('2026-10-31T02:57:00Z')).ok).toBe(false);
    expect(ql280PrepareReviewerReceipt(reviewerDraft(),'RECEIPT-280-REF',new Date('invalid')).ok).toBe(false);
  });

  it('distinguishes changed historical SHA, same-sha missing proof and post-snapshot arrival notices',()=>{
    const moved=ql280ReconcileArrival(arrival('devilndove'),new Date('2026-10-31T03:06:00Z'));
    expect(moved.ok).toBe(true);if(!moved.ok)throw Error(moved.reason);
    expect(moved.record).toMatchObject({source:'devilndove',relation:'SOURCE_SHA_MOVED_RECHECK_REQUIRED',
      currentHttp:404,disposition:'ORIGINAL_NOT_OBSERVED',originalAccepted:false});
    const same=ql280ReconcileArrival(arrival('ai-data-platform'),new Date('2026-10-31T03:06:00Z'));
    expect(same.ok&&same.record.relation).toBe('SAME_SHA_STILL_HTTP_404');
    const after=ql280ReconcileArrival(arrival('ai-data-platform','2026-10-31T03:05:00Z'),new Date('2026-10-31T03:06:00Z'));
    expect(after.ok&&after.record.relation).toBe('CLAIM_POSTDATES_SNAPSHOT_NEW_RECHECK_REQUIRED');
    const summary=ql280ProofReturns('2026-10-31T03:10:00Z',[arrival('devilndove'),arrival('ai-data-platform')]);
    expect(summary.rows.find(row=>row.source==='devilndove')).toMatchObject({unverifiedArrivalClaims:1,staleNoticeCount:1});
    expect(summary.rows.find(row=>row.source==='ai-data-platform')).toMatchObject({unverifiedArrivalClaims:1,staleNoticeCount:0});
  });

  it('rejects forged originals and invalid time ordering on arrival reconciliation',()=>{
    const claim=arrival('devilndove');
    expect(ql280ReconcileArrival({...claim,originalVerified:true as never},new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280ReconcileArrival({...claim,state:'SENT' as never},new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280ReconcileArrival(claim,new Date('2026-10-31T02:59:00Z')).ok).toBe(false);
    expect(ql280ReconcileArrival({...claim,source:'unknown' as never},new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
  });

  it('measures ONLY unsent escalation draft age, not imaginary delivery or response SLA',()=>{
    const draft=escalation();
    expect(ql280AckAging(draft,'2026-10-31T03:00:00Z')).toMatchObject({draftAgeHours:0,priority:'RECENT_UNSENT_DRAFT',
      delivery:'NOT_RECORDED',acknowledged:false,scope:'UNSENT_DRAFT_AGE_ONLY'});
    expect(ql280AckAging(draft,'2026-11-01T03:00:00Z').priority).toBe('FOLLOW_UP_DRAFT_REVIEW_DUE');
    expect(ql280AckAging(draft,'2026-11-02T03:00:00Z').priority).toBe('ESCALATION_DRAFT_REVIEW_DUE');
    expect(ql280AckAging(draft,'2026-10-31T02:58:00Z')).toMatchObject({draftAgeHours:null,priority:'CLOCK_REVIEW'});
  });

  it('accepts only nonsecret unverified acknowledgement references for actual QL-279 drafts',()=>{
    const result=ql280PrepareAckClaim(escalation(),'ACK-280-CLAIM',new Date('2026-10-31T03:06:00Z'));
    expect(result.ok).toBe(true);if(!result.ok)throw Error(result.reason);
    expect(result.claim).toMatchObject({source:'rosiedazzlers',receiptReferenceClaim:'ACK-280-CLAIM',
      delivery:'NOT_RECORDED',acknowledgement:'REFERENCE_CLAIM_UNVERIFIED',accepted:false,state:'DRAFT_NOT_SENT'});
    expect(ql280PrepareAckClaim({...escalation(),delivered:true as never},'ACK-280-CLAIM',new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280PrepareAckClaim(escalation(),'sk-private-token',new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280PrepareAckClaim(escalation(),'bad',new Date('2026-10-31T03:06:00Z')).ok).toBe(false);
    expect(ql280PrepareAckClaim(escalation(),'ACK-280-CLAIM',new Date('2026-10-31T02:58:00Z')).ok).toBe(false);
  });

  it('generates copy-only local packets without original verification, dispatch or TEST authorization',()=>{
    const packet=ql280AuditPacket([],[],[],[escalation()],'2026-10-31T03:08:00Z');
    expect(packet).toContain('3 changed / 3 unchanged');expect(packet).toContain('6/6 Proof-B HTTP 404');
    expect(packet).toContain('Original reviewer receipt verification: 0/6');
    expect(packet).toContain('Actual notifications delivered: 0');
    expect(packet).toContain('Real acknowledgements authenticated: 0');
    expect(packet).toContain('DISCONNECTED / HOLD');
  });

  it('mounts QL-280 desk with no false original acceptance and keeps 279 drafts across panel navigation',async()=>{
    await openDesk();
    expect(host.querySelector('[data-ql280-desk]')).not.toBeNull();
    expect(host.textContent).toContain('No QL-279 reviewer draft in this session');
    expect(button('Prepare original reviewer receipt request claim').disabled).toBe(true);
    await act(async()=>button('Open QL-279 source drafts').click());
    expect(host.querySelector('[data-ql279-desk]')).not.toBeNull();
    await act(async()=>button('Open QL-278 retest queue').click());
    await act(async()=>select('#ql278-outcome','observed'));
    await act(async()=>input('#ql278-note','Initial keyboard focus was visible on this real local device.'));
    await act(async()=>button('Capture fresh baseline').click());
    await act(async()=>select('#ql278-outcome','issue'));
    await act(async()=>input('#ql278-note','Later keyboard focus was no longer visible on the same device.'));
    await act(async()=>button('Compare & queue if needed').click());
    await act(async()=>button('Reviewer decisions & custody watch').click());
    await act(async()=>input('#ql279-reviewer-ref','REVIEW-280-LOCAL'));
    await act(async()=>input('#ql279-reviewer-note','Independent reviewer device witness is still missing for this case.'));
    await act(async()=>button('Prepare reviewer disposition draft').click());
    await act(async()=>button('Reviewer receipts & acknowledgement audit').click());
    expect(host.querySelectorAll('.ql279-ticket-strip>div')).toHaveLength(1);
    expect(button('Prepare original reviewer receipt request claim').disabled).toBe(false);
    await act(async()=>input('#ql280-reviewer-ref','RECEIPT-280-LOCAL'));
    await act(async()=>button('Prepare original reviewer receipt request claim').click());
    expect(host.textContent).toContain('BLOCKED PENDING ORIGINAL SIGNED REVIEW');
    expect(host.textContent).toContain('0/6 verified');
    expect(localStorage.length).toBe(0);
  });

  it('reconciles local QL-279 claimed arrivals but never authenticates newer notices with old snapshot',async()=>{
    await openDesk();await act(async()=>button('Open QL-279 source drafts').click());
    await act(async()=>button('02 Original custody arrival watch').click());
    await act(async()=>select('#ql279-arrival-source','devilndove'));
    await act(async()=>input('#ql279-arrival-ref','CUST-280-LOCAL'));
    await act(async()=>button('Record unverified arrival notice').click());
    await act(async()=>button('Reviewer receipts & acknowledgement audit').click());
    await act(async()=>button('02 Original Proof-B return reconciliation').click());
    expect(host.querySelectorAll('.ql278-aging-row:not(.head)')).toHaveLength(6);
    await act(async()=>select('#ql280-source','devilndove'));
    expect(host.textContent).toContain('CUST-280-LOCAL');
    await act(async()=>button('Reconcile this unverified notice').click());
    expect(host.textContent).toContain('CLAIM POSTDATES SNAPSHOT NEW RECHECK REQUIRED');
    expect(localStorage.length).toBe(0);
  });

  it('tracks QL-279 source-specific escalation drafts as unsent and records only unverified ack claims',async()=>{
    await openDesk();await act(async()=>button('Open QL-279 source drafts').click());
    await act(async()=>button('03 Six-app escalation follow-up').click());
    await act(async()=>select('#ql279-escalation-source','icamp'));
    await act(async()=>button('Prepare unsent escalation draft').click());
    await act(async()=>button('Reviewer receipts & acknowledgement audit').click());
    await act(async()=>button('03 Escalation acknowledgement aging').click());
    expect(host.querySelectorAll('.ql280-ack-grid article')).toHaveLength(1);
    await act(async()=>input('#ql280-ack-ref','ACK-280-LOCAL'));
    await act(async()=>button('Prepare unverified acknowledgement claim').click());
    expect(host.textContent).toContain('REFERENCE CLAIM UNVERIFIED');
    expect(host.textContent).toContain('Actual delivery NOT RECORDED');
    await act(async()=>button('Refresh draft age only').click());
    expect(host.textContent).toContain('no message dispatched');
    expect(localStorage.length).toBe(0);
  });

  it('copies read-only audit, handles clipboard failure and clears only current QL-280 local claims',async()=>{
    await openDesk();expect(host.querySelector<HTMLTextAreaElement>('#ql280-packet')?.readOnly).toBe(true);
    await act(async()=>button('Copy QL-280 audit packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied=vi.fn().mockResolvedValue(undefined);Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async()=>button('Copy QL-280 audit packet').click());
    expect(copied).toHaveBeenCalledOnce();expect(copied.mock.calls[0][0]).toContain('QL-280');
    await act(async()=>button('Clear QL-280 drafts').click());
    expect(host.textContent).toContain('QL-279 source drafts and QL-278 retest tickets were preserved');
    expect(localStorage.length).toBe(0);
  });

  it('preserves responsive layout, focus visibility, forced-colors and reduced-motion semantics',()=>{
    const css=readFileSync('src/operator/ql280-receipt-reconciliation.css','utf8');
    expect(css).toContain('max-width:610px');expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
