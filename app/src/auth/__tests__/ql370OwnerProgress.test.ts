import {describe,expect,it,vi} from 'vitest';
import {readOwnerProgress,QL369_FUNCTION,type OwnerCeremonyGateway}
  from '../ql369OwnerEnrollment';
import {ownerProgressGuidance,parseOwnerProgress,type OwnerProgress}
  from '../ql370OwnerProgress';

const intent='ab'.repeat(32);
const snapshot:OwnerProgress={
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'CURRENT',expiresAt:'2026-11-08T15:00:00+00:00'},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,
    lastVerifiedEventAt:null},
  heldApplicationShells:6,totalApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,
  snapshotAt:'2026-11-08T14:45:00+00:00'
};
const gateway=(data:unknown,error:unknown=null):OwnerCeremonyGateway=>({
  functions:{invoke:vi.fn().mockResolvedValue({data,error})}
});

describe('QL-370 original-owner redacted progress',()=>{
  it('accepts only exact server-authenticated AAL2 owner readbacks',()=>{
    expect(parseOwnerProgress(snapshot,'source')).toEqual(snapshot);
    expect(parseOwnerProgress(snapshot,'master')).toBeNull();
    for(const bad of [
      {...snapshot,ownerRole:'unknown'},
      {...snapshot,sessionAal2Verified:false},
      {...snapshot,organizationId:'another-tenant'},
      {...snapshot,privateTestAuthorized:true},
      {...snapshot,activeOwnerMemberships:3},
      {...snapshot,heldApplicationShells:7},
      {...snapshot,masterEmail:'peer@example.test'},
      {...snapshot,audit:{...snapshot.audit,secret:'bearer token'}},
      {...snapshot,ownAttestation:{state:'CURRENT',expiresAt:null}},
      {...snapshot,peerAttestation:{state:'REVOKED',expiresAt:null}},
      {...snapshot,snapshotAt:'yesterday'},
      {...snapshot,connectionsState:'CONNECTED'}
    ])expect(parseOwnerProgress(bad,'source')).toBeNull();
  });

  it('makes no request for malformed digest and uses only the reviewed Edge endpoint',async()=>{
    const client=gateway(snapshot);
    expect((await readOwnerProgress(client,'source','bad')).ok).toBe(false);
    expect((await readOwnerProgress(client,'source','0'.repeat(64))).ok).toBe(false);
    expect(client.functions.invoke).not.toHaveBeenCalled();
    const result=await readOwnerProgress(client,'source',intent);
    expect(result).toEqual({ok:true,progress:snapshot});
    expect(client.functions.invoke).toHaveBeenCalledWith(QL369_FUNCTION,
      {body:{action:'status',intentSha256:intent}});
    await readOwnerProgress(client,'source');
    expect(client.functions.invoke).toHaveBeenCalledWith(QL369_FUNCTION,
      {body:{action:'status'}});
  });

  it('never displays false success from API errors, wrong role, or malformed data',async()=>{
    expect((await readOwnerProgress(gateway(null,{message:'offline'}),'source')).ok).toBe(false);
    expect((await readOwnerProgress(gateway(snapshot),'master')).progress).toBeNull();
    const bad=gateway({...snapshot,sourceConnectionsAllowed:true});
    expect((await readOwnerProgress(bad,'source')).ok).toBe(false);
    const offline={functions:{invoke:vi.fn().mockRejectedValue(Error('network'))}};
    expect((await readOwnerProgress(offline,'source')).ok).toBe(false);
  });

  it('provides useful recovery without equating attestation with original signing',()=>{
    expect(ownerProgressGuidance(snapshot,true).heading).toMatch(/Waiting/);
    expect(ownerProgressGuidance(snapshot,false).heading).toMatch(/original intent/);
    expect(ownerProgressGuidance({...snapshot,ownAttestation:{
      state:'EXPIRED',expiresAt:'2026-11-08T13:00:00Z'}},true).heading).toMatch(/Renew/);
    const both={...snapshot,peerAttestation:{
      state:'CURRENT' as const,expiresAt:'2026-11-08T15:00:00Z'}};
    expect(ownerProgressGuidance(both,true).message).toMatch(/offline signing/);
    const drift={...snapshot,heldApplicationShells:5,connectionsState:
      'HOLD_STATE_DRIFT_REQUIRES_REVIEW' as const};
    expect(ownerProgressGuidance(drift,true).heading).toMatch(/HOLD/);
    const partial={...snapshot,activeOwnerMemberships:1};
    expect(ownerProgressGuidance(partial,true).heading).toMatch(/review/);
  });

  it('marks genuine one-time recorded completion without enabling source transport',()=>{
    const active:OwnerProgress={...snapshot,ownerMembershipActive:true,
      organizationEnrollmentState:'VERIFIED',activeOwnerMemberships:2,
      offlineApprovalState:'VERIFIED_AT_ORIGINAL_ACTIVATION',
      audit:{activationRecorded:true,activationAt:'2026-11-08T14:40:00Z',
        verifiedActivationEvents:1,lastVerifiedEventAt:'2026-11-08T14:40:00Z'}};
    expect(parseOwnerProgress(active,'source')).not.toBeNull();
    expect(ownerProgressGuidance(active,true).message).toMatch(/does not approve private TEST/);
    expect(active.connectionsState).toBe('DISCONNECTED / HOLD');
  });
});
