/**
 * QL-484 owner-operated PRIVATE mutual-TLS witness endpoint.
 * No automatic listener. No Cloudflare/Vite route. Operator certificate
 * identity is drawn from the trusted TLS socket, not request JSON.
 */
import {createServer} from 'node:https';
export const QL484_REVIEW_PATH='/internal/comms/ql484/field/review';
const exact=(v,fields)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&
 Object.keys(v).length===fields.length&&fields.every(k=>Object.hasOwn(v,k));
export function createQl484PrivateReviewHttpsServer({tlsOptions,fieldReview}={}){
 if(!tlsOptions?.key||!tlsOptions?.cert||!tlsOptions?.ca||
  typeof fieldReview?.commit!=='function')
  throw Error('QL484_PRIVATE_MUTUAL_TLS_AND_REVIEW_REQUIRED');
 const server=createServer({...tlsOptions,requestCert:true,rejectUnauthorized:true,
  minVersion:'TLSv1.3'},async(req,res)=>{
  const respond=(status,body)=>{res.writeHead(status,{
   'content-type':'application/json; charset=utf-8',
   'cache-control':'no-store, max-age=0',
   'x-content-type-options':'nosniff',
   'referrer-policy':'no-referrer',
   'content-security-policy':"default-src 'none'",
   'strict-transport-security':'max-age=31536000'});
   res.end(JSON.stringify(body))};
  if(req.method!=='POST'||req.url!==QL484_REVIEW_PATH){
   respond(404,{state:'HOLD',reason:'QL484_PRIVATE_ROUTE_NOT_AVAILABLE'});return;
  }
  if(req.headers['content-type']?.split(';')[0].trim()!=='application/json'){
   respond(415,{state:'HOLD',reason:'QL484_JSON_ONLY'});return;
  }
  let size=0,raw='';
  try{
   for await(const chunk of req){
    size+=chunk.length;
    if(size>12288){respond(413,{state:'HOLD',reason:'QL484_PRIVATE_BODY_TOO_LARGE'});return}
    raw+=chunk.toString('utf8');
   }
   const input=JSON.parse(raw);
   if(!exact(input,['sourceObservationPacket','hostObservationPacket',
      'reviewerPacket','operatorReadPacket'])){
    respond(400,{state:'HOLD',reason:'QL484_EXACT_SIGNED_PACKETS_REQUIRED'});return}
   const result=fieldReview.commit({...input,
    operatorTlsAuthorized:req.socket.authorized===true,
    operatorClientCertificateFingerprint:req.socket
     .getPeerCertificate?.()?.fingerprint256?.replaceAll(':','').toLowerCase()});
   // Only redacted outcome is returned: no signed packet, private journal,
   // certificate material or customer information.
   const b=result.state==='DURABLE_SIGNED_YW_SESSION_CORRELATION_HELD'?
    {state:result.state,sessionDigest:result.sessionDigest,
     caseId:result.proof?.caseId,sourceRevision:result.proof?.sourceRevision,
     commsMainRevision:result.proof?.commsMainRevision,
     durableReadback:true,originalHostVerified:false,
     fieldAcceptance:'HOLD',productionAcceptance:false}:
    {state:'HOLD',reason:result.reason??'QL484_PRIVATE_FIELD_REVIEW_HELD',
     originalHostVerified:false,productionAcceptance:false};
   respond(result.state==='DURABLE_SIGNED_YW_SESSION_CORRELATION_HELD'?200:403,b);
  }catch{respond(400,{state:'HOLD',reason:'QL484_PRIVATE_REQUEST_INVALID'})}
 });
 return server;
}
export const QL484_HTTPS_BOUNDARY=Object.freeze({
 publicRoute:false,autoListen:false,customerWrites:false,providerSend:false,
 genuineDeviceWitnessCertified:false});
