import {describe,expect,it} from 'vitest';
import {MASTER_ROUTING_PATTERNS,reviewRoutingDraft,type RouteDraft} from '../ql387MasterShellRouting';
const base:RouteDraft={sources:['yw'],targets:['rosiedazzlers'],shape:'one-to-one',purpose:'communications',tenantScope:'shell',sourceApproved:true,targetApproved:true};
describe('QL-387 read-only routing and authorization boundaries',()=>{
  it('documents all cardinalities but never turns a matching route into a live authorization',()=>{
    expect(MASTER_ROUTING_PATTERNS.map(item=>item.shape)).toEqual(['one-to-one','one-to-many','many-to-one','many-to-many']);
    expect(reviewRoutingDraft(base).state).toBe('DESIGN_ONLY');
    expect(reviewRoutingDraft({...base,sources:['yw','icamp'],shape:'many-to-one'}).state).toBe('DESIGN_ONLY');
    expect(reviewRoutingDraft({...base,targets:['icamp','rosiedazzlers'],shape:'one-to-many'}).state).toBe('DESIGN_ONLY');
    expect(reviewRoutingDraft({...base,sources:['yw','icamp'],targets:['rosiedazzlers','devilndove'],shape:'many-to-many'}).state).toBe('DESIGN_ONLY');
  });
  it('denies unknown identity, tenant scope, duplicate and cardinality drift',()=>{
    expect(reviewRoutingDraft({...base,sources:['rosevear-landscaping']}).state).toBe('DENIED');
    expect(reviewRoutingDraft({...base,tenantScope:'customer'}).state).toBe('DENIED');
    expect(reviewRoutingDraft({...base,sources:['yw','yw'],shape:'many-to-one'}).state).toBe('DENIED');
    expect(reviewRoutingDraft({...base,shape:'one-to-many'}).state).toBe('DENIED');
    expect(reviewRoutingDraft({...base,targets:['yw']}).state).toBe('DENIED');
  });
  it('requires independent endpoint approvals and preserves AI Data Platform monitoring ownership',()=>{
    expect(reviewRoutingDraft({...base,sourceApproved:false}).state).toBe('DENIED');
    expect(reviewRoutingDraft({...base,targetApproved:false}).state).toBe('DENIED');
    expect(reviewRoutingDraft({...base,purpose:'monitoring'}).state).toBe('DENIED');
    const monitoring=reviewRoutingDraft({...base,purpose:'monitoring',targets:['ai-data-platform']});
    expect(monitoring.state).toBe('DESIGN_ONLY');
    expect(monitoring.reason).toContain('no transport');
  });
});
