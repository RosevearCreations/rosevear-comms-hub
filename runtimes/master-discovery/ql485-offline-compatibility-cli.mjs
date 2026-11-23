#!/usr/bin/env node
/**
 * QL-485 owner-operated OFFLINE source compatibility diagnostics.
 * Reads an owner-selected PRIVATE file only; no network, no git commands,
 * source writes, key generation, connection, scheduled job or deployment.
 */
import {readFileSync,lstatSync} from 'node:fs';
import {isAbsolute,resolve,sep} from 'node:path';
import {negotiateQl485SixSources,diagnoseQl485CrossAppDivergence,
 QL485_SOURCE_IDS} from './ql485-signed-release-negotiation.mjs';
const fail=why=>{throw Error('HOLD_QL485_'+why)};
const exact=(o,fields)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k));
function privateFile(path){
 if(typeof path!=='string'||!isAbsolute(path)||
  path.split(/[\\/]/).includes('..'))fail('ABSOLUTE_PRIVATE_FILE_REQUIRED');
 const file=resolve(path),cwd=resolve(process.cwd());
 if(file===cwd||file.startsWith(cwd+sep))fail('CANNOT_READ_GIT_CHECKOUT');
 if(process.platform==='win32'){
  const root=resolve(process.env.LOCALAPPDATA??'');
  if(!process.env.LOCALAPPDATA||
   !file.toLowerCase().startsWith((root+sep).toLowerCase()))
   fail('OWNER_LOCALAPPDATA_ONLY');
 }
 const stat=lstatSync(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>200000||
  (process.platform!=='win32'&&(stat.mode&0o077)))
  fail('PRIVATE_FILE_PERMISSIONS_OR_SIZE');
 return file;
}
function run(){
 if(process.argv.length===3&&process.argv[2]==='--status'){
  process.stdout.write(JSON.stringify({
   state:'QL485_PRIVATE_CROSS_APP_DIAGNOSTICS_OFFLINE',
   sources:QL485_SOURCE_IDS,liveSourceConnections:0,
   automaticDeployment:false,automaticMerge:false,
   originalSourceVerified:false})+'\n');return;
 }
 if(process.argv.length!==4||process.argv[2]!=='--review')
  fail('USE_STATUS_OR_REVIEW');
 const input=JSON.parse(readFileSync(privateFile(process.argv[3]),'utf8'));
 if(!exact(input,['packets','pins','git','sourceHeads']))
  fail('EXACT_OWNER_SUPPLIED_REPORT_REQUIRED');
 const negotiation=negotiateQl485SixSources({
  packets:input.packets,pins:input.pins});
 const diagnostics=diagnoseQl485CrossAppDivergence({
  git:input.git,sourceHeads:input.sourceHeads,negotiation});
 // Present only source IDs, state, aggregate counts and SHA-based
 // diagnostics. NEVER print signed packets, public pins or credentials.
 process.stdout.write(JSON.stringify({
  state:'QL485_OWNER_OFFLINE_REVIEW',
  reviewState:negotiation.state,
  cryptographicallyCompatibleCount:negotiation.compatibleCount,
  pendingSources:negotiation.pendingSources,
  summaryDigest:negotiation.summaryDigest,
  perSource:Object.fromEntries(QL485_SOURCE_IDS.map(id=>[
   id,negotiation.results[id].state])),
  git:diagnostics.state==='READ_ONLY_CROSS_APP_DIAGNOSTICS'?{
   ancestry:diagnostics.gitAncestry,aheadBy:diagnostics.aheadBy,
   behindBy:diagnostics.behindBy,metadataTrust:diagnostics.gitMetadataTrust,
   sourceHeads:diagnostics.sources}:{
   state:'HOLD',reason:diagnostics.reason},
  originalSourceVerified:false,productionAcceptance:false,
  automaticMerge:false,customerDelivery:false})+'\n');
}
try{run()}catch(e){
 process.stderr.write(JSON.stringify({state:'HOLD',
  reason:String(e.message).startsWith('HOLD_QL485_')?e.message:
   'HOLD_QL485_OFFLINE_PRIVATE_REPORT_UNAVAILABLE'})+'\n');
 process.exitCode=1;
}
