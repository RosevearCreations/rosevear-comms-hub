import {createPrivateKey,randomBytes,randomUUID,sign,timingSafeEqual} from 'node:crypto';
import {createServer} from 'node:http';
export const SYSOP_TELEMETRY_PATH='/internal/rosevear/sysop/telemetry/v1';
export const SYSOP_TELEMETRY_SCHEMA='rosevear.sysop.statistics.v1';
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(body));};
export function createSysopTelemetryHandler({env=process.env,now=()=>Date.now()}={}){
 return (req,res)=>{
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket?.remoteAddress))return json(res,403,{state:'DENY_NONPRIVATE_ORIGIN',connected:false,authorizesAction:false});
  if(req.method!=='GET')return json(res,405,{state:'DENY_METHOD',connected:false,authorizesAction:false});
  if(req.url!==SYSOP_TELEMETRY_PATH)return json(res,404,{state:'DENY_SCOPE',connected:false,authorizesAction:false});
  const token=env.ROSEVEAR_SYSOP_TELEMETRY_READ_TOKEN,pem=env.ROSEVEAR_SYSOP_TELEMETRY_PRIVATE_KEY_PEM,commit=env.ROSEVEAR_SYSOP_TELEMETRY_SOURCE_COMMIT||env.GITHUB_SHA||'';
  if(!token||!pem||!/^[a-f0-9]{40}$/.test(commit))return json(res,503,{state:'NOT_ENROLLED',connected:false,authorizesAction:false});
  if(!equal(String(req.headers['x-rosevear-telemetry-token']??''),token))return json(res,401,{state:'NOT_AUTHORIZED',connected:false,authorizesAction:false});
  try{const nowMs=now();const payload={schema:SYSOP_TELEMETRY_SCHEMA,protocolVersion:'1.1',appId:'rosevear-comms-hub',sourceCommit:commit,eventId:randomUUID().replaceAll('-',''),nonce:randomBytes(16).toString('hex'),issuedAtMs:nowMs,expiresAtMs:nowMs+60000,state:'UNKNOWN',metricsWindowSeconds:60,
   metrics:{requests:null,serverErrors:null,jobsCompleted:null,jobsFailed:null,queueDepth:null,latencyP95Ms:null,activeSessions:null},
   sysop:{eventKind:'HEARTBEAT',observedAtMs:nowMs,processUptimeSec:Math.floor(process.uptime()),restartCount:null,lastRestartAtMs:null,bootTimeMs:null,rebootIsIndependentlyWitnessed:false},
   dataClass:'NON_SENSITIVE_AGGREGATE',tenantId:null,authorizesAction:false};
   const signature=sign(null,Buffer.from(canonical(payload)),createPrivateKey(pem)).toString('hex');return json(res,200,{payload,signature});
  }catch{return json(res,503,{state:'HOLD_SIGNER_UNAVAILABLE',connected:false,authorizesAction:false});}
 };
}
export async function startSysopTelemetryServer(options={},{port=8790}={}){
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('INVALID_TELEMETRY_PORT');
 const server=createServer(createSysopTelemetryHandler(options));
 server.requestTimeout=5000;server.headersTimeout=5000;server.maxRequestsPerSocket=20;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return server;
}
