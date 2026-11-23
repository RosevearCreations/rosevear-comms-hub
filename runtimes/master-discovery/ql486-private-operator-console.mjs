/**
 * QL-486 protected owner-operated operator compatibility console.
 * GET-only, mutually authenticated TLS, per-source operator allowlist,
 * loopback-host opt-in; no browser scripts or source-side commands.
 */
import {createServer} from 'node:https';
import {QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';

export const QL486_CONSOLE_PATH='/internal/comms/ql486/operator/contracts';
export const QL486_CONSOLE_JSON_PATH='/internal/comms/ql486/operator/contracts.json';
const FP=/^[a-f0-9]{64}$/,NAME=/^[a-z][a-z0-9_-]{2,63}$/;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>own(o,k));
const hold=(reason,status=403)=>({ok:false,status,body:{state:'HOLD',reason,
 originalHostVerified:false,sourceAuthorized:false}});
const normalFp=f=>typeof f==='string'?f.replaceAll(':','').toLowerCase():'';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x)?x.slice(0,12):'—';
const COLUMNS=['Source','Contract','Approved','Observed','Status','Evidence','Original runtime'];
const style='body{margin:0;background:#0c1222;color:#f4f1ff;font:15px system-ui,sans-serif}main{max-width:1280px;margin:0 auto;padding:28px}h1{font-size:1.65rem}p{color:#c2c7d7;line-height:1.6}.tag{color:#ffc472;font-weight:700}table{width:100%;border-collapse:collapse;min-width:920px}th,td{padding:13px;text-align:left;border-bottom:1px solid #33415e;vertical-align:top}th{font-size:.84rem;color:#b7c3e5}td small{color:#a9b3cc}code{font-size:.88em}div.scroll{overflow-x:auto;border:1px solid #34415c;border-radius:12px}footer{margin-top:22px}';
function html(report,operatorId,nowMs){
 const sources=report.sources;
 const header=COLUMNS.map(h=>'<th scope="col">'+esc(h)+'</th>').join('');
 const body=Object.keys(sources).sort().map(id=>{
  const e=sources[id],status=e.state??'HOLD';
  return '<tr><th scope="row">'+esc(id)+'</th>'+
   '<td>'+esc(e.contractVersion??'—')+'</td>'+
   '<td><code>'+esc(short(e.approvedRevision))+'</code></td>'+
   '<td><code>'+esc(short(e.sourceRevision))+'</code></td>'+
   '<td><strong>'+esc(status)+'</strong></td>'+
   '<td><code>'+esc(e.evidenceDigest?.slice(0,12)??'—')+'</code></td>'+
   '<td>HOLD — signed metadata does not prove original runtime</td></tr>';
 }).join('');
 return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Rosevear Comms Hub | Private Contract Compatibility</title>'+
  '<style>'+style+'</style></head><body><main>'+
  '<p class="tag">PRIVATE • mTLS • READ ONLY • SOURCE FIELD ACCEPTANCE HOLD</p>'+
  '<h1>Six-application contract compatibility</h1>'+
  '<p>Operator: '+esc(operatorId)+'. Reviewed: '+esc(new Date(nowMs).toISOString())+
  '. This local view displays independently pinned signed claims, never automatic source approval or physical field certification.</p>'+
  '<div class="scroll"><table><thead><tr>'+header+
  '</tr></thead><tbody>'+body+'</tbody></table></div>'+
  '<footer><p>Registry digest: <code>'+esc(report.registryDigest)+
  '</code>. Source runtime verification: 0/6 independently established by this console. No source actions, customer records, secrets or network dispatch.</p></footer>'+
  '</main></body></html>';
}
/** Inputs derived from verified TLS certificate, never user-supplied headers. */
export function createQl486PrivateOperatorRead({registry,acl,now=()=>Date.now()}={}){
 if(typeof registry?.summary!=='function'||!acl||
   typeof acl!=='object'||Array.isArray(acl)||!Object.keys(acl).length)
  throw Error('QL486_REGISTRY_AND_OPERATOR_CERTIFICATE_ALLOWLIST_REQUIRED');
 const permissions=new Map();
 for(const [fingerprint,value] of Object.entries(acl)){
  if(!FP.test(fingerprint)||!exact(value,['operatorId','role','sources'])||
   !NAME.test(value.operatorId??'')||value.role!=='contract-reviewer'||
   !Array.isArray(value.sources)||value.sources.length===0||
   value.sources.some(x=>!QL485_SOURCE_IDS.includes(x))||
   new Set(value.sources).size!==value.sources.length)
   throw Error('QL486_EXACT_SCOPED_OPERATOR_CERTIFICATE_ROLE_REQUIRED');
  permissions.set(fingerprint,{operatorId:value.operatorId,
   sources:new Set(value.sources)});
 }
 function read({authorized=false,certificateFingerprint256,format='json'}={}){
  const entry=authorized===true&&permissions.get(normalFp(certificateFingerprint256));
  if(!entry)return hold('QL486_MUTUAL_TLS_OPERATOR_CERT_REQUIRED',401);
  if(!['html','json'].includes(format))return hold('QL486_FORMAT_NOT_ALLOWED',400);
  let report;
  try{report=registry.summary()}catch{return hold('QL486_PRIVATE_REGISTRY_UNAVAILABLE',503)}
  if(report?.state!=='PRIVATE_OPERATOR_REGISTRY_READ_ONLY_HELD'||
    report.sourceCount!==6||!report.sources||
    QL485_SOURCE_IDS.some(id=>!own(report.sources,id)))
   return hold('QL486_PRIVATE_REGISTRY_CUSTODY_UNVERIFIED',503);
  const scoped=Object.fromEntries(QL485_SOURCE_IDS.filter(id=>entry.sources.has(id))
   .map(id=>[id,report.sources[id]]));
  const filtered={state:report.state,sources:scoped,
    visibleSources:Object.keys(scoped).length,
    sourceCount:6,registryDigest:report.registryDigest,
    fieldAcceptance:'HOLD_ORIGINAL_SOURCE_ATTESTATION_INDEPENDENT_REVIEW_REQUIRED',
    originalSourceCountVerified:0,productionAcceptance:false,
    customerDelivery:false,automaticSourcePromotion:false};
  return {ok:true,status:200,contentType:format==='html'?
    'text/html; charset=utf-8':'application/json; charset=utf-8',
    body:format==='html'?html(filtered,entry.operatorId,now()):
     {...filtered,operatorId:entry.operatorId}};
 }
 return Object.freeze({read,mode:'PRIVATE_MUTUAL_TLS_READ_ONLY_COMPATIBILITY_CONSOLE',
  publicRoute:false,customerWrites:false,automaticDispatch:false});
}
/** Does not listen until owner explicitly invokes server.listen(). */
export function createQl486PrivateOperatorHttpsServer({tlsOptions,reader}={}){
 if(!tlsOptions?.key||!tlsOptions?.cert||!tlsOptions?.ca||
   typeof reader?.read!=='function')
  throw Error('QL486_PRIVATE_TLS_CA_AND_OPERATOR_READER_REQUIRED');
 return createServer({...tlsOptions,requestCert:true,rejectUnauthorized:true,
  minVersion:'TLSv1.3'},async(req,res)=>{
  const respond=(status,body,contentType='application/json; charset=utf-8')=>{
   res.writeHead(status,{'content-type':contentType,'cache-control':'no-store, max-age=0',
    'x-content-type-options':'nosniff','x-frame-options':'DENY',
    'referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow',
    'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'strict-transport-security':'max-age=31536000'});
   res.end(typeof body==='string'?body:JSON.stringify(body));
  };
  if(req.method!=='GET'||![
   QL486_CONSOLE_PATH,QL486_CONSOLE_JSON_PATH].includes(req.url)){
   respond(404,{state:'HOLD',reason:'QL486_PRIVATE_ROUTE_NOT_FOUND'});return;
  }
  try{
   const cert=req.socket.getPeerCertificate?.();
   const result=reader.read({authorized:req.socket.authorized===true,
    certificateFingerprint256:cert?.fingerprint256,
    format:req.url===QL486_CONSOLE_PATH?'html':'json'});
   respond(result.status,result.body,result.contentType);
  }catch{
   respond(503,{state:'HOLD',reason:'QL486_PRIVATE_OPERATOR_READ_FAILED'});
  }
 });
}
export const QL486_CONSOLE_BOUNDARY=Object.freeze({
 autoListen:false,cloudflarePublicRoute:false,
 customerWrites:false,sourceConnect:false,jsClientScripts:false,
 sourceFieldAcceptance:'HOLD'});
