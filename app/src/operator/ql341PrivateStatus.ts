import {QL270_PROOF_SNAPSHOT,QL270_SOURCES,type Ql270SourceId} from './ql270ConnectionCentre';

export type Ql341Peer={peerId:Ql270SourceId;kind:'business'|'support';repository:string;
  connection:'DISCONNECTED / HOLD';sourceTestAuthorized:false;customerDataAllowed:false};
export type Ql341Snapshot={schema:'rosevear.hub.ql341.private-peer-readback.v1';
  exportedAt:string;source:'PRIVATE_POSTGRES_OWNER_READBACK';peerCount:6;connectedCount:0;
  customerCommunications:0;deviceActions:0;authorizedExternalGets:0;
  heldDeviceReceiptCount:number;peers:Ql341Peer[];
  witness:{state:string;verified:boolean;connected:false;receivedAt?:string;freshness?:string}};

const expected=new Map(QL270_SOURCES.map(source=>[source.id,{
  kind:source.kind==='Business app'?'business':'support',
  repository:QL270_PROOF_SNAPSHOT.find(row=>row.source===source.id)?.repo
}]));
export const QL341_SIX_PEERS=QL270_SOURCES.map(source=>({
  ...source,repository:expected.get(source.id)?.repository??'',
  connection:'DISCONNECTED / HOLD' as const,customerDataAllowed:false as const,
  sourceTestAuthorized:false as const
}));

/** A nonsecret owner-imported file can only describe a HELD TEST readback.
 * It is never a browser authentication grant or proof of source connectivity. */
export function ql341ParsePrivateReadback(value:unknown):Ql341Snapshot{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('INVALID_PRIVATE_READBACK');
  const snap=value as Partial<Ql341Snapshot>;
  if(snap.schema!=='rosevear.hub.ql341.private-peer-readback.v1'||
    snap.source!=='PRIVATE_POSTGRES_OWNER_READBACK'||
    snap.peerCount!==6||snap.connectedCount!==0||
    snap.customerCommunications!==0||snap.deviceActions!==0||
    snap.authorizedExternalGets!==0||
    !Number.isSafeInteger(snap.heldDeviceReceiptCount)||
    (snap.heldDeviceReceiptCount??-1)<0||
    typeof snap.exportedAt!=='string'||
    !Number.isFinite(Date.parse(snap.exportedAt))||
    Date.parse(snap.exportedAt)>Date.now()+60_000||
    !Array.isArray(snap.peers)||snap.peers.length!==6)
    throw Error('DENY_UNVERIFIED_OR_ELEVATED_PRIVATE_READBACK');
  const seen=new Set<string>();
  for(const peer of snap.peers){
    const planned=expected.get(peer?.peerId);
    if(!planned||seen.has(peer.peerId)||peer.kind!==planned.kind||
      peer.repository!==planned.repository||peer.connection!=='DISCONNECTED / HOLD'||
      peer.sourceTestAuthorized!==false||peer.customerDataAllowed!==false)
      throw Error('DENY_UNRECOGNIZED_OR_CONNECTED_PEER');
    seen.add(peer.peerId);
  }
  if(seen.size!==6||snap.witness?.connected!==false||
    typeof snap.witness.verified!=='boolean'||
    typeof snap.witness.state!=='string')throw Error('DENY_UNREVIEWED_TEST_WITNESS');
  if(snap.witness.verified){
    if(snap.witness.state!=='ORIGINAL_SIGNED_TEST_HEARTBEAT_AND_DB_RECEIPT_VERIFIED'||
      !snap.heldDeviceReceiptCount||
      !['RECENT_TEST_ONLY','HISTORICAL_TEST_ONLY'].includes(snap.witness.freshness??'')||
      !Number.isFinite(Date.parse(snap.witness.receivedAt??'')))
      throw Error('DENY_UNMATCHED_ORIGINAL_DEVICE_WITNESS');
  }else if(!['NOT_OBSERVED_NO_ORIGINAL_SIGNED_TEST_PACKET',
    'HOLD_NO_UNIQUE_POSTGRES_RECEIPT','DENY_POSTGRES_RECEIPT_CONTENT_MISMATCH',
    'HOLD_ORIGINAL_OWNER_ENROLLMENT_MISSING_OR_REVOKED',
    'DENY_ORIGINAL_DEVICE_SIGNATURE_OR_SCOPE',
    'HOLD_UNEXPECTED_OR_MISSING_ORIGINAL_DEVICE_PACKET'].includes(snap.witness.state)){
    throw Error('DENY_UNKNOWN_WITNESS_STATE');
  }
  return snap as Ql341Snapshot;
}
