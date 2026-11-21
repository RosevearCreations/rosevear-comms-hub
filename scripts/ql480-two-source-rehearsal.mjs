#!/usr/bin/env node
/** QL480 isolated two-source rehearsal: no live source, customer, provider or send. */
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {QL480_SOURCE_SCHEMA,QL480_OPERATOR_SCHEMA,QL480_READ_SCHEMA,
  createQl480PrivateCaseAdapter} from '../runtimes/master-telemetry/ql480-scoped-incident-adapter.mjs';

const keys=Object.fromEntries(['yard-workers','icamp','operator']
 .map(name=>[name,generateKeyPairSync('ed25519')]));
const pub=name=>keys[name].publicKey.export({type:'spki',format:'der'}).toString('base64');
const signed=(p,actor)=>({payload:p,signature:sign(null,Buffer.from(JSON.stringify(p)),
 keys[actor].privateKey).toString('base64')});
const dir=mkdtempSync(join(tmpdir(),'ql480-isolated-rehearsal-'));
let now=Date.UTC(2026,10,21,12,0,0);
const make=()=>createQl480PrivateCaseAdapter({directory:dir,
 sourcePins:{'yard-workers':pub('yard-workers'),icamp:pub('icamp')},
 operatorPin:pub('operator'),environment:'SIMULATION',now:()=>now});
const apps=[
 {app:'yard-workers',tenant:'rosevear-landscaping-sim',episode:'episode_yw_rehearsal_01'},
 {app:'icamp',tenant:'camp-rosevear-sim',episode:'episode_icamp_rehearsal_01'}
];
const sha='a'.repeat(40),missDigest='b'.repeat(64),recoveryDigest='c'.repeat(64);
const results=[];
const assert=(value,label)=>{if(!value)throw Error('QL480_REHEARSAL_FAILED_'+label)};
try{
 for(const [index,scenario] of apps.entries()){
  const scope={sourceApp:scenario.app,tenantId:scenario.tenant,
   episodeId:scenario.episode,environment:'SIMULATION'};
  const base={schema:QL480_SOURCE_SCHEMA,...scope,
   sourceRevision:sha,classification:'NON_SENSITIVE_SCOPED_EXCEPTION',
   correlationId:'correlation_sim_'+index,causationId:'causation_sim_'+index,
   sourceRecordId:'opaque_source_ref_'+index};
  const outage=signed({...base,eventId:'event_miss_sim_'+index,
    kind:'HEARTBEAT_MISSED',sequence:1,receiptDigest:missDigest,
    observedAtMs:now-30000},scenario.app);
  let a=make().ingest(outage);
  assert(a.caseStatus==='OPEN'&&a.pendingIntents.length===1,'OPEN_'+index);
  a=make().ingest(outage);assert(a.state==='DUPLICATE_SOURCE_EVENT_NO_NEW_EFFECT','DEDUP_'+index);
  const recovery=signed({...base,eventId:'event_recovery_sim_'+index,
    kind:'HEARTBEAT_RECOVERED',sequence:2,receiptDigest:recoveryDigest,
    observedAtMs:now-10000},scenario.app);
  a=make().ingest(recovery);
  assert(a.caseStatus==='RECOVERY_PENDING_OPERATOR_REVIEW','RECOVERY_'+index);
  const closure=signed({schema:QL480_OPERATOR_SCHEMA,commandId:'cmd_close_sim_'+index,
    action:'CLOSE_CASE',operatorId:'operator_sim',...scope,
    intentKey:null,evidenceDigest:recoveryDigest,occurredAtMs:now-5000,
    disposition:'OWNER_REVIEW'},'operator');
  a=make().command(closure);
  assert(a.caseStatus==='CLOSED'&&a.pendingIntents.length===3,'CLOSE_'+index);
  const read=signed({schema:QL480_READ_SCHEMA,requestId:'read_sim_'+index,
    operatorId:'operator_sim',...scope,requestedAtMs:now},'operator');
  a=make().read(read);
  assert(a.caseStatus==='CLOSED'&&a.customerDeliveryVerified===false,'RESTART_'+index);
  const late=signed({...base,eventId:'event_late_sim_'+index,
    kind:'HEARTBEAT_MISSED',sequence:1,receiptDigest:missDigest,
    observedAtMs:now-25000},scenario.app);
  const old=make().ingest(late);
  assert(old.state==='HISTORICAL_RETAINED_NO_REOPEN'&&old.caseStatus==='CLOSED','LATE_'+index);
  results.push({sourceApp:scenario.app,tenantId:scenario.tenant,
   caseId:a.caseId,status:a.caseStatus,transitions:a.transitionCount,
   finalJournalDigest:old.lastJournalDigest,sourceProductionReceipt:false,
   outboundSend:false});
 }
 assert(results[0].caseId!==results[1].caseId,'CROSS_SOURCE_CASE_ISOLATION');
 process.stdout.write(JSON.stringify({
  schema:'rosevear.comms.ql480.two-source-rehearsal.v1',
  state:'SYNTHETIC_TWO_SOURCE_REHEARSAL_PASSED_NOT_PRODUCTION',
  applications:results,liveProviderDelivery:false,customerDataIncluded:false,
  sourceRuntimeVerified:false,receiverActivated:false
 },null,2)+'\n');
}catch(error){process.stderr.write(String(error.message||error)+'\n');process.exitCode=1}
finally{rmSync(dir,{recursive:true,force:true})}
