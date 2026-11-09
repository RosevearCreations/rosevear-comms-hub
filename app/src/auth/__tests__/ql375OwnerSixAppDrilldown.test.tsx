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
    expect(host.querySelectorAll('form,input,textarea,select')).toHaveLength(0);
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
});
