import {describe,expect,it} from 'vitest';
import {
  WALKTHROUGH_STEP_IDS,clearAllOwnerHelpPositions,clearHelpPosition,
  mayOfferWalkthroughResume,readHelpPosition,saveHelpPosition,walkthroughStepGuidance
} from '../ql372OwnerResume';
import type {OwnerProgress} from '../ql370OwnerProgress';

const now=Date.parse('2026-11-08T17:00:00Z');
const progress=():OwnerProgress=>({
  state:'ORIGINAL_OWNER_PROGRESS_READ_ONLY',organizationId:'rosevear-creations',
  ownerRole:'source',sessionAal2Verified:true,ownerMembershipActive:false,
  organizationEnrollmentState:'PENDING_VERIFIED_AUTH_USERS',activeOwnerMemberships:0,
  ownAttestation:{state:'NOT_RECORDED',expiresAt:null},
  peerAttestation:{state:'NOT_RECORDED',expiresAt:null},
  offlineApprovalState:'NOT_OBSERVABLE_UNTIL_FINAL_SIGNED_SUBMISSION',
  audit:{activationRecorded:false,activationAt:null,verifiedActivationEvents:0,lastVerifiedEventAt:null},
  heldApplicationShells:6,totalApplicationShells:6,
  connectionsState:'DISCONNECTED / HOLD',privateTestAuthorized:false,
  snapshotAt:new Date(now).toISOString()
});
const fakeStorage=()=>{
  const values=new Map<string,string>();
  return {
    getItem:(k:string)=>values.get(k)??null,
    setItem:(k:string,v:string)=>{values.set(k,v);},
    removeItem:(k:string)=>{values.delete(k);},
    values
  };
};

describe('QL-372 secure, non-authorizing help-position resume',()=>{
  it('stores exactly a versioned step ID, never intent, owner identity or server status',()=>{
    const s=fakeStorage();
    expect(saveHelpPosition('source','peer',s)).toBe(true);
    expect([...s.values.values()]).toEqual(['v1:peer']);
    expect(readHelpPosition('source',s)).toBe('peer');
    expect(readHelpPosition('master',s)).toBe(null);
    expect([...s.values.keys()][0]).toBe('rosevear-comms-hub:ql372:help-position:source');
    clearHelpPosition('source',s);
    expect(readHelpPosition('source',s)).toBe(null);
  });

  it('rejects untrusted stored values and never uses them as instructions',()=>{
    const s=fakeStorage();
    s.setItem('rosevear-comms-hub:ql372:help-position:source','v1:activate:force=true');
    expect(readHelpPosition('source',s)).toBe(null);
    s.setItem('rosevear-comms-hub:ql372:help-position:source','v1:../ql369');
    expect(readHelpPosition('source',s)).toBe(null);
    s.setItem('rosevear-comms-hub:ql372:help-position:source','v2:peer');
    expect(readHelpPosition('source',s)).toBe(null);
    expect(WALKTHROUGH_STEP_IDS).toHaveLength(7);
  });

  it('requires a fresh owner-matched server AAL2 readback and six held shells',()=>{
    const p=progress();
    expect(mayOfferWalkthroughResume(p,true,'source',now)).toBe(true);
    expect(mayOfferWalkthroughResume(p,false,'source',now)).toBe(false);
    expect(mayOfferWalkthroughResume(null,true,'source',now)).toBe(false);
    expect(mayOfferWalkthroughResume({...p,sessionAal2Verified:false} as unknown as OwnerProgress,true,'source',now)).toBe(false);
    expect(mayOfferWalkthroughResume(p,true,'master',now)).toBe(false);
    expect(mayOfferWalkthroughResume(p,true,'source',now+121000)).toBe(false);
    expect(mayOfferWalkthroughResume(p,true,'source',now-121000)).toBe(false);
    expect(mayOfferWalkthroughResume({...p,heldApplicationShells:5},true,'source',now)).toBe(false);
    expect(mayOfferWalkthroughResume({...p,privateTestAuthorized:true} as unknown as OwnerProgress,true,'source',now)).toBe(false);
    expect(mayOfferWalkthroughResume({...p,connectionsState:'CONNECTED' as OwnerProgress['connectionsState']},true,'source',now)).toBe(false);
  });

  it('clears both original-owner positions on sign-out and survives denied storage access',()=>{
    const s=fakeStorage();
    saveHelpPosition('source','self',s);
    saveHelpPosition('master','peer',s);
    clearAllOwnerHelpPositions(s);
    expect(s.values.size).toBe(0);
    const denied={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');},removeItem:()=>{throw Error('blocked');}};
    expect(readHelpPosition('source',denied)).toBe(null);
    expect(saveHelpPosition('source','self',denied)).toBe(false);
    expect(()=>clearAllOwnerHelpPositions(denied)).not.toThrow();
  });

  it('never allows Jack to submit Ree’s final activation in guidance',()=>{
    const step={id:'activate',title:'Owner action',status:'pending' as const,details:''};
    expect(walkthroughStepGuidance('master',step)).toContain('Only Ree can submit');
    expect(walkthroughStepGuidance('source',step)).toContain('Ree only');
    expect(walkthroughStepGuidance('master',step)).not.toContain('submit the original signed activation packet. Navigation');
  });
});
