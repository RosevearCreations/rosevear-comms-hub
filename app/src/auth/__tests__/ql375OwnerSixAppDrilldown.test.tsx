// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OwnerSixAppDrilldown} from '../OwnerSixAppDrilldown';
import {ownerEntryTruth} from '../ql374OwnerEntry';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T18:00:00Z');
const pending:OwnerProgress={
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,connectionsState:'DISCONNECTED / HOLD',
  privateTestAuthorized:false,snapshotAt:new Date(NOW).toISOString()
};
let root:Root;let host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
const show=async(progress:OwnerProgress|null=pending)=>act(async()=>root.render(
  <OwnerSixAppDrilldown truth={ownerEntryTruth({role:'source',aal2:true,enrolled:false,progress,nowMs:NOW})}/>));

describe('QL-375 six-app identity drilldown accessible and non-authorizing',()=>{
  it('provides six readable toggles and keyboard focus to selected source details',async()=>{
    await show();
    const cards=[...host.querySelectorAll<HTMLButtonElement>('.ql375-source-card')];
    expect(cards).toHaveLength(6);
    expect(cards[0].getAttribute('aria-pressed')).toBe('true');
    expect(host.textContent).toContain('aggregate evidence, not an individual live source check');
    await act(async()=>cards[4].dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(host.querySelector('#ql375-detail-title')?.textContent).toContain('AI Data Platform');
    expect(host.querySelector('#ql375-detail-title')).toBe(document.activeElement);
    expect(cards[4].getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelectorAll('form,input,textarea')).toHaveLength(0);
    expect(host.querySelectorAll('select')).toHaveLength(19); // QL-392/393/395/396/397/398/399/400/401/402 preview filters only
  });
  it('does not claim a live per-shell status when protected readback is absent',async()=>{
    await show(null);
    expect(host.querySelectorAll('.ql375-unknown')).toHaveLength(6);
    expect(host.textContent).toContain('No connection may be inferred');
    expect(host.textContent).toContain('not authorized');
  });
  it('provides only fixed help anchors and a protected official link',async()=>{
    await show();
    const links=[...host.querySelectorAll<HTMLAnchorElement>('.ql375-help a')];
    expect(links).toHaveLength(3);
    expect(links[0].getAttribute('href')).toBe('#ql370-refresh-status');
    expect(links[1].getAttribute('href')).toBe('#ql371-owner-ceremony');
    expect(links[2].getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[2].getAttribute('target')).toBe('_blank');
  });
  it('shows QL-389 signature/replay gates as read-only HOLD instructions, not a live intake',async()=>{
    await show();
    const gate=host.querySelector('.ql389-intake-gate');
    expect(gate?.textContent).toContain('HOLD');
    expect(gate?.textContent).toContain('PREVIEW_ONLY');
    expect(gate?.querySelectorAll('ol li')).toHaveLength(6);
    expect(gate?.querySelectorAll('button,input,form')).toHaveLength(0);
    expect(gate?.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('shows QL-390 illustrative operator evidence without live records or controls',async()=>{
    await show();
    const ledger=host.querySelector('.ql390-simulation');
    expect(ledger?.textContent).toContain('INERT_PREVIEW');
    expect(ledger?.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(ledger?.textContent).toContain('PREVIEW_CONFLICT');
    expect(ledger?.textContent).toContain('Unverified');
    expect(ledger?.querySelectorAll('button,input,form')).toHaveLength(0);
    expect(ledger?.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('shows QL-391 synthetic cross-source chronology and evidence age without allowing action',async()=>{
    await show();
    const correlation=host.querySelector('.ql391-correlation');
    expect(correlation?.textContent).toContain('INERT_PREVIEW');
    expect(correlation?.textContent).toContain('HOLD');
    expect(correlation?.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(correlation?.textContent).toContain('Yard Workers');
    expect(correlation?.textContent).toContain('iCamp');
    expect(correlation?.textContent).toContain('STALE');
    expect(correlation?.querySelectorAll('button,form,input,textarea,select')).toHaveLength(0);
    expect(correlation?.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('provides accessible QL-392 read-only source, freshness and priority filters with six-source impact',async()=>{
    await show();
    const review=host.querySelector('.ql392-operator-review')!;
    expect(review.textContent).toContain('INERT_PREVIEW');
    expect(review.textContent).toContain('HOLD');
    expect(review.querySelectorAll('.ql392-review-controls select')).toHaveLength(3);
    expect(review.querySelectorAll('table')).toHaveLength(2);
    expect(review.querySelectorAll('table')[0].querySelectorAll('tbody tr')).toHaveLength(4);
    expect(review.querySelectorAll('table')[1].querySelectorAll('tbody tr')).toHaveLength(6);
    expect(review.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(review.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=review.querySelector<HTMLSelectElement>('#ql392-source-filter')!;
    await act(async()=>{source.value='icamp';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(review.querySelectorAll('table')[0].querySelectorAll('tbody tr')).toHaveLength(1);
    expect(review.querySelector('[role="status"]')?.textContent).toContain('Showing 1 of 4');
    const priority=review.querySelector<HTMLSelectElement>('#ql392-priority-filter')!;
    await act(async()=>{priority.value='REVIEW_NOW';priority.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(review.querySelector('[role="status"]')?.textContent).toContain('Showing 0 of 4');
    expect(review.textContent).toContain('No synthetic examples match these filters');
    expect(review.querySelectorAll('table')[1].querySelectorAll('tbody tr')).toHaveLength(6);
  });
  it('shows QL-393 non-sending source-scoped draft and five distinct HOLD gates',async()=>{
    await show();
    const followups=host.querySelector('.ql393-followups')!;
    expect(followups.textContent).toContain('HOLD');
    expect(followups.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(followups.textContent).toContain('CONFLICT_REVIEW');
    expect(followups.textContent).toContain('devilndove');
    expect(followups.querySelectorAll('details li')).toHaveLength(5);
    expect(followups.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(followups.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const select=followups.querySelector<HTMLSelectElement>('#ql393-correlation-choice')!;
    await act(async()=>{select.value='correlation-ql392-integration';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(followups.textContent).toContain('EVIDENCE_RECHECK');
    expect(followups.textContent).toContain('icamp');
    expect(followups.querySelectorAll('tbody tr')).toHaveLength(1);
    await act(async()=>{select.value='correlation-ql392-service';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(followups.textContent).toContain('No source-scoped synthetic concern requires a draft');
    expect(followups.querySelectorAll('tbody tr')).toHaveLength(1);
  });
  it('shows QL-394 in-memory approval history and review-only drift without action controls',async()=>{
    await show();
    const history=host.querySelector('.ql394-decision-history')!;
    expect(history.textContent).toContain('INERT_PREVIEW');
    expect(history.textContent).toContain('original owner authorization remains on HOLD');
    expect(history.querySelectorAll('table')).toHaveLength(2);
    expect(history.querySelectorAll('table')[0].querySelectorAll('tbody tr')).toHaveLength(15);
    expect(history.querySelectorAll('table')[1].querySelectorAll('tbody tr')).toHaveLength(5);
    expect(history.textContent).toContain('UNVERIFIED_GRANT_CHANGE');
    expect(history.textContent).toContain('PIN_REFERENCE_DRIFT');
    expect(history.textContent).toContain('GATE_REVERSAL');
    expect(history.textContent).toContain('SCENARIO_REFERENCE_ONLY');
    expect(history.querySelectorAll('button,input,form,textarea,select')).toHaveLength(0);
    expect(history.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
  it('compares QL-395 simulated evidence windows and retains separate owner HOLD continuity',async()=>{
    await show();
    const comparison=host.querySelector('.ql395-evidence-comparison')!;
    expect(comparison.textContent).toContain('INERT_PREVIEW');
    expect(comparison.textContent).toContain('original authorization remains HOLD');
    expect(comparison.querySelectorAll('table')).toHaveLength(3);
    expect(comparison.querySelectorAll('table')[0].querySelectorAll('tbody tr')).toHaveLength(5);
    expect(comparison.querySelectorAll('table')[1].querySelectorAll('tbody tr')).toHaveLength(3);
    expect(comparison.querySelectorAll('table')[2].querySelectorAll('tbody tr')).toHaveLength(2);
    expect(comparison.textContent).toContain('PIN_REFERENCE_DRIFT');
    expect(comparison.textContent).toContain('NOT_VERIFIED');
    expect(comparison.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(comparison.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const selector=comparison.querySelector<HTMLSelectElement>('#ql395-compare-window')!;
    await act(async()=>{selector.value='SECOND_THIRD';selector.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(comparison.textContent).toContain('REVERTED_TO_HOLD');
    expect(comparison.querySelectorAll('table')[1].querySelectorAll('tbody tr')).toHaveLength(2);
    await act(async()=>{selector.value='FIRST_THIRD';selector.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(comparison.querySelectorAll('table')[1].querySelectorAll('tbody tr')).toHaveLength(5);
    expect(comparison.textContent).toContain('PROVENANCE_CHANGED');
  });
  it('shows QL-396 source-scoped synthetic recheck queue, age bands and inert escalation filters',async()=>{
    await show();
    const queue=host.querySelector('.ql396-recheck-queue')!;
    expect(queue.textContent).toContain('INERT_PREVIEW');
    expect(queue.textContent).toContain('first synthetic observation');
    expect(queue.querySelectorAll('tbody tr')).toHaveLength(15);
    expect(queue.textContent).toContain('Devil n Dove');
    expect(queue.textContent).toContain('MASTER_OWNER');
    expect(queue.textContent).toContain('NOT_VERIFIED');
    expect(queue.textContent).toContain('OVERDUE');
    expect(queue.textContent).toContain('AGING');
    expect(queue.textContent).toContain('NEW');
    expect(queue.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(queue.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=queue.querySelector<HTMLSelectElement>('#ql396-source-filter')!;
    const age=queue.querySelector<HTMLSelectElement>('#ql396-age-filter')!;
    await act(async()=>{source.value='icamp';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(queue.querySelectorAll('tbody tr')).toHaveLength(5);
    await act(async()=>{age.value='OVERDUE';age.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(queue.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(queue.textContent).toContain('No illustrative recheck matches');
    await act(async()=>{age.value='AGING';age.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(queue.querySelectorAll('tbody tr')).toHaveLength(5);
    expect(queue.querySelector('[role="status"]')?.textContent).toContain('Showing 5 of 15');
  });
  it('shows QL-397 chronological synthetic outcomes with original owner review and closure on HOLD',async()=>{
    await show();
    const history=host.querySelector('.ql397-outcome-history')!;
    expect(history.textContent).toContain('INERT_PREVIEW');
    expect(history.textContent).toContain('all closure decisions remain HOLD');
    expect(history.querySelectorAll('tbody tr')).toHaveLength(15);
    expect(history.textContent).toContain('SIMULATED_CONFLICT_IDENTIFIED');
    expect(history.textContent).toContain('SCENARIO_REVIEW_NOTE_ONLY');
    expect(history.textContent).toContain('NOT_VERIFIED');
    expect(history.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(history.querySelectorAll('.ql397-closure-checks ol li')).toHaveLength(5);
    expect(history.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=history.querySelector<HTMLSelectElement>('#ql397-source-filter')!;
    const review=history.querySelector<HTMLSelectElement>('#ql397-review-filter')!;
    await act(async()=>{source.value='devilndove';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(history.querySelectorAll('tbody tr')).toHaveLength(5);
    await act(async()=>{review.value='CONFLICT_REQUIRES_INDEPENDENT_REVIEW';
      review.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(history.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(history.querySelector('[role="status"]')?.textContent).toContain('Showing 1 of 15');
    await act(async()=>{source.value='rosevear-ai-hub';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(history.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(history.textContent).toContain('No illustrative outcome matches');
    await act(async()=>{review.value='SCENARIO_REVIEW_NOTE_ONLY';
      review.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(history.querySelectorAll('tbody tr')).toHaveLength(1);
  });
  it('shows QL-398 five-axis independent closure checklists and preserves HOLD through attempted approval',async()=>{
    await show();
    const closure=host.querySelector('.ql398-closure-readiness')!;
    expect(closure.textContent).toContain('INERT_PREVIEW');
    expect(closure.textContent).toContain('HOLD is mandatory');
    expect(closure.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(closure.querySelectorAll('tbody tr td details ol li')).toHaveLength(19); // 15 independent checks + four audit entries
    expect(closure.textContent).toContain('CLAIMED_SCENARIO_COMPLETE');
    expect(closure.textContent).toContain('HOLD_PRESERVED');
    expect(closure.textContent).toContain('NOT_VERIFIED');
    expect(closure.textContent).toContain('NOT_ATTESTED');
    expect(closure.querySelector('[role="status"]')?.textContent).toContain('0 eligible closures');
    expect(closure.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(closure.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=closure.querySelector<HTMLSelectElement>('#ql398-source-filter')!;
    const hold=closure.querySelector<HTMLSelectElement>('#ql398-hold-filter')!;
    await act(async()=>{source.value='icamp';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(closure.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(closure.textContent).toContain('audit-ql398-0003');
    await act(async()=>{hold.value='HOLD_ORIGINAL_EVIDENCE';hold.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(closure.textContent).toContain('No illustrative closure case matches');
    await act(async()=>{source.value='rosevear-ai-hub';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(closure.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(closure.querySelector('[role="status"]')?.textContent).toContain('Showing 1 of 3');
  });
  it('shows QL-399 original handoff requirements, reviewer exceptions and source-linked HOLD history',async()=>{
    await show();
    const handoff=host.querySelector('.ql399-evidence-handoff')!;
    expect(handoff.textContent).toContain('INERT_PREVIEW');
    expect(handoff.textContent).toContain('original handoff BLOCKED; closure HOLD');
    expect(handoff.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(handoff.querySelectorAll('tbody tr td details ol li')).toHaveLength(27); // 15 gates + four exceptions + eight trace entries
    expect(handoff.textContent).toContain('SCENARIO_CLAIM_CONFLICT');
    expect(handoff.textContent).toContain('HOLD_PRESERVED');
    expect(handoff.textContent).toContain('NOT_PRESENT');
    expect(handoff.textContent).toContain('NOT_ATTESTED');
    expect(handoff.querySelector('[role="status"]')?.textContent).toContain('0 authorized closures');
    expect(handoff.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(handoff.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=handoff.querySelector<HTMLSelectElement>('#ql399-source-filter')!;
    const priority=handoff.querySelector<HTMLSelectElement>('#ql399-exception-filter')!;
    await act(async()=>{priority.value='REVIEW_CONFLICT';priority.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(handoff.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(handoff.textContent).toContain('devilndove');
    await act(async()=>{source.value='icamp';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(handoff.textContent).toContain('No illustrative handoff matches');
    await act(async()=>{priority.value='COLLECT_ORIGINAL';priority.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(handoff.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(handoff.textContent).toContain('exception-ql399-0003');
  });
  it('shows QL-400 role-only assignment and synthetic freshness warnings without authority',async()=>{
    await show();
    const preview=host.querySelector('.ql400-assignment-preview')!;
    expect(preview.textContent).toContain('INERT_PREVIEW');
    expect(preview.textContent).toContain('assignment preview only; closure HOLD');
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(preview.textContent).toContain('PREVIEW_ONLY_NOT_ASSIGNED');
    expect(preview.textContent).toContain('UNKNOWN_ORIGINAL');
    expect(preview.textContent).toContain('NOT_VERIFIED');
    expect(preview.textContent).toContain('OVERDUE');
    expect(preview.textContent).toContain('ql398/audit-ql398-0002');
    expect(preview.querySelector('[role="status"]')?.textContent).toContain('0 closures authorized');
    expect(preview.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(preview.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=preview.querySelector<HTMLSelectElement>('#ql400-source-filter')!;
    const attention=preview.querySelector<HTMLSelectElement>('#ql400-attention-filter')!;
    await act(async()=>{attention.value='OVERDUE';attention.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(preview.textContent).toContain('devilndove');
    await act(async()=>{source.value='icamp';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.textContent).toContain('No illustrative assignment matches');
    await act(async()=>{attention.value='COLLECT_ORIGINAL';attention.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(preview.querySelector('[role="status"]')?.textContent).toContain('Showing 1 of 3');
  });
  it('shows QL-401 scenario acknowledgement and chronological HOLD recovery without sending',async()=>{
    await show();
    const preview=host.querySelector('.ql401-escalation-timeline')!;
    expect(preview.textContent).toContain('INERT_PREVIEW');
    expect(preview.textContent).toContain('no authenticated acknowledgement or release of HOLD');
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(preview.textContent).toContain('SCENARIO_ACK_ONLY');
    expect(preview.textContent).toContain('NO_SCENARIO_ACK');
    expect(preview.textContent).toContain('NOT_VERIFIED');
    expect(preview.textContent).toContain('NOT_ATTESTED');
    expect(preview.textContent).toContain('ql398/audit-ql398-0002');
    expect(preview.textContent).toContain('No assignment accepted');
    expect(preview.querySelector('[role="status"]')?.textContent).toContain('0 authorized closures');
    expect(preview.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(preview.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=preview.querySelector<HTMLSelectElement>('#ql401-source-filter')!;
    const ack=preview.querySelector<HTMLSelectElement>('#ql401-ack-filter')!;
    await act(async()=>{ack.value='NO_SCENARIO_ACK';ack.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(preview.textContent).toContain('icamp');
    await act(async()=>{source.value='devilndove';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.textContent).toContain('No illustrative escalation matches');
    await act(async()=>{ack.value='SCENARIO_ACK_ONLY';ack.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(preview.querySelector('[role="status"]')?.textContent).toContain('Showing 1 of 3');
  });
  it('shows QL-402 recovery decision drift and separate unsigned owner/witness checklists',async()=>{
    await show();
    const preview=host.querySelector('.ql402-recovery-audit')!;
    expect(preview.textContent).toContain('INERT_PREVIEW');
    expect(preview.textContent).toContain('no real recovery decision or original owner sign-off');
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(preview.textContent).toContain('SCENARIO_REFERENCE_DROPPED');
    expect(preview.textContent).toContain('SCENARIO_REFERENCE_RESTORED');
    expect(preview.textContent).toContain('HOLD_PRESERVED');
    expect(preview.textContent).toContain('NOT_ATTESTED');
    expect(preview.textContent).toContain('NOT_PRESENT');
    expect(preview.querySelectorAll('tbody tr td details ol li')).toHaveLength(25); // five scenario notes x 2 + fifteen original gates
    expect(preview.querySelector('[role="status"]')?.textContent).toContain('15 original gate checks still outstanding');
    expect(preview.querySelector('[role="status"]')?.textContent).toContain('0 authorized closures');
    expect(preview.querySelectorAll('button,input,form,textarea')).toHaveLength(0);
    expect(preview.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    const source=preview.querySelector<HTMLSelectElement>('#ql402-source-filter')!;
    const drift=preview.querySelector<HTMLSelectElement>('#ql402-drift-filter')!;
    await act(async()=>{drift.value='UNCHANGED';drift.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(preview.textContent).toContain('icamp');
    await act(async()=>{source.value='devilndove';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.textContent).toContain('No illustrative recovery review matches');
    await act(async()=>{drift.value='DRIFT_ONLY';drift.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(preview.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(preview.querySelector('[role="status"]')?.textContent).toContain('Showing 1 of 3');
  });
});
