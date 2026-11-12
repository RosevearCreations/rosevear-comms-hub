import {createHash, createPublicKey, verify} from 'node:crypto';

const MASTERS=['rosevear-ai-hub','rosevear-comms-hub','ai-data-platform'];
const REV=/^[a-f0-9]{40}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const MAX_AGE_MS=60000;
const hold=(reason,receiver='OFF')=>({state:'HOLD',reason,receiver,connection:'HOLD',ownerAcceptance:'HOLD',runtimeUptime:'UNKNOWN',slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE'});
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const exact=(obj,fields)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).length===fields.length&&fields.every(f=>Object.hasOwn(obj,f));
const validAt=(s,now)=>typeof s==='string'&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString()===s&&Date.parse(s)<=now&&now-Date.parse(s)<=MAX_AGE_MS;
function signed(payload,signature,spki){
 try{
  if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature)||typeof spki!=='string')return false;
  const raw=Buffer.from(spki,'base64');
  if(raw.toString('base64')!==spki)return false;
  const key=createPublicKey({key:raw,format:'der',type:'spki'});
  return key.asymmetricKeyType==='ed25519'&&verify(null,Buffer.from(JSON.stringify(payload)),key,Buffer.from(signature,'base64'));
 }catch{return false;}
}
function validateHeartbeat(hb,masterId,accepted,pin,now){
 const p=hb?.payload;
 return exact(hb,['payload','signature'])&&exact(p,['schema','masterId','ceremonyId','sourceId','episodeId','sourceRevision','controllerRevision','status','observedAt','sequence'])&&
 p.schema==='rosevear.ql425.master-pilot-heartbeat.v1'&&p.masterId===masterId&&
 p.ceremonyId===accepted.ceremonyId&&p.sourceId===accepted.sourceId&&p.episodeId===accepted.episodeId&&
 p.sourceRevision===accepted.sourceRevision&&p.controllerRevision===accepted.controllerRevision&&
 p.status==='ISOLATED_PILOT_HEALTHY'&&Number.isSafeInteger(p.sequence)&&p.sequence>0&&
 validAt(p.observedAt,now)&&signed(p,hb.signature,pin);
}
/** Must be invoked by a protected backend scheduler with fresh independently signed reports.
 * Deploying this module does not schedule a task, enable the receiver or establish connectivity.
 * A successful result is only a bounded single read; never perpetual health or general CONNECTED.
 */
export async function checkQl425ProtectedPilotContinuity({accepted,heartbeats,receiverAdapter,previousSequences={}},{
 masterPins,independentMasterPinsVerified=false,protectedOperatorSession=false,nowMs
}={}){
 if(!protectedOperatorSession||!independentMasterPinsVerified||!Number.isSafeInteger(nowMs)||
  !receiverAdapter||typeof receiverAdapter.disableOneTest!=='function')
  return hold('PROTECTED_HEALTH_MONITOR_AUTHORITY_MISSING');
 const active=accepted?.state==='VERIFIED_THREE_MASTER_ISOLATED_PILOT_ACCEPTANCE'&&
  accepted.connection==='VERIFIED_CONNECTED_PILOT'&&accepted.receiver==='ISOLATED_ONE_TEST_ON'&&
  accepted.ownerAcceptance==='DUAL_SIGNED_FOR_ISOLATED_PILOT'&&
  accepted.sourceId==='rosevear-ai-hub'&&ID.test(accepted.ceremonyId??'')&&
  ID.test(accepted.episodeId??'')&&REV.test(accepted.sourceRevision??'')&&
  REV.test(accepted.controllerRevision??'')&&
  accepted.masterCount===3;
 if(!active)return hold('QL424_AUTHENTICATED_PILOT_ACCEPTANCE_REQUIRED');
 let failed='THREE_MASTER_HEALTH_HEARTBEATS_MISSING';
 if(Array.isArray(heartbeats)&&heartbeats.length===3&&masterPins&&
  MASTERS.every(id=>typeof masterPins[id]==='string')&&
  MASTERS.every(id=>{
   const found=heartbeats.filter(h=>h?.payload?.masterId===id);
   return found.length===1&&validateHeartbeat(found[0],id,accepted,masterPins[id],nowMs)&&
    Number.isSafeInteger(previousSequences[id]??0)&&found[0].payload.sequence>(previousSequences[id]??0);
  })){
  return {state:'VERIFIED_ISOLATED_PILOT_HEALTH_SNAPSHOT',connection:'VERIFIED_CONNECTED_PILOT',
   receiver:'ISOLATED_ONE_TEST_ON',ownerAcceptance:'DUAL_SIGNED_FOR_ISOLATED_PILOT',
   runtimeUptime:'SINGLE_SIGNED_SNAPSHOT_NOT_CONTINUOUS_UPTIME',
   slaveGate:'HOLD_NEXT_MASTER_INTEGRATION_STAGE',
   ceremonyId:accepted.ceremonyId,sourceId:accepted.sourceId,episodeId:accepted.episodeId,
   observedAt:new Date(nowMs).toISOString(),
   sequences:Object.fromEntries(MASTERS.map(id=>[id,heartbeats.find(h=>h.payload.masterId===id).payload.sequence])),
   evidenceDigest:digest(heartbeats.map(h=>h.payload).sort((a,b)=>MASTERS.indexOf(a.masterId)-MASTERS.indexOf(b.masterId)))};
 }
 try{
  const disabled=await receiverAdapter.disableOneTest({ceremonyId:accepted.ceremonyId,reason:failed});
  if(disabled?.disabled!==true)return hold('FAIL_CLOSED_RECEIVER_DISABLE_NOT_CONFIRMED','UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED');
  return hold('PILOT_HEALTH_LOST_RECEIVER_DISABLED');
 }catch{return hold('FAIL_CLOSED_RECEIVER_DISABLE_FAILED','UNKNOWN_MANUAL_OPERATOR_RECOVERY_REQUIRED');}
}
