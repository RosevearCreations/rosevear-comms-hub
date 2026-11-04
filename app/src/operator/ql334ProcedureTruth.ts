import {QL331_PUBLIC_SOURCES} from './ql331MasterAccess';

/** Independently observed public source SHA pins (2026-11-04). These are not private grants. */
export const QL334_PUBLIC_READBACK={
  observedDate:'2026-11-04',observedSourceManifests:6,
  procedureTemplates:18,privateSchedulesEnabled:0,verifiedWorkloads:0,
  sourceOwnerAuthorizations:0,independentPeerIssuers:0,activePrivateConnections:0,
  privateJobsQueued:0,ownerApprovals:0,communicationsEnabled:false,
  windowsRelay:'OFF',status:'PUBLIC DISCOVERY / PRIVATE AUTHORITY HOLD'
} as const;

const githubPath:Record<string,string>={
  yw:'yw/blob/main/public',icamp:'iCamp/blob/main/public',
  rosiedazzlers:'rosiedazzlers/blob/main',devilndove:'devilndove-site/blob/main',
  'ai-data-platform':'ai-data-platform/blob/main/apps/web/public',
  'rosevear-ai-hub':'rosevear-ai-hub/blob/main/apps/web/public'
};
const verifiedApplicationLinks:Record<string,string|null>={
  yw:'https://yw-alpha.vercel.app/',icamp:'https://i-camp-pi.vercel.app/',
  rosiedazzlers:null,devilndove:null,
  'ai-data-platform':'https://ai-data-platform-beryl.vercel.app/',
  'rosevear-ai-hub':null
};
const sourceAdminPath:Record<string,string|null>={
  yw:null,icamp:'/integration/comms-hub',rosiedazzlers:'/admin-integrations/',
  devilndove:'/admin/it-integrations/','ai-data-platform':'/app-connections',
  'rosevear-ai-hub':null
};

export const QL334_CONNECTIONS=QL331_PUBLIC_SOURCES.map(s=>({
  id:s.id,name:s.name,sourceIssuer:s.sourceAppId,kind:s.kind,
  description:s.kind==='business'?s.id==='icamp'?'Multi-campground shell (not Camp Rosevear)'
    :s.id==='yw'?'Multi-company shell (not Rosevear Landscaping)'
    :'Owned business; multi-business tenant conversion pending'
    :s.id==='ai-data-platform'?'Integration broker; no customer child tenant'
    :'Private Windows hub; relay remains offline',
  manifestUrl:`https://github.com/RosevearCreations/${githubPath[s.id]}/.well-known/rosevear-integration-manifest.json`,
  appUrl:verifiedApplicationLinks[s.id],
  integrationUrl:verifiedApplicationLinks[s.id]&&sourceAdminPath[s.id]
    ?verifiedApplicationLinks[s.id]+sourceAdminPath[s.id]!.slice(1):null,
  publicStatus:'Manifest digest observed',privateStatus:'DISCONNECTED / HOLD'
}));

export const QL334_STAGES=[
  {id:'DISCOVER',label:'Discover source',detail:'Public manifest digest observed for all six',state:'OBSERVED'},
  {id:'VERIFY_SOURCE',label:'Verify original issuer',detail:'Independent source Proof-B and signer required',state:'HOLD'},
  {id:'VERIFY_OWNER',label:'Verify owner and source TEST consent',detail:'No owner-enrolled private approval yet',state:'HOLD'},
  {id:'RESOLVE_VAULT_HANDLE',label:'Resolve managed key handle',detail:'No verified broker workload or signer',state:'HOLD'},
  {id:'READONLY_TEST',label:'Signed read-only GET',detail:'Blocked until exact source-owned scope is approved',state:'HOLD'},
  {id:'VERIFY_RECEIPT',label:'Reconcile signed receipt',detail:'Both ends must authenticate and match nonce',state:'HOLD'},
  {id:'MONITOR',label:'Monitor and recover',detail:'Bounded retry, breaker and evidence after authorization',state:'HOLD'}
] as const;
