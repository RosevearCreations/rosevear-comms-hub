import {describe,expect,it,vi} from 'vitest';
import {activateDualOwnerFromFiles,attestOwnerMfa,QL369_FUNCTION,type OwnerCeremonyGateway}
  from '../ql369OwnerEnrollment';

const sha='ab'.repeat(32);
const gateway=(data:unknown,error:unknown=null)=>({functions:{invoke:vi.fn().mockResolvedValue({data,error})}});
const file=(name:string,body:string)=>({name,size:body.length,text:async()=>body}) as File;

describe('QL-369 explicit owner ceremony',()=>{
  it('requires exact intent SHA before any network call',async()=>{
    const client=gateway({state:'OWNER_AAL2_ATTESTED_PENDING_PEER_AND_ORIGINAL_SIGNATURES'});
    expect((await attestOwnerMfa(client,'bad')).ok).toBe(false);
    expect((await attestOwnerMfa(client,'0'.repeat(64))).ok).toBe(false);
    expect(client.functions.invoke).not.toHaveBeenCalled();
  });

  it('attests only current owner session with one approved Edge function and no DB credentials',async()=>{
    const client=gateway({state:'OWNER_AAL2_ATTESTED_PENDING_PEER_AND_ORIGINAL_SIGNATURES',
      expiresAt:'2026-11-08T18:00:00Z'});
    const result=await attestOwnerMfa(client as OwnerCeremonyGateway,sha);
    expect(result.ok).toBe(true);expect(result.activated).toBe(false);
    expect(client.functions.invoke).toHaveBeenCalledWith(QL369_FUNCTION,
      {body:{action:'attest',intentSha256:sha}});
  });

  it('does not trust rejected, malformed or network-failed activation responses',async()=>{
    for(const client of [gateway(null,{message:'denied'}),gateway({state:'ENROLLED',activated:true}),
      gateway({state:'DUAL_ORIGINAL_OWNER_MEMBERSHIPS_ACTIVE',activated:false})]){
      const result=await attestOwnerMfa(client,sha);
      expect(result.ok).toBe(false);
      expect(result.activated).toBe(false);
    }
    const unavailable={functions:{invoke:vi.fn().mockRejectedValue(Error('offline'))}};
    expect((await attestOwnerMfa(unavailable,sha)).ok).toBe(false);
  });

  it('requires explicit three small JSON uploads before activation',async()=>{
    const client=gateway({state:'DUAL_ORIGINAL_OWNER_MEMBERSHIPS_ACTIVE',activated:true});
    expect((await activateDualOwnerFromFiles(client,null,null,null)).activated).toBe(false);
    expect((await activateDualOwnerFromFiles(client,file('signed.txt','{}'),null,null)).ok).toBe(false);
    expect((await activateDualOwnerFromFiles(client,file('signed.json','bad-json'),
      file('ree.json','public candidate'),file('jack.json','public candidate'))).ok).toBe(false);
    expect(client.functions.invoke).not.toHaveBeenCalled();
    const signed={schema:'original',intent:{sourceUserId:'only_server_decides'}};
    const result=await activateDualOwnerFromFiles(client,
      file('signed.json',JSON.stringify(signed)),file('ree.json','original public evidence'),
      file('jack.json','original public evidence'));
    expect(result.activated).toBe(true); // Only a real server response can claim success.
    expect(client.functions.invoke).toHaveBeenCalledWith(QL369_FUNCTION,{body:{
      action:'activate',signedPacket:signed,
      sourceCandidateText:'original public evidence',masterCandidateText:'original public evidence'}});
  });
});
