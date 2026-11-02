// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {operatorOrganizations} from '../ql191Organizations';
import {QL304_STEPS,QL304_RECONCILIATION,QL304_NEXT_BATCH_PROPOSALS,ql304Journey,ql304EmptyAcceptance,ql304MarkLocalReview} from '../ql304OperatorAcceptance';
import {Ql304OperatorAcceptance} from '../Ql304OperatorAcceptance';

describe('QL-304 four-business safe acceptance and batch handoff',()=>{
  it('has a full eight-step journey with real scoped fictional fixture references for each business',()=>{
    expect(QL304_STEPS.map(step=>step.workspace)).toEqual(['guided_intake','event_timeline','inbox','contacts','composer','queue','management','analytics']);
    for(const company of operatorOrganizations){
      const journey=ql304Journey(company.id);
      expect(journey.steps).toHaveLength(8);
      expect(journey.intake.organizationId).toBe(company.id);
      expect(journey.events).toHaveLength(6);
      expect(journey.queue).toHaveLength(4);
      expect(journey.events.every(event=>event.organizationId===company.id)).toBe(true);
      expect(journey.steps.every(step=>step.fixtureOnly&&step.externalActions===0)).toBe(true);
      expect(journey.steps[0].reference).toBe(journey.intake.reference);
    }
    expect(()=>ql304Journey('unknown' as never)).toThrow('UNKNOWN_COMPANY');
  });
  it('records only company-specific local review, never owner acceptance or pilot authority',()=>{
    const initial=ql304EmptyAcceptance('icamp');
    const reviewed=ql304MarkLocalReview(initial,'icamp','intake');
    expect(reviewed.checked).toEqual(['intake']);
    expect(reviewed.ownerAccepted).toBe(false);expect(reviewed.livePilotAuthorized).toBe(false);
    expect(ql304MarkLocalReview(reviewed,'icamp','intake')).toBe(reviewed);
    expect(ql304MarkLocalReview(reviewed,'yw','draft')).toBe(reviewed);
    expect(ql304MarkLocalReview(reviewed,'icamp','invalid' as never)).toBe(reviewed);
  });
  it('reconciles all six with zero authorized gates and labels future work as proposals',()=>{
    expect(QL304_RECONCILIATION).toHaveLength(6);
    expect(QL304_RECONCILIATION.filter(row=>row.kind==='Business app')).toHaveLength(4);
    for(const row of QL304_RECONCILIATION){expect(row.proofHttp).toBe(404);expect(row.passedGates).toBe(0);expect(row.requiredGates).toBe(5);expect(row.status).toBe('DISCONNECTED / HOLD');expect(row.gatewayRequests).toBe(0);expect(row.ownerTestApproved).toBe(false);}
    expect(QL304_NEXT_BATCH_PROPOSALS.map(item=>item.id)).toEqual(['QL-305','QL-306','QL-307','QL-308','QL-309','QL-310']);
  });
  it('exposes keyboard-button navigation and truthful local checkmarks',async()=>{
    const onNavigate=vi.fn();
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    await act(async()=>root.render(<Ql304OperatorAcceptance organizationId="rosiedazzlers" onSelectOrganization={vi.fn()} onNavigate={onNavigate}/>));
    expect(host.querySelector('#ql304-title')?.textContent).toBe('Four-business acceptance journey');
    const open=host.querySelector<HTMLButtonElement>('button[aria-label="Open Guided intake for Rosie Dazzlers"]')!;
    await act(async()=>open.click());
    expect(onNavigate).toHaveBeenCalledWith('guided_intake');
    const review=[...host.querySelectorAll<HTMLButtonElement>('.ql304-review')][0];
    await act(async()=>review.click());
    expect(host.textContent).toContain('✓ Locally reviewed');
    expect(host.textContent).toContain('OWNER SIGN-OFF NOT RECEIVED');
    await act(async()=>root.unmount());host.remove();
  });
});
