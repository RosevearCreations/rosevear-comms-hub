import {describe,expect,it} from 'vitest';
import {QL265_SOURCE_APPS,ql265EvaluateLocalGuard,ql265RunLocalSixAppPreflight} from '../ql265LocalSixAppPreflight';

describe('QL-265 six-app local-only connection contract',()=>{
  it('includes six distinct source repositories and their I.T. routes',()=>{
    expect(QL265_SOURCE_APPS).toHaveLength(6);
    expect(new Set(QL265_SOURCE_APPS.map(x=>x.repo)).size).toBe(6);
    expect(QL265_SOURCE_APPS.every(x=>x.ui.length>0)).toBe(true);
  });
  it('fails closed if any security guard fails',()=>{
    const valid={authenticated:true,correctSource:true,isolatedTenant:true,
      withinWindow:true,readOnlyScope:true,freshRequest:true,pinnedSource:true};
    expect(ql265EvaluateLocalGuard(valid)).toBe(true);
    for(const key of Object.keys(valid) as (keyof typeof valid)[]){
      expect(ql265EvaluateLocalGuard({...valid,[key]:false})).toBe(false);
    }
  });
  it('runs 54 synthetic cases but zero authenticated GETs or owner grants',()=>{
    const receipt=ql265RunLocalSixAppPreflight();
    expect(receipt.scenarioCount).toBe(54);
    expect(receipt.localContractPass).toBe(true);
    expect(receipt.rows.every(x=>x.syntheticDenials.length===7)).toBe(true);
    expect(receipt.rows.every(x=>x.integration==='DISCONNECTED / HOLD')).toBe(true);
    expect(receipt.networkRequests).toBe(0);
    expect(receipt.actualAuthenticatedGets).toBe(0);
    expect(receipt.externalSignerVerified).toBe(false);
    expect(receipt.ownerTestAuthorized).toBe(false);
  });
});
