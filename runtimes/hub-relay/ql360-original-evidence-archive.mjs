/** QL-360: original-host private, post-TEST evidence archive. Never stores
 * private keys, signing passphrases, database URLs, customer records or device
 * actions. Only genuine in-process QL-359 closeouts can authorize this path.
 */
import {createHash} from 'node:crypto';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {consumeQl359VerifiedCloseoutForArchive} from './ql359-supervised-private-closeout.mjs';
import {validateSixHeldPeers} from './ql341-private-readback.mjs';

export const QL360_SCHEMA='rosevear.hub.ql360.original-private-evidence-archive.v1';
// Private, process-local one-use proof. A copied successful JSON response or
// a hash of a file is never an authenticated QL-361 archive capability.
const verifiedArchives=new WeakMap();
const SHA=/^[a-f0-9]{64}$/;
const sha=value=>createHash('sha256').update(canonicalize(value)).digest('hex');
const held=(state,extra={})=>({schema:QL360_SCHEMA,state,
  authenticatedOriginalArchive:false,timeBoundShutdownWitnessVerified:false,
  exactOneImmutableReceiptVerified:false,sixPeersHeldVerified:false,
  exportedEvidenceCount:0,archiveAccepted:false,receiverActivated:false,
  connected:false,connectedCount:0,customerCommunications:false,
  deviceActions:false,sourceRepositoryWrites:0,
  connectionState:'DISCONNECTED / HOLD',...extra});

/** Original server callbacks must be trusted independently of the input JSON.
 * persist/readback use an ACL-protected local current-user directory and an
 * atomic create-new operation, not a browser, public endpoint or repository.
 * This consumes its QL-359 closeout on the first attempt, even on failure.
 */
export async function archiveQl360OriginalPostTestEvidence({closeout,query,
  observeOriginalShutdown,writeOriginalPrivateArchive,
  readOriginalPrivateArchive,now=Date.now()}={}){
  if(typeof query!=='function'||typeof observeOriginalShutdown!=='function'||
    typeof writeOriginalPrivateArchive!=='function'||
    typeof readOriginalPrivateArchive!=='function'||!Number.isFinite(now))
    return held('HOLD_TRUSTED_ORIGINAL_ARCHIVE_DB_SHUTDOWN_AND_STORAGE_REQUIRED');
  const authentic=consumeQl359VerifiedCloseoutForArchive({closeout,now});
  if(!authentic)return held('HOLD_REAL_UNREPLAYED_QL359_CLOSEOUT_REQUIRED');
  try{
    const shutdown=await observeOriginalShutdown({
      sessionId:authentic.sessionId,transcriptSha256:authentic.transcriptSha256,
      after:authentic.closedAt});
    if(shutdown?.state!=='ORIGINAL_REE_TIME_BOUNDED_RECEIVER_SHUTDOWN'||
      shutdown.originalComputer!=='DESKTOP-AE894KC'||
      shutdown.originalUser!=='Ree'||shutdown.receiverPort!==8788||
      shutdown.receiverListenerCount!==0||shutdown.tailnetGatewayListenerCount!==0||
      shutdown.sessionId!==authentic.sessionId||
      shutdown.transcriptSha256!==authentic.transcriptSha256||
      !Number.isFinite(shutdown.observedAt)||
      shutdown.observedAt<authentic.closedAt||shutdown.observedAt>now+5_000||
      now-shutdown.observedAt>20_000)
      return held('HOLD_ORIGINAL_TIME_BOUND_SHUTDOWN_WITNESS_MISSING_OR_STALE');

    const role=await query('SELECT current_user AS receiver_role');
    const rows=await query(`SELECT device_id,workload_id,key_id,enrollment_state
      FROM public.master_hub_device_enrollments_ql339b WHERE device_id='rosevear-windows-hub'
        AND workload_id='hub-probe' AND key_id='hub-ql339b' AND enrollment_state='REVIEWED_TEST'`);
    const count=await query('SELECT count(receipt_id)::int AS count FROM public.master_hub_relay_receipts_ql338');
    const revocations=await query(`SELECT count(revocation_id)::int AS count
      FROM public.master_hub_device_revocations_ql339b WHERE device_id='rosevear-windows-hub'
        AND workload_id='hub-probe' AND key_id='hub-ql339b'`);
    const peers=await query(`SELECT peer_id,peer_kind,source_repo,connection_state,
      source_test_authorized,customer_data_allowed FROM public.master_hub_private_peers_ql341`);
    if(role.rows?.[0]?.receiver_role!=='ql340c_private_receiver'||
      rows.rows?.length!==1||rows.rows[0].device_id!=='rosevear-windows-hub'||
      rows.rows[0].workload_id!=='hub-probe'||rows.rows[0].key_id!=='hub-ql339b'||
      rows.rows[0].enrollment_state!=='REVIEWED_TEST'||count.rows?.[0]?.count!==1||
      revocations.rows?.[0]?.count!==0||!Array.isArray(peers.rows)||
      peers.rows.length!==6||validateSixHeldPeers(peers.rows).length!==6)
      return held('HOLD_ORIGINAL_ENROLLMENT_ONE_RECEIPT_OR_SIX_PEER_DRIFT');

    // Explicit allowlist: even if a database row later contains more fields,
    // customer details and credentials cannot join the archived document.
    const evidence={schema:QL360_SCHEMA,
      kind:'ORIGINAL_POST_TEST_PRIVATE_EVIDENCE_ONLY',
      sessionId:authentic.sessionId,deviceId:authentic.deviceId,
      signedTranscriptSha256:authentic.transcriptSha256,
      externallyPinnedWitnessSpkiSha256:authentic.independentWitnessPinSha256,
      closeoutAt:new Date(authentic.closedAt).toISOString(),
      shutdownObservedAt:new Date(shutdown.observedAt).toISOString(),
      receiptCount:1,revocationCount:0,receiverListenerCount:0,
      tailnetGatewayListenerCount:0,authenticatedDatabaseRole:'ql340c_private_receiver',
      peerCount:6,connectedCount:0,
      sources:peers.rows.map(p=>({id:p.peer_id,kind:p.peer_kind,
        sourceRepository:p.source_repo,state:'HOLD'}))
        .sort((a,b)=>a.id.localeCompare(b.id)),
      customerCommunications:false,deviceActions:false};
    const evidenceSha256=sha(evidence);
    const stored=await writeOriginalPrivateArchive({evidence,evidenceSha256,
      mode:'OWNER_ONLY_CREATE_NEW',originalComputer:'DESKTOP-AE894KC'});
    if(stored?.state!=='ORIGINAL_REE_PRIVATE_ARCHIVE_WRITTEN_NEW'||
      stored.originalComputer!=='DESKTOP-AE894KC'||
      stored.originalUser!=='Ree'||stored.ownerOnlyAcl!==true||
      stored.atomicCreateNew!==true||stored.sha256!==evidenceSha256||
      !/^[A-Za-z0-9._-]{8,160}$/.test(stored.archiveId??''))
      return held('HOLD_OWNER_ONLY_ORIGINAL_ARCHIVE_WRITE_NOT_VERIFIED');
    const check=await readOriginalPrivateArchive({archiveId:stored.archiveId,
      expectedSha256:evidenceSha256});
    if(check?.state!=='ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED'||
      check.originalComputer!=='DESKTOP-AE894KC'||check.originalUser!=='Ree'||
      check.ownerOnlyAcl!==true||check.archiveId!==stored.archiveId||
      !SHA.test(check.sha256??'')||check.sha256!==evidenceSha256||
      canonicalize(check.evidence)!==canonicalize(evidence)||
      sha(check.evidence)!==evidenceSha256)
      return held('HOLD_ATOMIC_ORIGINAL_ARCHIVE_READBACK_NOT_VERIFIED');
    const result=Object.freeze(held('ORIGINAL_PRIVATE_TEST_ARCHIVE_VERIFIED_ALL_SIX_PEERS_STILL_HELD',{
      authenticatedOriginalArchive:true,timeBoundShutdownWitnessVerified:true,
      exactOneImmutableReceiptVerified:true,sixPeersHeldVerified:true,
      exportedEvidenceCount:6,archiveAccepted:true,
      archiveId:stored.archiveId,evidenceSha256,
      nextAction:'Keep six integrations HELD until each source independently authorizes its own scoped signed TEST'}));
    verifiedArchives.set(result,{archiveId:stored.archiveId,evidenceSha256,
      sessionId:authentic.sessionId,transcriptSha256:authentic.transcriptSha256,
      witnessSpkiSha256:authentic.independentWitnessPinSha256,
      archivedAt:now});
    return result;
  }catch{return held('HOLD_PRIVATE_ORIGINAL_EVIDENCE_READBACK_OR_ARCHIVE_UNAVAILABLE');}
}

/** QL-361 consumes only a genuinely verified, unexpired original archive.
 * The proof cannot be serialized into a queue or transmitted to a browser.
 * It is deleted on first use, including failed downstream audit attempts. */
export function consumeQl360VerifiedArchiveForAudit({archive,now=Date.now()}={}){
  if(!Number.isFinite(now)||!archive||!verifiedArchives.has(archive))return null;
  const proof=verifiedArchives.get(archive);
  verifiedArchives.delete(archive);
  if(now<proof.archivedAt||now-proof.archivedAt>600_000||
    archive.archiveAccepted!==true||archive.connected!==false||
    archive.connectedCount!==0||archive.exportedEvidenceCount!==6||
    archive.archiveId!==proof.archiveId||archive.evidenceSha256!==proof.evidenceSha256)
    return null;
  return Object.freeze({...proof});
}

export function ql360Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')return held('ORIGINAL_EVIDENCE_ARCHIVE_OWNER_GUIDE_ONLY',{
    commands:['--help'],databaseWrites:0,publicExports:0,
    credentialAccess:false,receiverStarts:0,networkRequests:0});
  throw Error('DENY_UNSUPERVISED_QL360_ARCHIVE_OR_PRIVATE_RECEIVER_ACTION');
}
if(process.argv[1]?.endsWith('ql360-original-evidence-archive.mjs')){
  try{process.stdout.write(JSON.stringify(ql360Cli())+'\n');}
  catch(error){process.stderr.write(`HOLD_QL360: ${error.message}\n`);process.exitCode=1;}
}
