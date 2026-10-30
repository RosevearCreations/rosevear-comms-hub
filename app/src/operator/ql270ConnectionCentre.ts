/** QL-270 central integration topology. This is a UI registry, not credentials. */
export const QL270_PROOF_SNAPSHOT=[
  {source:'ai-data-platform',repo:'ai-data-platform',sha:'71c94f351366d9ab2df1e3e5ba372830c6821ddd',proof:'HTTP_404'},
  {source:'devilndove',repo:'devilndove-site',sha:'6cf92d245ec2c053d4edf49a53b13c7f3db8c123',proof:'HTTP_404'},
  {source:'rosiedazzlers',repo:'rosiedazzlers',sha:'769aa2da601a4964e8d88ffc65271b16d19f6c73',proof:'HTTP_404'},
  {source:'yw',repo:'yw',sha:'e358b4b94b6000103411b3f26c74701b19687262',proof:'HTTP_404'},
  {source:'icamp',repo:'iCamp',sha:'6dcb14f1b9e2541b900727110eccab92ab49e3a2',proof:'HTTP_404'},
  {source:'rosevear-ai-hub',repo:'rosevear-ai-hub',sha:'9d0536a54fbe3024851efa1f600d4a302d0c0d01',proof:'HTTP_404'}
] as const;
export const QL270_OBSERVED_ON='30 October 2026 Eastern';
export type Ql270SourceId=typeof QL270_PROOF_SNAPSHOT[number]['source'];
export type Ql270PublicStatus='NOT_CHECKED'|'CHECKING'|'MISSING_404'|
  'PUBLIC_FILE_PRESENT_UNVERIFIED'|'GITHUB_RATE_LIMITED_OR_FORBIDDEN'|'PUBLIC_CHECK_ERROR';

export const QL270_SOURCES=[
  {id:'rosiedazzlers',label:'Rosie Dazzlers',kind:'Business app',icon:'RD',tone:'blue',
    benefit:'Detailing inquiries, quotes, booking follow-ups and consent-aware updates.',
    scope:'Only the authorized detailing tenant; no customer data in a TEST workspace.'},
  {id:'devilndove',label:'Devil n Dove',kind:'Business app',icon:'DD',tone:'violet',
    benefit:'Customer order questions, maker commissions and draft-status handoffs.',
    scope:'Keep the Etsy shop, orders and image library outside integration test data.'},
  {id:'icamp',label:'iCamp',kind:'Business app',icon:'IC',tone:'emerald',
    benefit:'Campsite inquiries, reservation requests, events and guest service handoffs.',
    scope:'Each campground has its own tenant; Camp Rosevear may be used only after separate TEST verification.'},
  {id:'yw',label:'Yard Workers',kind:'Business app',icon:'YW',tone:'amber',
    benefit:'Property-service quotes, work order questions, appointments and client updates.',
    scope:'Each contractor is isolated; production Rosevear Landscaping is not a TEST tenant.'},
  {id:'ai-data-platform',label:'AI Data Platform',kind:'Shared service',icon:'AI',tone:'cyan',
    benefit:'Future opt-in event normalization, dashboards and cross-business trends with scoped data.',
    scope:'A reporting layer, not a fifth customer-facing business; no unrestricted data sharing.'},
  {id:'rosevear-ai-hub',label:'Rosevear AI Hub',kind:'Private edge service',icon:'RH',tone:'rose',
    benefit:'Optional local AI/automation relay and internal assistant workflows, once independently approved.',
    scope:'Private Windows relay is not installed for integration. No cameras, vault or home devices in TEST.'}
] as const satisfies ReadonlyArray<{id:Ql270SourceId;label:string;kind:string;icon:string;tone:string;benefit:string;scope:string}>;

const ids=new Set(QL270_SOURCES.map(s=>s.id));
export function ql270PublicProofUrl(source:Ql270SourceId){
  if(!ids.has(source))throw Error('UNRECOGNIZED_SOURCE');
  const row=QL270_PROOF_SNAPSHOT.find(s=>s.source===source);
  if(!row)throw Error('MISSING_PUBLIC_REPO');
  return `https://api.github.com/repos/RosevearCreations/${row.repo}/contents/docs/integration/ql246-source-proof.json?ref=main`;
}
export function ql270ClassifyPublicResponse(status:number):Ql270PublicStatus{
  if(status===200)return 'PUBLIC_FILE_PRESENT_UNVERIFIED';
  if(status===404)return 'MISSING_404';
  if(status===401||status===403||status===429)return 'GITHUB_RATE_LIMITED_OR_FORBIDDEN';
  return 'PUBLIC_CHECK_ERROR';
}
export function ql270PrepareLocalPlan(source:Ql270SourceId,alias:string){
  const valid=ids.has(source)&&/^np-[a-z0-9-]{4,32}$/.test(alias);
  return {source,tenantAliasValid:valid,profileStatus:valid?'SESSION_ONLY_DRAFT_NOT_CONNECTED':
    'INVALID_NONPRODUCTION_ALIAS',allowedMethod:'GET' as const,
    expectedEndpoints:['/api/integration/v1/health','/api/integration/v1/capabilities'],
    sevenDeniedCasesRequired:7,authenticatedSourceProofB:false,
    independentlyApprovedTenant:false,ownerTestApproved:false,
    gatewayRequestCount:0,connectionEnabled:false,
    release:'DISCONNECTED / HOLD' as const};
}
