/** QL-361: Ree-only, original-host, ACL-protected candidate handoff store.
 * It never publishes to GitHub, Supabase, the public Worker or a source app.
 */
import {createHash,randomUUID} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {userInfo} from 'node:os';
import {join} from 'node:path';
import {canonicalize} from '../master-discovery/manifest.mjs';
import {restrictDirectory} from './owner-authority-custody.mjs';
import {validateQl361HandoffShape} from './ql361-archived-chain-audit.mjs';

const SHA=/^[0-9a-f]{64}$/;
const ID=/^ql361-[0-9a-f-]{36}\.json$/;
const hash=value=>createHash('sha256').update(canonicalize(value)).digest('hex');

export function createQl361WindowsPrivateHandoffStore(){
  if(process.platform!=='win32'||
    process.env.COMPUTERNAME?.toUpperCase()!=='DESKTOP-AE894KC'||
    userInfo().username.toLowerCase()!=='ree'||
    !process.env.LOCALAPPDATA||!process.env.USERDOMAIN)
    throw Error('HOLD_ONLY_ORIGINAL_REE_WINDOWS_PRIVATE_AUDIT_STORE');
  const dir=join(process.env.LOCALAPPDATA,'RosevearAIHub','CommsRelay',
    'Evidence','Ql361Handoff');
  const guard=()=>restrictDirectory(dir); // current-user Windows ACL readback.
  return Object.freeze({
    writeOriginalPrivateHandoff:async({handoff,handoffSha256,mode,originalComputer})=>{
      if(mode!=='OWNER_ONLY_CREATE_NEW'||originalComputer!=='DESKTOP-AE894KC'||
        !validateQl361HandoffShape(handoff)||!SHA.test(handoffSha256??'')||
        hash(handoff)!==handoffSha256)
        throw Error('DENY_UNAUTHENTICATED_OR_CHANGED_PRIVATE_SOURCE_HANDOFF');
      guard();
      const handoffId=`ql361-${randomUUID()}.json`;
      const path=join(dir,handoffId);
      if(existsSync(path))throw Error('DENY_QL361_HANDOFF_OVERWRITE');
      writeFileSync(path,JSON.stringify({handoff,handoffSha256})+'\n',
        {encoding:'utf8',flag:'wx',mode:0o600});
      return {state:'ORIGINAL_REE_QL361_HANDOFF_WRITTEN_NEW',
        originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',
        ownerOnlyAcl:true,atomicCreateNew:true,handoffId,sha256:handoffSha256};
    },
    readOriginalPrivateHandoff:async({handoffId,expectedSha256})=>{
      if(!ID.test(handoffId??'')||!SHA.test(expectedSha256??''))
        throw Error('DENY_UNREVIEWED_PRIVATE_HANDOFF_ID');
      guard();
      const data=JSON.parse(readFileSync(join(dir,handoffId),'utf8'));
      if(!validateQl361HandoffShape(data.handoff)||
        data.handoffSha256!==expectedSha256||
        hash(data.handoff)!==expectedSha256)
        throw Error('DENY_PRIVATE_HANDOFF_CONTENT_OR_DIGEST_CHANGED');
      return {state:'ORIGINAL_REE_QL361_HANDOFF_READBACK_VERIFIED',
        originalComputer:'DESKTOP-AE894KC',originalUser:'Ree',
        ownerOnlyAcl:true,handoffId,sha256:expectedSha256,handoff:data.handoff};
    }
  });
}
