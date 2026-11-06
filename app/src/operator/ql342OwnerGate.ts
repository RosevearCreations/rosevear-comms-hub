/** QL-342 owner-imported status is display-only, never a login or authority grant. */
export type Ql342Preflight={schema:'rosevear.hub.ql342.owner-preflight.v1';
  state:'ORIGINAL_OWNER_CEREMONY_AND_DB_AUTHORITY_REVIEW_REQUIRED';
  candidateFileCount:number;evidenceDirectoryPresent:boolean;
  signedEnrollmentPresent:boolean;approvedPublicPinsPresent:boolean;
  privateCredentialEncryptedOnDisk:boolean;
  databaseEnrollmentVerified:false;oneHeldTestReceiptVerified:false;
  receiverActivated:false;customerCommunications:false;deviceActions:false;
  computer:string;localListenerCount:0;nextAction:string};

export function parseQl342Preflight(input:unknown):Ql342Preflight{
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('INVALID_OWNER_PREFLIGHT');
  const p=input as Partial<Ql342Preflight>;
  if(p.schema!=='rosevear.hub.ql342.owner-preflight.v1'||
    p.state!=='ORIGINAL_OWNER_CEREMONY_AND_DB_AUTHORITY_REVIEW_REQUIRED'||
    p.computer!=='DESKTOP-AE894KC'||p.localListenerCount!==0||
    !Number.isSafeInteger(p.candidateFileCount)||p.candidateFileCount===undefined||
    p.candidateFileCount<0||
    (p.candidateFileCount??4)>3||
    typeof p.evidenceDirectoryPresent!=='boolean'||
    typeof p.signedEnrollmentPresent!=='boolean'||
    typeof p.approvedPublicPinsPresent!=='boolean'||
    typeof p.privateCredentialEncryptedOnDisk!=='boolean'||
    p.databaseEnrollmentVerified!==false||p.oneHeldTestReceiptVerified!==false||
    p.receiverActivated!==false||p.customerCommunications!==false||p.deviceActions!==false||
    typeof p.nextAction!=='string'||p.nextAction.length>220)
    throw Error('DENY_UNSCOPED_OR_ACTIVATED_OWNER_PREFLIGHT');
  return p as Ql342Preflight;
}
