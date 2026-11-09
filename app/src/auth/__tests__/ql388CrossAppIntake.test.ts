import {describe,expect,it} from 'vitest';
import {QL388_EXAMPLE_EVENT,QL388_CONTRACT_VERSION,reviewCrossAppIntake} from '../ql388CrossAppIntake';

describe('QL-388 cross-application notification and incident intake contract',()=>{
  it('recognizes the exact v1 envelope for both kinds without authorizing intake',()=>{
    expect(reviewCrossAppIntake(QL388_EXAMPLE_EVENT)).toMatchObject({state:'DESIGN_ONLY',sourceId:'yw',kind:'incident'});
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,kind:'notification',severity:'info'}).state).toBe('DESIGN_ONLY');
    expect(reviewCrossAppIntake(QL388_EXAMPLE_EVENT).reason).toContain('transport remain unverified');
    expect(QL388_CONTRACT_VERSION).toBe('rosevear.comms.intake.v1');
  });
  it('rejects unregistered, tenant-level and wrong-destination messages',()=>{
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,sourceId:'rosevear-landscaping'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,tenantScope:'customer'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,destinationId:'ai-data-platform'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,contractVersion:'v2'}).state).toBe('DENIED');
  });
  it('refuses arbitrary sensitive payloads, free-form text and externally supplied URLs',()=>{
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,customer:{email:'private@example.com'}}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,summary:'A customer called'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,eventCode:'Customer name'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,evidenceRefs:['https://example.test/private']}).state).toBe('DENIED');
  });
  it('rejects malformed IDs, categories, evidence references, and timestamps',()=>{
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,messageId:'x'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,category:'module_completion'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,evidenceRefs:['release:QL388DEMO0001','release:QL388DEMO0001']}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,occurredAt:'yesterday'}).state).toBe('DENIED');
    expect(reviewCrossAppIntake({...QL388_EXAMPLE_EVENT,evidenceRefs:[]}).state).toBe('DESIGN_ONLY');
    expect(reviewCrossAppIntake(null).state).toBe('DENIED');
  });
});
