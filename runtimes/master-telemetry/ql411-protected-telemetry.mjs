import {createPublicKey,verify} from 'node:crypto';

const MAX_SAMPLES=1440;
const OPAQUE=/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,95}$/;
const SHA=/^[a-f0-9]{40}$/;
const SERVICES=new Set(['hub_api_8765','hub_client_5173','hub_caddy_8443']);
const SAFE=['schema','sourceId','hostId','sourceRevision','capturedAt','episodeId','samples'];
const SAMPLE_FIELDS=['observationId','service','observedAt','reachable','latencyMs'];
const exact=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
  Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(o,k));
const timestamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&
  new Date(Date.parse(s)).toISOString()===s;
const denied=(reason)=>({state:'HOLD',reason,connection:'HOLD',receiverEnabled:false,
  oneTestAuthorized:false,verified:false,readModel:null,incidents:[]});

/** Verifies an original-host, metadata-only telemetry envelope. Caller must
 * supply a separately enrolled SPKI pin and durable replay store. Neither is
 * read from the envelope. No I/O, automation or receiver controls occur here. */
export function reviewQl411ProtectedTelemetry(envelope,{publicKeySpkiBase64,
  replayStore,nowMs,expectedRevision}={}){
  if(!publicKeySpkiBase64||!replayStore||typeof replayStore.has!=='function'||
    typeof replayStore.add!=='function'||!Number.isFinite(nowMs)||
    !SHA.test(expectedRevision??''))return denied('PROTECTED_AUTHORITY_UNAVAILABLE');
  if(!exact(envelope,['payload','signature']))return denied('INVALID_SIGNED_ENVELOPE');
  const p=envelope.payload;
  if(!exact(p,SAFE)||p.schema!=='rosevear.ql411.ree-telemetry.v1'||
    p.sourceId!=='rosevear-ai-hub'||p.hostId!=='DESKTOP-AE894KC'||
    p.sourceRevision!==expectedRevision||!timestamp(p.capturedAt)||
    !OPAQUE.test(p.episodeId??'')||!Array.isArray(p.samples)||
    p.samples.length<2||p.samples.length>MAX_SAMPLES)
    return denied('INVALID_SOURCE_HOST_OR_SCHEMA');
  const cap=Date.parse(p.capturedAt);
  if(cap>nowMs||nowMs-cap>5*60_000)return denied('STALE_OR_FUTURE_TELEMETRY');
  const ids=new Set();
  for(const s of p.samples){
    if(!exact(s,SAMPLE_FIELDS)||!OPAQUE.test(s.observationId??'')||
      !SERVICES.has(s.service)||!timestamp(s.observedAt)||
      typeof s.reachable!=='boolean'||typeof s.latencyMs!=='number'||
      !Number.isFinite(s.latencyMs)||s.latencyMs<0||s.latencyMs>60_000||
      Date.parse(s.observedAt)>cap||cap-Date.parse(s.observedAt)>24*60*60_000||
      ids.has(s.observationId))return denied('INVALID_OR_REPLAYED_SAMPLE');
    ids.add(s.observationId);
  }
  if(typeof envelope.signature!=='string'||
    !/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature))
    return denied('INVALID_SIGNATURE_ENCODING');
  const replayKey=`${p.sourceId}:${p.episodeId}`;
  if(replayStore.has(replayKey))return denied('REPLAYED_EPISODE');
  let authentic=false;
  try{
    const key=createPublicKey({key:Buffer.from(publicKeySpkiBase64,'base64'),format:'der',type:'spki'});
    if(key.asymmetricKeyType!=='ed25519')return denied('INVALID_PIN_TYPE');
    authentic=verify(null,Buffer.from(JSON.stringify(p)),key,
      Buffer.from(envelope.signature,'base64'));
  }catch{return denied('INVALID_PIN_OR_SIGNATURE');}
  if(!authentic)return denied('SIGNATURE_REJECTED');
  // Caller owns durable anti-replay storage. If a write fails, fail closed.
  try{replayStore.add(replayKey);}catch{return denied('REPLAY_STORE_UNAVAILABLE');}
  const rows=[...SERVICES].map(service=>{
    const samples=p.samples.filter(s=>s.service===service).sort((a,b)=>
      a.observedAt.localeCompare(b.observedAt));
    if(samples.length<2)return {service,status:'INSUFFICIENT_HISTORY',
      uptimePercent:null,observations:samples.length};
    const good=samples.filter(s=>s.reachable).length;
    return {service,status:samples.at(-1).reachable?'UP':'DOWN',
      uptimePercent:Math.round(good/samples.length*10000)/100,
      observations:samples.length};
  });
  const incidents=rows.filter(row=>row.status==='DOWN').map(row=>({
    sourceId:p.sourceId,episodeId:p.episodeId,service:row.service,
    route:'COMMS_OPERATOR_REVIEW',status:'OPEN_UNACKNOWLEDGED',
    correlationKey:`${p.sourceId}:${p.episodeId}:${row.service}`}));
  return {state:'VERIFIED_TELEMETRY_ONLY',reason:'SIGNED_METADATA_READ_ONLY',
    verified:true,sourceId:p.sourceId,hostId:p.hostId,
    sourceRevision:p.sourceRevision,capturedAt:p.capturedAt,
    readModel:rows,incidents,connection:'HOLD',receiverEnabled:false,
    oneTestAuthorized:false};
}

/** Operator continuity is an inert read model, never a remote message or action. */
export function reviewQl411IncidentAcknowledgement(incident,claim){
  if(!incident||!claim||claim.correlationKey!==incident.correlationKey||
    claim.sourceId!==incident.sourceId||
    !['ACKNOWLEDGED','FOLLOW_UP_REQUIRED'].includes(claim.decision)||
    !OPAQUE.test(claim.operatorReference??'')||
    Object.keys(claim).some(k=>!['correlationKey','sourceId','decision','operatorReference'].includes(k)))
    return {...incident,status:'OPEN_UNACKNOWLEDGED',acknowledgement:'HOLD'};
  return {...incident,status:claim.decision,acknowledgement:'OPERATOR_CLAIM_ONLY',
    connection:'HOLD',receiverEnabled:false};
}
