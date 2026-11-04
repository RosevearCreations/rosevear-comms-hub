/** QL-333 private Node-only contract discovery. NEVER import into Vite/browser code. */
import {createHash, createPublicKey, verify} from 'node:crypto';

export const MANIFEST_PATH='/.well-known/rosevear-integration-manifest.json';
export const LEGACY_PATHS=Object.freeze(['/api/integration/v1/health','/api/integration/v1/capabilities']);
export const SOURCES=Object.freeze({
  yw:{app:'yard-workers',role:'business_shell',boundary:'platform_shell',repo:'yw'},
  icamp:{app:'icamp',role:'business_shell',boundary:'platform_shell',repo:'iCamp'},
  rosiedazzlers:{app:'rosiedazzlers',role:'business_shell',boundary:'owned_business_legacy',repo:'rosiedazzlers'},
  devilndove:{app:'devilndove',role:'business_shell',boundary:'owned_business_legacy',repo:'devilndove-site'},
  'ai-data-platform':{app:'ai-data-platform',role:'support_broker',boundary:'no_customer_tenant',repo:'ai-data-platform'},
  'rosevear-ai-hub':{app:'rosevear-ai-hub',role:'local_support',boundary:'no_customer_tenant',repo:'rosevear-ai-hub'}
});
const KEYS=['schema','manifest_version','source_id','source_app_id','source_role','repository','source_revision','issuer','audience','tenant_boundary','legacy_integration_v1','transport','requested_scope','failure_behavior','signature','connection_state'];
const nested={legacy_integration_v1:['app_id','method','allowed_paths','authorization'],transport:['origin','manifest_path','redirects'],signature:['algorithm','key_id','value','state']};
const matchesKeys=(object,keys)=>object && typeof object==='object' && !Array.isArray(object) &&
  Object.keys(object).length===keys.length && Object.keys(object).every(key=>keys.includes(key));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function canonicalize(value){
  if(Array.isArray(value)) return '['+value.map(canonicalize).join(',')+']';
  if(value && typeof value==='object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalize(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export function payloadForSigning(m){const {signature,...payload}=m;return Buffer.from(canonicalize(payload),'utf8');}

/** A manifest is descriptive only. An independently pinned issuer is required for VERIFIED. */
export function inspectManifest(m,pin={}){
  const hold=(code)=>({status:code,verified:false,connected:false,authorized:false});
  if(!matchesKeys(m,KEYS)||Object.entries(nested).some(([k,v])=>!matchesKeys(m[k],v))) return hold('DENY_SCHEMA_OR_PRIVILEGED_FIELD');
  const s=SOURCES[m.source_id];
  if(!s||m.source_app_id!==s.app||m.source_role!==s.role||
    m.repository!==`RosevearCreations/${s.repo}`||m.issuer!==s.app||
    m.tenant_boundary!==s.boundary||m.audience!=='rosevear-master') return hold('DENY_SOURCE_IDENTITY');
  if(m.schema!=='rosevear.integration.discovery.v1'||!/^1\.[0-9]+\.[0-9]+$/.test(m.manifest_version)) return hold('DENY_MAJOR_VERSION');
  if(!/^ql333-discovery-v1$|^[a-f0-9]{40}$/.test(m.source_revision)) return hold('DENY_SOURCE_REVISION');
  if(m.legacy_integration_v1.app_id!==s.app||m.legacy_integration_v1.method!=='GET'||
    !same(m.legacy_integration_v1.allowed_paths,LEGACY_PATHS)||
    m.legacy_integration_v1.authorization!=='source_owned_required') return hold('DENY_LEGACY_COMPATIBILITY');
  if(m.requested_scope!=='public_nonsecret_discovery_only'||m.failure_behavior!=='HOLD_AND_QUARANTINE'||
    m.connection_state!=='DISCONNECTED / HOLD') return hold('DENY_PRIVILEGE_ESCALATION');
  if(m.transport.origin!==null||m.transport.manifest_path!==MANIFEST_PATH||m.transport.redirects!=='DENY')
    return hold('DENY_UNPINNED_ORIGIN');
  if(m.signature.algorithm!=='Ed25519') return hold('DENY_SIGNATURE_ALGORITHM');
  if(m.signature.state==='AWAITING_INDEPENDENT_SOURCE_SIGNER' &&
    m.signature.key_id===null && m.signature.value===null) return hold('DISCOVERED_UNSIGNED_HELD');
  if(m.signature.state!=='SIGNED'||typeof m.signature.key_id!=='string'||
    typeof m.signature.value!=='string'||!/^[-_A-Za-z0-9]{15,120}$/.test(m.signature.key_id))
    return hold('DENY_SIGNATURE_ENVELOPE');
  if(pin.sourceId!==m.source_id||pin.issuer!==m.issuer||pin.keyId!==m.signature.key_id||
    !pin.independentlyVerified||!pin.approvedSourceOwner||!pin.originalProofB||!pin.publicKeyPem)
    return hold('NO_INDEPENDENT_TRUST_PIN_HELD');
  try {
    const publicKey=createPublicKey(pin.publicKeyPem);
    if(publicKey.asymmetricKeyType!=='ed25519'||
      !verify(null,payloadForSigning(m),publicKey,Buffer.from(m.signature.value,'base64url')))
      return hold('DENY_INVALID_SIGNATURE');
  }catch{return hold('DENY_INVALID_SIGNATURE');}
  // Cryptographic manifest verification is not a source-side permission grant.
  return {status:'SIGNED_MANIFEST_VERIFIED_SOURCE_GRANT_HELD',verified:true,connected:false,authorized:false};
}

/** Only GitHub's immutable public object URL may be used before trusted source origin enrollment. */
export function sourceManifestUrl(sourceId,commitSha){
  const source=SOURCES[sourceId];
  if(!source||!(/^[a-f0-9]{40}$/.test(commitSha))) throw new Error('DENY_UNPINNED_SOURCE_OR_REVISION');
  const root=sourceId==='yw'?'public/':sourceId==='icamp'?'public/':sourceId==='rosiedazzlers'?'':
    sourceId==='devilndove'?'':sourceId==='ai-data-platform'?'apps/web/public/':'apps/web/public/';
  return `https://raw.githubusercontent.com/RosevearCreations/${source.repo}/${commitSha}/${root}.well-known/rosevear-integration-manifest.json`;
}

export async function discoverSource(sourceId,commitSha,fetcher=globalThis.fetch,{timeoutMs=4500,maxBytes=8192}={}){
  const url=sourceManifestUrl(sourceId,commitSha);
  let response;
  try {response=await fetcher(url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(timeoutMs),headers:{Accept:'application/json'}});}
  catch{return {status:'SOURCE_UNREACHABLE_HELD',connected:false};}
  if(response.status!==200) return {status:response.status>=300&&response.status<400?'DENY_REDIRECT':
    [404,409,429].includes(response.status)?`SOURCE_HTTP_${response.status}_HELD`:'SOURCE_HTTP_FAILURE_HELD',connected:false};
  if(response.url && response.url!==url)return {status:'DENY_REDIRECT',connected:false};
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>maxBytes) return {status:'DENY_OVERSIZE_MANIFEST',connected:false};
  try{
    const manifest=JSON.parse(bytes.toString('utf8'));
    if(manifest.source_id!==sourceId) return {status:'DENY_SOURCE_IDENTITY',connected:false};
    return {...inspectManifest(manifest),sourceId,commitSha,manifestSha256:sha256(bytes),schemaVersion:manifest.manifest_version};
  }catch{return {status:'DENY_UNPARSABLE_MANIFEST',connected:false};}
}

export function compareManifest(oldManifest,newManifest){
  const a=inspectManifest(oldManifest),b=inspectManifest(newManifest);
  if(a.status.startsWith('DENY')||b.status.startsWith('DENY')) return {status:'INCOMPATIBLE_REVIEW_REQUIRED_HELD'};
  if(oldManifest.source_id!==newManifest.source_id||oldManifest.issuer!==newManifest.issuer||
    oldManifest.manifest_version.split('.')[0]!==newManifest.manifest_version.split('.')[0])
    return {status:'INCOMPATIBLE_REVIEW_REQUIRED_HELD'};
  return {status:same(oldManifest,newManifest)?'NO_DRIFT_HELD':'COMPATIBLE_PROPOSAL_REVIEW_REQUIRED_HELD'};
}
