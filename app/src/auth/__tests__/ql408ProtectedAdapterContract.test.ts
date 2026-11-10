import {describe,expect,it} from 'vitest';
import {QL375_SHELLS} from '../ql375OwnerStatus';
import {QL408_AUDIT_GATES,reviewQl408AdapterContract} from '../ql408ProtectedAdapterContract';

const now=Date.parse('2026-11-10T16:00:00.000Z');
const complete={contractVersion:1,sourceId:'yw',caseId:'case_ql408_one',
  purpose:'ONE_TEST_READINESS_REVIEW',generatedAt:'2026-11-10T15:00:00.000Z',
  expiresAt:'2026-11-10T18:00:00.000Z',audit:QL408_AUDIT_GATES.map(gate=>({
    code:gate.code,state:'VERIFIED',reference:`audit_${gate.code}_one`}))};

describe('QL-408 protected adapter contract is not an authentication authority',()=>{
  it('maps all seven receiver audit gates to independent custodians',()=>{
    expect(new Set(QL408_AUDIT_GATES.map(item=>item.code)).size).toBe(7);
    for(const source of QL375_SHELLS){
      const result=reviewQl408AdapterContract(source.id,null,now);
      expect(result).toMatchObject({connection:'HOLD',oneTestAuthorized:false,
        receiverEnabled:false,networkRequests:0,persisted:false,
        credentialsDisclosed:false,exceptions:[
          'NO_AUTHENTICATED_ADAPTER','ONE_TEST_AUTHORIZATION_UNAVAILABLE']});
      expect(result.gateMap).toHaveLength(7);
      expect(result.gateMap.every(gate=>gate.state==='HOLD')).toBe(true);
    }
  });
  it('keeps even seven claimed VERIFIED gates and matching source on HOLD',()=>{
    const result=reviewQl408AdapterContract('yw',complete,now);
    expect(result.contractState).toBe('STRUCTURE_REVIEW_ONLY');
    expect(result.exceptions).toEqual(['ONE_TEST_AUTHORIZATION_UNAVAILABLE']);
    expect(result.oneTestAuthorized).toBe(false);
    expect(result.connection).toBe('HOLD');
  });
  it('rejects foreign source, duplicates, extra secrets and incomplete audit',()=>{
    for(const [claim,expected] of [
      [{...complete,sourceId:'icamp'},'CROSS_SOURCE_PROJECTION'],
      [{...complete,secret:'private'},'INVALID_ADAPTER_CONTRACT'],
      [{...complete,audit:complete.audit.slice(1)},'INCOMPLETE_AUDIT'],
      [{...complete,audit:[...complete.audit.slice(0,6),complete.audit[0]]},'INVALID_ADAPTER_CONTRACT'],
      [{...complete,audit:complete.audit.map((gate,index)=>index===0?
        {...gate,reference:null}:gate)},'INVALID_ADAPTER_CONTRACT'],
      [{...complete,generatedAt:'bad-date'},'INVALID_ADAPTER_CONTRACT']
    ] as const){
      const result=reviewQl408AdapterContract('yw',claim,now);
      expect(result.exceptions).toContain(expected);
      expect(result.oneTestAuthorized).toBe(false);
    }
  });
  it('flags expired, future and explicit HOLD audit claims',()=>{
    expect(reviewQl408AdapterContract('yw',
      {...complete,expiresAt:'2026-11-10T15:30:00.000Z'},now).exceptions)
      .toContain('STALE_PROJECTION');
    expect(reviewQl408AdapterContract('yw',
      {...complete,generatedAt:'2026-11-10T17:00:00.000Z'},now).exceptions)
      .toContain('STALE_PROJECTION');
    expect(reviewQl408AdapterContract('yw',
      {...complete,audit:complete.audit.map((gate,index)=>index===0?
        {...gate,state:'HOLD'}:gate)},now).exceptions).toContain('AUDIT_HOLD');
  });
});
