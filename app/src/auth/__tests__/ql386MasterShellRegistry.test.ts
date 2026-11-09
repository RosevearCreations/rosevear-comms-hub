import {describe,expect,it} from 'vitest';
import {MASTER_SHELL_REGISTRY,reconcileSourceIdentities} from '../ql386MasterShellRegistry';

describe('QL-386 Master Shell identity reconciliation',()=>{
  const claims=MASTER_SHELL_REGISTRY.map(({id,repository,handler})=>({sourceId:id,repository,handler}));
  it('has exactly six immutable platform/source identities with expected handlers',()=>{
    expect(MASTER_SHELL_REGISTRY.map(item=>item.id)).toEqual([
      'yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub']);
    expect(new Set(MASTER_SHELL_REGISTRY.map(item=>item.repository)).size).toBe(6);
    expect(MASTER_SHELL_REGISTRY.find(item=>item.id==='yw')?.boundary).toContain('not Rosevear Landscaping');
    expect(MASTER_SHELL_REGISTRY.find(item=>item.id==='icamp')?.boundary).toContain('not Camp Rosevear');
    expect(MASTER_SHELL_REGISTRY.every(item=>item.identityScope==='shell')).toBe(true);
  });
  it('treats matching metadata as identity only, never live connection evidence',()=>{
    const results=reconcileSourceIdentities(claims);
    expect(results).toHaveLength(6);
    expect(results.every(result=>result.state==='MATCH')).toBe(true);
    expect(results.every(result=>result.reason.includes('unverified'))).toBe(true);
    expect(reconcileSourceIdentities([]).every(result=>result.state==='MISSING')).toBe(true);
  });
  it('detects missing, duplicate, drifted and unknown source claims',()=>{
    expect(reconcileSourceIdentities([...claims,claims[0]]).find(item=>item.sourceId==='yw')?.state).toBe('DUPLICATE');
    expect(reconcileSourceIdentities(claims.map(item=>item.sourceId==='icamp'?{...item,repository:'wrong'}:item))
      .find(item=>item.sourceId==='icamp')?.state).toBe('DRIFT');
    expect(reconcileSourceIdentities([...claims,{sourceId:'rosevear-landscaping',repository:'x',handler:'y'}])
      .find(item=>item.sourceId==='rosevear-landscaping')?.state).toBe('DRIFT');
    expect(reconcileSourceIdentities(claims.slice(1)).find(item=>item.sourceId==='yw')?.state).toBe('MISSING');
  });
});
