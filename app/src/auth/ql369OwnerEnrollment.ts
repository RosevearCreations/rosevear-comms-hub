/** QL-369 narrow authenticated owner Edge Function bridge. No direct DB writes,
 * service keys, privileged RPC, signed decisions or automatic enrollment. */
export const QL369_SHA256 = /^[a-f0-9]{64}$/;
export const QL369_FUNCTION = 'ql369-owner-enrollment';

export type OwnerCeremonyReply = {
  state: string;
  activated?: boolean;
  ownerRole?: string;
  expiresAt?: string;
};
export type OwnerCeremonyGateway = {
  functions: { invoke: (name: string, options: { body: object }) =>
    Promise<{ data: unknown; error: unknown }> };
};
type Outcome = { ok: boolean; status: string; activated: boolean; expiresAt?: string };
const denied = (): Outcome => ({ok:false,status:'HOLD_QL369_AUTHENTICATED_OWNER_CEREMONY_NOT_COMPLETE',activated:false});

async function call(gateway: OwnerCeremonyGateway,body: object): Promise<Outcome> {
  try {
    const {data,error} = await gateway.functions.invoke(QL369_FUNCTION,{body});
    const reply = data as OwnerCeremonyReply | null;
    if (error || !reply || typeof reply.state!=='string' ||
      !/^(OWNER_AAL2_ATTESTED_PENDING_PEER_AND_ORIGINAL_SIGNATURES|DUAL_ORIGINAL_OWNER_MEMBERSHIPS_ACTIVE)$/.test(reply.state) ||
      (reply.state==='DUAL_ORIGINAL_OWNER_MEMBERSHIPS_ACTIVE' && reply.activated!==true) ||
      (reply.state==='OWNER_AAL2_ATTESTED_PENDING_PEER_AND_ORIGINAL_SIGNATURES' && reply.activated===true))
      return denied();
    const activated = reply.state==='DUAL_ORIGINAL_OWNER_MEMBERSHIPS_ACTIVE' && reply.activated===true;
    return {ok:true,status:reply.state,activated,expiresAt:reply.expiresAt};
  } catch {return denied();}
}

export function attestOwnerMfa(gateway: OwnerCeremonyGateway,intentSha256:string):Promise<Outcome>{
  if(!QL369_SHA256.test(intentSha256)||intentSha256==='0'.repeat(64))return Promise.resolve(denied());
  return call(gateway,{action:'attest',intentSha256});
}

export async function activateDualOwnerFromFiles(gateway:OwnerCeremonyGateway,
  signed:File|null,source:File|null,master:File|null):Promise<Outcome>{
  if(!signed||!source||!master||
    [signed,source,master].some(f=>f.size<10||f.size>32768||!f.name.toLowerCase().endsWith('.json')))
    return denied();
  try{
    const [signedText,sourceCandidateText,masterCandidateText]=await Promise.all([
      signed.text(),source.text(),master.text()]);
    if(!signedText||!sourceCandidateText||!masterCandidateText)return denied();
    const signedPacket=JSON.parse(signedText) as unknown;
    if(!signedPacket||typeof signedPacket!=='object'||Array.isArray(signedPacket))return denied();
    return call(gateway,{action:'activate',signedPacket,sourceCandidateText,masterCandidateText});
  }catch{return denied();}
}
