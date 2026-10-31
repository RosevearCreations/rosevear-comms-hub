// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OperatorShell } from '../OperatorShell';
import { QL270_SOURCES } from '../ql270ConnectionCentre';
import { ql276CaptureOwnerObservation } from '../ql276EvidenceIntake';
import { ql277CompareAccessibility } from '../ql277DriftReview';
import { QL278_PUBLIC_SOURCE_RECHECK, ql278CreateRetestTicket, ql278RecordRetest } from '../ql278FollowupDesk';
import { QL279_OBSERVED_AT, QL279_PUBLIC_SOURCE_RECHECK, ql279AuditPacket,
  ql279PinnedProofUrl, ql279PrepareArrivalClaim, ql279PrepareEscalation,
  ql279PrepareReviewerDraft, ql279SourceWatch } from '../ql279ReviewerCustodyEscalation';

let host: HTMLDivElement;
let root: Root;
beforeEach(async()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  localStorage.clear();host=document.createElement('div');document.body.append(host);
  root=createRoot(host);await act(async()=>root.render(<OperatorShell/>));
});
afterEach(async()=>{
  await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
});
function button(label:string) {
  const match=[...host.querySelectorAll<HTMLButtonElement>('button')].find(item=>item.getAttribute('aria-label')===label||item.textContent?.includes(label));
  if(!match)throw Error(`Missing button ${label}`);return match;
}
function select(selector:string,value:string) {
  const field=host.querySelector<HTMLSelectElement>(selector)!;field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));
}
function input(selector:string,value:string) {
  const field=host.querySelector<HTMLInputElement|HTMLTextAreaElement>(selector)!;
  const descriptor=Object.getOwnPropertyDescriptor(field instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value')!;
  descriptor.set!.call(field,value);field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));
}
async function openDesk() {
  await act(async()=>button('IT Command').click());
  await act(async()=>button('Reviewer decisions & custody watch').click());
}
function observed(outcome:'issue'|'observed',time:string) {
  const result=ql276CaptureOwnerObservation({checkId:'keyboard',outcome,device:'desktop',assistiveMethod:'keyboard',
    note:'Checked actual operator keyboard focus during this local test.'},new Date(time));
  if(!result.ok)throw Error(result.reason);return result.record;
}
function ticketWithRetest() {
  const comparison=ql277CompareAccessibility(observed('observed','2026-10-31T02:36:00Z'),observed('issue','2026-10-31T02:37:00Z'));
  const queued=ql278CreateRetestTicket(comparison);if(!queued.ok)throw Error(queued.reason);
  const recorded=ql278RecordRetest(queued.ticket,observed('observed','2026-10-31T02:38:00Z'));
  if(!recorded.ok)throw Error(recorded.reason);return recorded.ticket;
}

describe('QL-279 independent reviewer drafts, original custody arrival watch and six-app escalation',()=>{
  it('pins six authentic public GitHub observations with two moved SHAs and all six original proofs missing',()=>{
    expect(QL279_OBSERVED_AT).toBe('2026-10-31T02:33:44Z');
    expect(QL279_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
    expect(new Set(QL279_PUBLIC_SOURCE_RECHECK.map(row=>row.source))).toEqual(new Set(QL270_SOURCES.map(row=>row.id)));
    for(const row of QL279_PUBLIC_SOURCE_RECHECK) {
      expect(row.sha).toMatch(/^[a-f0-9]{40}$/);expect(row.http).toBe(404);
      expect(ql279PinnedProofUrl(row.source)).toContain(`ref=${row.sha}`);
      expect(ql279PinnedProofUrl(row.source)).toContain('docs/integration/ql246-source-proof.json');
    }
    const report=ql279SourceWatch('2026-10-31T02:40:00Z');
    expect(report).toMatchObject({changed:2,unchanged:4,missing:6,sources:6,originalReceiptsVerified:0,
      independentDispositionsAccepted:0,noticesSent:0,release:'DISCONNECTED / HOLD',freshness:'PINNED_RECENT',escalation:'MONITOR'});
    expect(report.rows.filter(row=>row.moved).map(row=>row.source)).toEqual(['devilndove','rosiedazzlers']);
    expect(report.rows.every(row=>row.proof==='ORIGINAL_PROOF_NOT_PUBLISHED_AT_PIN'&&row.notification==='DRAFT_NOT_SENT')).toBe(true);
    expect(QL278_PUBLIC_SOURCE_RECHECK).toHaveLength(6);
  });

  it('separates snapshot aging and follow-up escalation without automatic network access',()=>{
    expect(ql279SourceWatch('2026-11-01T02:00:00Z')).toMatchObject({freshness:'PINNED_RECENT',escalation:'FOLLOW_UP_DUE'});
    expect(ql279SourceWatch('2026-11-02T03:00:00Z')).toMatchObject({freshness:'PUBLIC_RECHECK_DUE',escalation:'ESCALATION_REVIEW_DUE'});
    expect(ql279SourceWatch('2026-10-31T01:00:00Z')).toMatchObject({freshness:'CLOCK_REVIEW',escalation:'CLOCK_REVIEW',observedAgeHours:null});
    expect(ql279SourceWatch('invalid').freshness).toBe('CLOCK_REVIEW');
    expect(ql279SourceWatch(QL279_OBSERVED_AT).nextPublicCheckDueAt).toBe('2026-11-01T02:33:44.000Z');
    expect(()=>ql279PinnedProofUrl('unknown' as never)).toThrow('UNKNOWN_QL279_SOURCE');
  });

  it('creates reviewer disposition proposals only for real open QL-278 retest tickets',()=>{
    const ticket=ticketWithRetest();
    const result=ql279PrepareReviewerDraft(ticket,'REVIEW-279-A1','NO_ISSUE_CLAIM_NEEDS_WITNESS',
      'A later no-issue result is recorded; independent witnessing is still pending.',new Date('2026-10-31T02:39:00Z'));
    expect(result.ok).toBe(true);
    if(!result.ok)throw Error(result.reason);
    expect(result.draft).toMatchObject({checkId:'keyboard',actor:'INDEPENDENT_REVIEWER_CLAIM',
      decision:'NO_ISSUE_CLAIM_NEEDS_WITNESS',authentication:'NOT_AUTHENTICATED',disposition:'REVIEW_DRAFT_ONLY',
      closure:'OPEN',accepted:false,state:'DRAFT_NOT_SENT',reviewerReferenceClaim:'REVIEW-279-A1'});
    expect(result.draft.retestRecordedAt).toBe('2026-10-31T02:38:00.000Z');
  });

  it('rejects fabricated acceptance, secret-like data and no-issue claims without comparable retest',()=>{
    const ticket=ticketWithRetest();
    const note='No verified independent device evidence was included in the claim.';
    expect(ql279PrepareReviewerDraft({...ticket,accepted:true as never},'REVIEW-279-A1','EVIDENCE_INCOMPLETE',note,new Date()).ok).toBe(false);
    expect(ql279PrepareReviewerDraft({...ticket,retest:null},'REVIEW-279-A1','NO_ISSUE_CLAIM_NEEDS_WITNESS',note,new Date()).ok).toBe(false);
    expect(ql279PrepareReviewerDraft(ticket,'Bearer-secret','EVIDENCE_INCOMPLETE',note,new Date()).ok).toBe(false);
    expect(ql279PrepareReviewerDraft(ticket,'bad','RETEST_REQUIRED',note,new Date()).ok).toBe(false);
    expect(ql279PrepareReviewerDraft(ticket,'REVIEW-279-A1','EVIDENCE_INCOMPLETE','Contact user@example.com',new Date()).ok).toBe(false);
    expect(ql279PrepareReviewerDraft(ticket,'REVIEW-279-A1','EVIDENCE_INCOMPLETE','short',new Date()).ok).toBe(false);
    expect(ql279PrepareReviewerDraft(ticket,'REVIEW-279-A1','EVIDENCE_INCOMPLETE',note,new Date('bad')).ok).toBe(false);
    expect(ql279PrepareReviewerDraft(ticket,'REVIEW-279-A1','UNKNOWN' as never,note,new Date()).ok).toBe(false);
  });

  it('handles three original artifact arrival notice types as unverified nonsecret claims only',()=>{
    for(const kind of ['SOURCE_PUBLICATION_NOTICE','CUSTODIAN_ORIGINAL_RETURN_NOTICE','WITNESS_ORIGINAL_RETURN_NOTICE'] as const) {
      const result=ql279PrepareArrivalClaim('rosiedazzlers',kind,'NOTICE-279-A1',new Date('2026-10-31T02:40:00Z'));
      expect(result.ok).toBe(true);
      if(!result.ok)throw Error(result.reason);
      expect(result.claim).toMatchObject({source:'rosiedazzlers',kind,notice:'CLAIMED_NOT_CONFIRMED',
        originalVerified:false,evidence:'PUBLIC_PROOF_404_CUSTODY_UNVERIFIED',state:'DRAFT_NOT_SENT'});
      expect(result.claim.sha).toBe('00727561f2ebba36a3a171e0fe5624e35f9b0ad5');
    }
    expect(ql279PrepareArrivalClaim('rosiedazzlers','WRONG' as never,'NOTICE-279-A1',new Date()).ok).toBe(false);
    expect(ql279PrepareArrivalClaim('wrong' as never,'SOURCE_PUBLICATION_NOTICE','NOTICE-279-A1',new Date()).ok).toBe(false);
    expect(ql279PrepareArrivalClaim('rosiedazzlers','SOURCE_PUBLICATION_NOTICE','sk-super-secret',new Date()).ok).toBe(false);
    expect(ql279PrepareArrivalClaim('rosiedazzlers','SOURCE_PUBLICATION_NOTICE','',new Date()).ok).toBe(false);
    expect(ql279PrepareArrivalClaim('rosiedazzlers','SOURCE_PUBLICATION_NOTICE','NOTICE-279-A1',new Date('bad')).ok).toBe(false);
  });

  it('makes six-app escalation aging drafts with zero deliveries or owner authorization',()=>{
    const draft=ql279PrepareEscalation('devilndove','PROOF_STILL_404',new Date('2026-11-02T04:00:00Z'));
    expect(draft).toMatchObject({source:'devilndove',reason:'PROOF_STILL_404',priority:'ESCALATION_REVIEW_DUE',
      addressedTo:'SOURCE_MAINTAINER_AND_INDEPENDENT_CUSTODIAN',state:'DRAFT_NOT_SENT',delivered:false,approval:'NOT_GIVEN'});
    expect(draft.currentSha).toBe('1c3ae46467d2604315c42d0f6515a636129b1928');
    expect(ql279PrepareEscalation('icamp','ORIGINAL_CUSTODY_UNVERIFIED',new Date('2026-10-31T03:00:00Z')).priority).toBe('MONITOR');
    expect(()=>ql279PrepareEscalation('wrong' as never,'PROOF_STILL_404',new Date())).toThrow('UNKNOWN_ESCALATION_SOURCE');
    expect(()=>ql279PrepareEscalation('icamp','bad' as never,new Date())).toThrow('INVALID_ESCALATION_REASON');
    expect(()=>ql279PrepareEscalation('icamp','PROOF_STILL_404',new Date('bad'))).toThrow('INVALID_ESCALATION_TIME');
    const packet=ql279AuditPacket([],[],[draft],'2026-10-31T03:00:00Z');
    expect(packet).toContain('2 changed / 4 unchanged');expect(packet).toContain('6/6 original Proof-B HTTP 404');
    expect(packet).toContain('Original verification preconditions: 0/7');
    expect(packet).toContain('notices actually sent: 0');expect(packet).toContain('DISCONNECTED / HOLD');
  });

  it('shows a real reusable command desk but never creates fake reviewer acceptance',async()=>{
    await openDesk();
    expect(host.querySelector('[data-ql279-desk]')).not.toBeNull();
    expect(host.textContent).toContain('No local retest ticket is open');
    expect(button('Prepare reviewer disposition draft').disabled).toBe(true);
    await act(async()=>button('Open QL-278 retest queue').click());
    expect(host.querySelector('[data-ql278-desk]')).not.toBeNull();
    await act(async()=>select('#ql278-outcome','observed'));
    await act(async()=>input('#ql278-note','Initial keyboard tab order was observed to work on this device.'));
    await act(async()=>button('Capture fresh baseline').click());
    await act(async()=>select('#ql278-outcome','issue'));
    await act(async()=>input('#ql278-note','Later keyboard focus outline failed on a control in this device.'));
    await act(async()=>button('Compare & queue if needed').click());
    expect(host.textContent).toContain('HIGH REGRESSION');
    await act(async()=>button('Reviewer decisions & custody watch').click());
    expect(host.querySelectorAll('.ql279-ticket-strip>div')).toHaveLength(1);
    expect(button('Prepare reviewer disposition draft').disabled).toBe(false);
    await act(async()=>input('#ql279-reviewer-ref','REVIEW-279-LOCAL'));
    await act(async()=>input('#ql279-reviewer-note','A second independent reviewer is required before closing this regression.'));
    await act(async()=>button('Prepare reviewer disposition draft').click());
    expect(host.textContent).toContain('EVIDENCE INCOMPLETE');
    expect(host.textContent).toContain('Reviewer authentication NOT PERFORMED');
    expect(localStorage.length).toBe(0);
  });

  it('displays all seven custody prerequisites and records only claimed arrival notices',async()=>{
    await openDesk();await act(async()=>button('02 Original custody arrival watch').click());
    expect(host.querySelectorAll('.ql278-gate-list li')).toHaveLength(7);
    await act(async()=>select('#ql279-arrival-source','devilndove'));
    await act(async()=>input('#ql279-arrival-ref','CUST-279-NOTICE'));
    await act(async()=>button('Record unverified arrival notice').click());
    expect(host.textContent).toContain('CLAIMED NOT CONFIRMED');
    expect(host.textContent).toContain('Original verification: NO');
    expect(host.querySelector<HTMLTextAreaElement>('#ql279-packet')?.value).toContain('CUST-279-NOTICE');
    expect(localStorage.length).toBe(0);
  });

  it('shows six actual public pinned SHA changes and unsent human escalation drafts',async()=>{
    await openDesk();await act(async()=>button('03 Six-app escalation follow-up').click());
    expect(host.querySelectorAll('.ql278-aging-row:not(.head)')).toHaveLength(6);
    expect([...host.querySelectorAll<HTMLAnchorElement>('.ql278-aging-row a')].every(link=>link.href.includes('ref=')&&link.rel.includes('noopener'))).toBe(true);
    await act(async()=>select('#ql279-escalation-source','ai-data-platform'));
    await act(async()=>button('Prepare unsent escalation draft').click());
    expect(host.textContent).toContain('PROOF STILL 404');
    expect(host.textContent).toContain('DRAFT NOT SENT');
    await act(async()=>button('Refresh time only').click());
    expect(host.textContent).toContain('no source was queried');
    expect(localStorage.length).toBe(0);
  });

  it('supports only local copy, clipboard failure and clearing drafts without erasing active retest tickets',async()=>{
    await openDesk();
    expect(host.querySelector<HTMLTextAreaElement>('#ql279-packet')?.readOnly).toBe(true);
    await act(async()=>button('Copy QL-279 draft packet').click());
    expect(host.textContent).toContain('Clipboard unavailable');
    const copied=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:copied}});
    await act(async()=>button('Copy QL-279 draft packet').click());
    expect(copied).toHaveBeenCalledOnce();expect(copied.mock.calls[0][0]).toContain('QL-279');
    await act(async()=>button('Clear QL-279 drafts').click());
    expect(host.textContent).toContain('QL-278 open retests were preserved');
    expect(localStorage.length).toBe(0);
  });

  it('inherits responsive layout, visible focus, forced-color and reduced-motion presentation',()=>{
    const css=readFileSync('src/operator/ql279-reviewer-custody-escalation.css','utf8');
    expect(css).toContain('max-width:610px');expect(css).toContain(':focus-visible');
    expect(css).toContain('forced-colors:active');expect(css).toContain('prefers-reduced-motion:reduce');
  });
});
