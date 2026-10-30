/** QL-265: a local, deterministic contract exercise — NEVER a network probe. */
export const QL265_SOURCE_APPS = [
  {id:'ai-data-platform',repo:'ai-data-platform',ui:'/integration-delivery/comms-hub'},
  {id:'devilndove',repo:'devilndove-site',ui:'/admin/it-integrations/'},
  {id:'rosiedazzlers',repo:'rosiedazzlers',ui:'/admin-integrations/'},
  {id:'yw',repo:'yw',ui:'I.T. & System'},
  {id:'icamp',repo:'iCamp',ui:'/integration/comms-hub'},
  {id:'rosevear-ai-hub',repo:'rosevear-ai-hub',ui:'System → Integration Health'}
] as const;

export const QL265_DENIAL_CASES = [
  'MISSING_AUTH','WRONG_SOURCE','WRONG_TENANT','EXPIRED_REQUEST',
  'SCOPE_NOT_ALLOWED','REPLAYED_REQUEST','SPKI_NOT_PINNED'
] as const;

/** Input booleans are synthetic test-case fixtures, not actual external evidence. */
export type Ql265GuardFacts = {
  authenticated:boolean;
  correctSource:boolean;
  isolatedTenant:boolean;
  withinWindow:boolean;
  readOnlyScope:boolean;
  freshRequest:boolean;
  pinnedSource:boolean;
};
const validSynthetic:Ql265GuardFacts={
  authenticated:true, correctSource:true, isolatedTenant:true,
  withinWindow:true, readOnlyScope:true, freshRequest:true,pinnedSource:true
};

export function ql265EvaluateLocalGuard(facts:Ql265GuardFacts):boolean{
  return Object.values(facts).every(value=>value===true);
}

export function ql265RunLocalSixAppPreflight(){
  const denialKeys=Object.keys(validSynthetic) as (keyof Ql265GuardFacts)[];
  const rows=QL265_SOURCE_APPS.map(source=>{
    const healthFixture=ql265EvaluateLocalGuard({...validSynthetic});
    const capabilitiesFixture=ql265EvaluateLocalGuard({...validSynthetic});
    const denials=QL265_DENIAL_CASES.map((reason,index)=>({
      reason,
      denied:!ql265EvaluateLocalGuard({...validSynthetic,[denialKeys[index]]:false})
    }));
    return {source:source.id,repository:`RosevearCreations/${source.repo}`,
      interfacePath:source.ui,syntheticHealth:healthFixture,
      syntheticCapabilities:capabilitiesFixture,syntheticDenials:denials,
      localContractPass:healthFixture&&capabilitiesFixture&&denials.every(x=>x.denied),
      actualAuthenticatedGets:0,originalSignedProof:'NOT_VERIFIED',
      privateCustody:'NOT_VERIFIED',ownerTestApproval:'NOT_GIVEN',
      integration:'DISCONNECTED / HOLD' as const};
  });
  return {
    schema:'rosevear-comms-local-preflight/v1',
    coordinator:'RosevearCreations/rosevear-comms-hub',
    mode:'SYNTHETIC_IN_MEMORY_ONLY',
    scenarioCount:rows.length*(2+QL265_DENIAL_CASES.length),
    sourceCount:rows.length,
    localContractPass:rows.every(row=>row.localContractPass),
    networkRequests:0,actualAuthenticatedGets:0,
    externalSignerVerified:false,
    ownerTestAuthorized:false,
    livePilotHolds:12,
    remoteConnection:'DISCONNECTED / HOLD' as const,
    rows
  };
}
