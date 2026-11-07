/** Original Ree-only private evidence storage. Explicitly fails on CI,
 * Linux, Jack, another Windows user, or missing original ACL provisioning.
 * No credentials/private keys are read. All files use create-new semantics.
 */
import {createHash,randomUUID} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {userInfo} from 'node:os';
import {join} from 'node:path';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {restrictDirectory} from './owner-authority-custody.mjs';

const SHA=/^[0-9a-f]{64}$/;
const ID=/^ql360-[0-9a-f-]{36}\.json$/;
const sha=v=>createHash('sha256').update(canonicalize(v)).digest('hex');

/** Create only on ORIGINAL host, never expose this adapter in a Worker. */
export function createQl360WindowsPrivateStore(){
  if(process.platform!=='win32'||
    process.env.COMPUTERNAME?.toUpperCase()!=='DESKTOP-AE894KC'||
    userInfo().username.toLowerCase()!=='ree'||
    !process.env.LOCALAPPDATA||!process.env.USERDOMAIN)
    throw Error('HOLD_ORIGINAL_REE_WINDOWS_HOST_CURRENT_USER_REQUIRED');
  const directory=join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay',
    'Evidence','Ql360Archive');
  const guard=()=>restrictDirectory(directory); // verifies real current-user ACL via icacls.
  return Object.freeze({
    writeOriginalPrivateArchive:async({evidence,evidenceSha256,mode,originalComputer})=>{
      if(mode!=='OWNER_ONLY_CREATE_NEW'||originalComputer!=='DESKTOP-AE894KC'||
        evidence?.schema!=='rosevear.hub.ql360.original-private-evidence-archive.v1'||
        evidence.kind!=='ORIGINAL_POST_TEST_PRIVATE_EVIDENCE_ONLY'||
        evidence.peerCount!==6||evidence.connectedCount!==0||
        evidence.customerCommunications!==false||evidence.deviceActions!==false||
        !Array.isArray(evidence.sources)||evidence.sources.length!==6||
        !SHA.test(evidenceSha256??'')||sha(evidence)!==evidenceSha256)
        throw Error('DENY_NONORIGINAL_OR_CHANGED_PRIVATE_ARCHIVE');
      guard();
      const archiveId=`ql360-${randomUUID()}.json`;
      const file=join(directory,archiveId);
      if(existsSync(file))throw Error('DENY_ORIGINAL_ARCHIVE_EXISTS_NO_OVERWRITE');
      writeFileSync(file,JSON.stringify({evidence,evidenceSha256})+'\n',
        {encoding:'utf8',flag:'wx',mode:0o600});
      return {state:'ORIGINAL_REE_PRIVATE_ARCHIVE_WRITTEN_NEW',
        originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',
        ownerOnlyAcl:true,atomicCreateNew:true,archiveId,sha256:evidenceSha256};
    },
    readOriginalPrivateArchive:async({archiveId,expectedSha256})=>{
      if(!ID.test(archiveId??'')||!SHA.test(expectedSha256??''))
        throw Error('DENY_UNREVIEWED_ORIGINAL_ARCHIVE_ID');
      guard();
      const data=JSON.parse(readFileSync(join(directory,archiveId),'utf8'));
      if(data.evidenceSha256!==expectedSha256||sha(data.evidence)!==expectedSha256)
        throw Error('DENY_ORIGINAL_PRIVATE_ARCHIVE_DIGEST_CHANGED');
      return {state:'ORIGINAL_REE_PRIVATE_ARCHIVE_READBACK_VERIFIED',
        originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',
        ownerOnlyAcl:true,archiveId,sha256:expectedSha256,evidence:data.evidence};
    }
  });
}
