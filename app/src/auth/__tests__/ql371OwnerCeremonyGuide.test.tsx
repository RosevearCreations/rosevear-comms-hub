// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {OwnerCeremonyGuide} from '../OwnerCeremonyGuide';
import {OwnerProgressDashboard} from '../OwnerProgressDashboard';
import {SAFE_OWNER_HANDOFF} from '../ql371OwnerCeremony';
import type {OwnerProgress} from '../ql370OwnerProgress';
import type {OwnerCeremonyGateway} from '../ql369OwnerEnrollment';

const NOW=Date.parse('2026-11-08T16:00:00Z');
const sha='ab'.repeat(32);
const stamp=(minutes:number)=>new Date(NOW+minutes*60000).toISOString();
const snapshot=():OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'CURRENT',expiresAt:stamp(9)},
  peerAttestation:{state:'CURRENT',expiresAt:stamp(4)},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  heldApplicationShells:6,totalApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,snapshotAt:stamp(0)
});
let host:HTMLDivElement;
let root:Root;
let dateSpy:ReturnType<typeof vi.spyOn>;
beforeEach(()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  dateSpy=vi.spyOn(Date,'now').mockReturnValue(NOW);
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{
  await act(async()=>root.unmount());host.remove();
  dateSpy.mockRestore();
  vi.restoreAllMocks();
});

describe('QL-371 accessible, read-only handoff',()=>{
  it('shows numbered, labelled checkpoints without pretending offline signing happened',async()=>{
    await act(async()=>root.render(<OwnerCeremonyGuide progress={snapshot()}
      mfaVerified={true} intentSupplied={true} ownerRole="source"/>));
    const items=host.querySelectorAll('ol.ql371-steps > li');
    expect(items.length).toBe(7);
    expect(items[0]?.textContent).toContain('Original-device review');
    expect(items[1]?.textContent).toContain('Original-device review');
    expect(host.textContent).toContain('Attestation needs prompt review');
    expect(host.textContent).toContain('About 4 minutes');
    expect(host.textContent).toContain('All six applications remain DISCONNECTED / HOLD');
    expect(host.querySelectorAll('[aria-current="step"]').length).toBe(1);
    expect(host.textContent).not.toContain(sha);
  });

  it('cannot display server-verification while only signed in with AAL1',async()=>{
    await act(async()=>root.render(<OwnerCeremonyGuide progress={null}
      mfaVerified={false} intentSupplied={false} ownerRole="master"/>));
    expect(host.textContent).toContain('Each person needs their own Supabase Auth sign-in');
    expect(host.textContent).toContain('Confirm Ree independently attested');
    expect(host.textContent).toContain('0 of 7 checkpoints server verified');
    expect(host.textContent).not.toContain('AAL2 session was recently confirmed');
  });

  it('copies only generic note with no user data, tokens, or activation request',async()=>{
    const writeText=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText}});
    await act(async()=>root.render(<OwnerCeremonyGuide progress={snapshot()}
      mfaVerified={true} intentSupplied={true} ownerRole="source"/>));
    const area=host.querySelector('#ql371-safe-handoff') as HTMLTextAreaElement;
    expect(area.readOnly).toBe(true);
    expect(area.value).toBe(SAFE_OWNER_HANDOFF);
    expect(area.value).not.toContain(sha);
    const button=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('Copy safe handoff instructions'))!;
    await act(async()=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    expect(writeText).toHaveBeenCalledExactlyOnceWith(SAFE_OWNER_HANDOFF);
    expect(host.textContent).toContain('No owner evidence or credentials were included');
  });

  it('integrates with QL-370 without extra Edge calls or enabling a private TEST',async()=>{
    const invoke=vi.fn().mockResolvedValue({data:snapshot(),error:null});
    const gateway={functions:{invoke}} as OwnerCeremonyGateway;
    await act(async()=>root.render(<OwnerProgressDashboard gateway={gateway}
      ownerRole="source" mfaVerified={true} intentSha256={sha}
      refreshSequence={0} onClearLocal={()=>{}}/>));
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('ql369-owner-enrollment',{
      body:{action:'status',intentSha256:sha}});
    expect(host.textContent).toContain('Step-by-step enrollment checklist');
    expect(host.textContent).toContain('Current at last server check');
    expect(host.textContent).toContain('Only Ree explicitly submits');
    expect(host.textContent).toContain('DISCONNECTED / HOLD');
  });
});
