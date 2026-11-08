// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {OwnerIncidentReview} from '../OwnerIncidentReview';
import {ownerEntryTruth} from '../ql374OwnerEntry';
import type {OwnerProgress} from '../ql370OwnerProgress';

const NOW=Date.parse('2026-11-08T18:00:00Z');
const pending:OwnerProgress={
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',ownerRole:'source',
  sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  totalApplicationShells:6,heldApplicationShells:6,connectionsState:'DISCONNECTED / HOLD',
  privateTestAuthorized:false,snapshotAt:new Date(NOW-93000).toISOString()
};
let root:Root;let host:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
const show=async(p:OwnerProgress|null=pending)=>act(async()=>root.render(<OwnerIncidentReview
  role="source" aal2={true} progress={p} nowMs={NOW}
  truth={ownerEntryTruth({role:'source',aal2:true,enrolled:false,progress:p,nowMs:NOW})}/>));

describe('QL-376 accessible, non-authorizing incident review',()=>{
  it('filters by category and provides an honest no-results state',async()=>{
    await show();
    const select=host.querySelector<HTMLSelectElement>('#ql376-category')!;
    expect(select).toBeTruthy();
    expect(host.textContent).toContain('Showing 2 of 2 alerts');
    await act(async()=>{select.value='security';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.textContent).toContain('No alerts match this filter');
    await act(async()=>{select.value='freshness';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.querySelectorAll('.ql376-alert')).toHaveLength(1);
    expect(host.textContent).toContain('Expiring soon');
  });
  it('moves focus to selected alert details without any server writes',async()=>{
    await show(null);
    const items=host.querySelectorAll<HTMLButtonElement>('.ql376-alert');
    expect(items.length).toBeGreaterThan(1);
    await act(async()=>items[1].dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(document.activeElement).toBe(host.querySelector('#ql376-detail-title'));
    expect(items[1].getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('a')?.getAttribute('href')).toBe('#ql370-refresh-status');
    expect(host.querySelectorAll('form,input,textarea')).toHaveLength(0);
  });
});
