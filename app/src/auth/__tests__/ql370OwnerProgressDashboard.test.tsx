// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OwnerProgressDashboard} from '../OwnerProgressDashboard';
import type {OwnerCeremonyGateway} from '../ql369OwnerEnrollment';

const sha='ab'.repeat(32);
const valid={
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'CURRENT',expiresAt:'2026-11-08T16:20:00+00:00'},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,
    lastVerifiedEventAt:null},
  heldApplicationShells:6,totalApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,
  snapshotAt:'2026-11-08T16:00:00+00:00'
};
let host:HTMLDivElement;
let root:Root;
beforeEach(()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{
  await act(async()=>root.unmount());host.remove();
});

describe('QL-370 protected dashboard interaction',()=>{
  it('holds all readback until MFA and displays safe recovery guidance',async()=>{
    const invoke=vi.fn().mockResolvedValue({data:valid,error:null});
    const gateway={functions:{invoke}} as OwnerCeremonyGateway;
    const onClear=vi.fn();
    await act(async()=>root.render(<OwnerProgressDashboard gateway={gateway} ownerRole="source"
      mfaVerified={false} intentSha256={sha} refreshSequence={0} onClearLocal={onClear}/>));
    expect(invoke).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Finish the authenticator challenge');
    expect(host.textContent).toContain('password recovery link alone cannot grant AAL2');
    expect(host.textContent).not.toContain('Verified activation audit events');
  });

  it('shows redacted server truth, zero activation and local-only recovery',async()=>{
    const invoke=vi.fn().mockResolvedValue({data:valid,error:null});
    const gateway={functions:{invoke}} as OwnerCeremonyGateway;
    const onClear=vi.fn();
    await act(async()=>root.render(<OwnerProgressDashboard gateway={gateway} ownerRole="source"
      mfaVerified={true} intentSha256={sha} refreshSequence={0} onClearLocal={onClear}/>));
    expect(invoke).toHaveBeenCalledWith('ql369-owner-enrollment',{
      body:{action:'status',intentSha256:sha}});
    expect(host.textContent).toContain('0 / 2 active');
    expect(host.textContent).toContain('Jack');
    expect(host.textContent).toContain('All six application shells remain DISCONNECTED / HOLD');
    expect(host.textContent).toContain('Not observable until the final signed packet');
    expect(host.textContent).toContain('No matching attestation');
    expect(host.textContent).not.toContain('ab'.repeat(32)); // No private digest in dashboard.
    const details=host.querySelector('details');
    expect(details).not.toBeNull();
    const clear=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('Clear this browser'));
    await act(async()=>clear?.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledTimes(1); // No activation/recovery network request.
  });

  it('does not render forged success after a server failure',async()=>{
    const invoke=vi.fn().mockResolvedValue({data:{...valid,privateTestAuthorized:true},error:null});
    const gateway={functions:{invoke}} as OwnerCeremonyGateway;
    await act(async()=>root.render(<OwnerProgressDashboard gateway={gateway} ownerRole="source"
      mfaVerified={true} intentSha256={sha} refreshSequence={0} onClearLocal={()=>{}}/>));
    expect(host.textContent).toContain('server did not confirm the progress readback');
    expect(host.textContent).not.toContain('0 / 2 active');
  });
});
