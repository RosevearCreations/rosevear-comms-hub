const TELEMETRY_PATH="/internal/rosevear/sysop/telemetry/v1";
const PUBLIC_KEY_PATH=TELEMETRY_PATH+"/public-key";
const HEX64=/^[a-f0-9]{64}$/;
const HEX40=/^[a-f0-9]{40}$/;
const encoder=new TextEncoder();

const canonical=v=>Array.isArray(v)?"["+v.map(canonical).join(",")+"]":v&&typeof v==="object"?"{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical(v[k])).join(",")+"}":JSON.stringify(v);
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromB64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const pem=(label,bytes)=>{const s=b64(bytes);return "-----BEGIN "+label+"-----\n"+s.match(/.{1,64}/g).join("\n")+"\n-----END "+label+"-----\n";};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Access-Control-Allow-Origin":"none"}});

export class Build432Signer{
 constructor(ctx){this.storage=ctx.storage;}
 async keys(){
  let stored=await this.storage.get("ed25519-v1");
  if(stored)return stored;
  const pair=await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
  const privatePkcs8=await crypto.subtle.exportKey("pkcs8",pair.privateKey);
  const publicSpki=await crypto.subtle.exportKey("spki",pair.publicKey);
  stored={privatePkcs8:b64(privatePkcs8),publicSpki:b64(publicSpki),createdAt:new Date().toISOString()};
  await this.storage.put("ed25519-v1",stored);
  return stored;
 }
 async fetch(request){
  const url=new URL(request.url),keys=await this.keys(),spki=fromB64(keys.publicSpki);
  const fingerprint=hex(await crypto.subtle.digest("SHA-256",spki));
  if(url.pathname==="/public-key"){
   return json({algorithm:"Ed25519",fingerprint,publicKeyPem:pem("PUBLIC KEY",spki),createdAt:keys.createdAt});
  }
  if(url.pathname!=="/sign"||request.method!=="POST")return json({state:"DENY_SCOPE"},404);
  const payload=await request.json();
  const key=await crypto.subtle.importKey("pkcs8",fromB64(keys.privatePkcs8),{name:"Ed25519"},false,["sign"]);
  const signature=await crypto.subtle.sign("Ed25519",key,encoder.encode(canonical(payload)));
  return json({payload,signature:hex(signature),fingerprint});
 }
}

async function sourceCommit(env,request){
 const r=await env.ASSETS.fetch(new Request(new URL("/build432-source-commit.json",request.url),{method:"GET"}));
 if(!r.ok)throw new Error("source_commit_asset_unavailable");
 const body=await r.json(),commit=String(body.commit||"");
 if(!HEX40.test(commit))throw new Error("source_commit_invalid");
 return commit;
}
async function signer(env){
 const id=env.BUILD432_SIGNER.idFromName("production-ed25519-v1");
 return env.BUILD432_SIGNER.get(id);
}

export default{
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname===PUBLIC_KEY_PATH&&request.method==="GET"){
   const stub=await signer(env);return stub.fetch("https://signer.internal/public-key");
  }
  if(url.pathname===TELEMETRY_PATH){
   if(request.method!=="GET"||url.search||url.hash)return json({state:"DENY_SCOPE",connected:false,authorizesAction:false},request.method==="GET"?404:405);
   const challenge=request.headers.get("x-rosevear-telemetry-challenge")||"";
   if(!HEX64.test(challenge))return json({state:"INVALID_CHALLENGE",connected:false,authorizesAction:false},400);
   try{
    const now=Date.now(),commit=await sourceCommit(env,request),nonce=new Uint8Array(16);crypto.getRandomValues(nonce);
    const payload={schema:"rosevear.sysop.statistics.v1",protocolVersion:"1.2",appId:"rosevear-comms-hub",sourceCommit:commit,eventId:crypto.randomUUID().replaceAll("-",""),nonce:hex(nonce),challenge,issuedAtMs:now,expiresAtMs:now+60000,state:"UNKNOWN",metricsWindowSeconds:60,
     metrics:{requests:null,serverErrors:null,jobsCompleted:null,jobsFailed:null,queueDepth:null,latencyP95Ms:null,activeSessions:null},
     sysop:{eventKind:"HEARTBEAT",observedAtMs:now,processUptimeSec:null,restartCount:null,lastRestartAtMs:null,bootTimeMs:null,rebootIsIndependentlyWitnessed:false},
     dataClass:"NON_SENSITIVE_AGGREGATE",tenantId:null,authorizesAction:false};
    const stub=await signer(env);
    const signed=await stub.fetch("https://signer.internal/sign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!signed.ok)return signed;
    const envelope=await signed.json();
    return json({payload:envelope.payload,signature:envelope.signature});
   }catch{return json({state:"HOLD_SIGNER_UNAVAILABLE",connected:false,authorizesAction:false},503);}
  }
  return env.ASSETS.fetch(request);
 }
};
