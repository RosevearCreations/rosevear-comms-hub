/** QL-349 public-only GitHub discovery. Never reads private source routes, stores
 * credentials, signs requests, or marks a source connected. */
export const QL349_PUBLIC_SOURCES=[
  {id:'rosiedazzlers',label:'Rosie Dazzlers',repo:'rosiedazzlers',app:'rosiedazzlers',root:''},
  {id:'devilndove',label:'Devil n Dove',repo:'devilndove-site',app:'devilndove',root:''},
  {id:'yw',label:'Yard Workers',repo:'yw',app:'yard-workers',root:'public/'},
  {id:'icamp',label:'iCamp',repo:'iCamp',app:'icamp',root:'public/'},
  {id:'ai-data-platform',label:'AI Data Platform',repo:'ai-data-platform',app:'ai-data-platform',root:'apps/web/public/'},
  {id:'rosevear-ai-hub',label:'Rosevear AI Hub',repo:'rosevear-ai-hub',app:'rosevear-ai-hub',root:'apps/web/public/'}
] as const;

export type Ql349PublicSource=typeof QL349_PUBLIC_SOURCES[number];
export type Ql349PublicObservation={id:Ql349PublicSource['id'];label:string;
  state:'PUBLIC_MANIFEST_FOUND_TRUST_HELD'|'PUBLIC_MANIFEST_FOUND_UNPINNED_TRUST_HELD'|
    'PUBLIC_API_RATE_LIMIT_HELD'|'PUBLIC_MANIFEST_MISSING_OR_UNREACHABLE'|
    'PUBLIC_MANIFEST_INCOMPATIBLE_HELD';commitSha?:string;
  connection:'DISCONNECTED / HOLD';checkedAt:string};

const SHA=/^[a-f0-9]{40}$/;
const safeResponse=(r:Response,url:string)=>r.ok&&!r.redirected&&(!r.url||r.url===url);
const compatible=(m:Record<string,unknown>,source:Ql349PublicSource)=>
  m.schema==='rosevear.integration.discovery.v1'&&
  typeof m.manifest_version==='string'&&/^1\.\d+\.\d+$/.test(m.manifest_version)&&
  m.source_id===source.id&&m.source_app_id===source.app&&
  m.repository===`RosevearCreations/${source.repo}`&&
  m.connection_state==='DISCONNECTED / HOLD'&&
  m.requested_scope==='public_nonsecret_discovery_only'&&
  m.failure_behavior==='HOLD_AND_QUARANTINE'&&
  (m.transport as Record<string,unknown>)?.origin===null&&
  (m.transport as Record<string,unknown>)?.redirects==='DENY'&&
  (m.signature as Record<string,unknown>)?.algorithm==='Ed25519';

async function inspectRaw(source:Ql349PublicSource,revision:string,fetcher:typeof fetch){
  const url=`https://raw.githubusercontent.com/RosevearCreations/${source.repo}/${revision}/${source.root}.well-known/rosevear-integration-manifest.json`;
  const response=await fetcher(url,{method:'GET',redirect:'error',cache:'no-store',
    signal:AbortSignal.timeout(4000),headers:{Accept:'application/json'}});
  if(!safeResponse(response,url))return 'missing' as const;
  const length=Number(response.headers.get('content-length'));
  if(Number.isFinite(length)&&length>8192)return 'incompatible' as const;
  const body=await response.text();
  if(body.length>8192)return 'incompatible' as const;
  try{return compatible(JSON.parse(body) as Record<string,unknown>,source)?'valid' as const:'incompatible' as const;}
  catch{return 'incompatible' as const;}
}

export async function refreshOnePublicSource(source:Ql349PublicSource,
  fetcher:typeof fetch=fetch,now=()=>Date.now()):Promise<Ql349PublicObservation>{
  const held=(state:Ql349PublicObservation['state'],commitSha?:string):Ql349PublicObservation=>({
    id:source.id,label:source.label,state,commitSha,connection:'DISCONNECTED / HOLD',
    checkedAt:new Date(now()).toISOString()});
  const commitUrl=`https://api.github.com/repos/RosevearCreations/${source.repo}/commits/main`;
  try{
    const commitResponse=await fetcher(commitUrl,{method:'GET',redirect:'error',cache:'no-store',
      signal:AbortSignal.timeout(4000),
      headers:{Accept:'application/vnd.github+json'}});
    // GitHub's shared unauthenticated API quota can expire even while public
    // raw manifests are available. A fallback proves PUBLIC PRESENCE ONLY:
    // it is explicitly unpinned and never accepted as signed-source evidence.
    if(commitResponse.status===403||commitResponse.status===429){
      try{
        const result=await inspectRaw(source,'main',fetcher);
        return held(result==='valid'?'PUBLIC_MANIFEST_FOUND_UNPINNED_TRUST_HELD':
          result==='incompatible'?'PUBLIC_MANIFEST_INCOMPATIBLE_HELD':'PUBLIC_API_RATE_LIMIT_HELD');
      }catch{return held('PUBLIC_API_RATE_LIMIT_HELD');}
    }
    if(!safeResponse(commitResponse,commitUrl))return held('PUBLIC_MANIFEST_MISSING_OR_UNREACHABLE');
    const commit=await commitResponse.json() as {sha?:unknown};
    if(typeof commit.sha!=='string'||!SHA.test(commit.sha))
      return held('PUBLIC_MANIFEST_INCOMPATIBLE_HELD');
    const result=await inspectRaw(source,commit.sha,fetcher);
    if(result==='missing')return held('PUBLIC_MANIFEST_MISSING_OR_UNREACHABLE',commit.sha);
    if(result==='incompatible')return held('PUBLIC_MANIFEST_INCOMPATIBLE_HELD',commit.sha);
    // A source-owned published manifest is not an independently trusted signed receipt.
    return held('PUBLIC_MANIFEST_FOUND_TRUST_HELD',commit.sha);
  }catch{return held('PUBLIC_MANIFEST_MISSING_OR_UNREACHABLE');}
}

/** Sequential by design: avoids a six-app GET burst and leaves private peers untouched. */
export async function refreshSixPublicSources(fetcher:typeof fetch=fetch,
  now=()=>Date.now()):Promise<Ql349PublicObservation[]>{
  const result:Ql349PublicObservation[]=[];
  for(const source of QL349_PUBLIC_SOURCES)
    result.push(await refreshOnePublicSource(source,fetcher,now));
  return result;
}
