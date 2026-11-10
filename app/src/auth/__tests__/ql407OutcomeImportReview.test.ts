import {describe,expect,it} from 'vitest';
import {QL375_SHELLS} from '../ql375OwnerStatus';
import {reviewQl407OutcomeImport} from '../ql407OutcomeImportReview';

const now=Date.parse('2026-11-10T12:00:00.000Z');
const packet={sourceId:'yw',caseId:'case_ql407_001',
  reviewedAt:'2026-11-09T12:00:00.000Z',expiresAt:'2026-11-15T12:00:00.000Z',
  disposition:'ACCEPTED_FOR_REVIEW',verifiedByProtectedServer:true,projectionVersion:1};

describe('QL-407 redacted protected outcome projection, operator routing and alerts',()=>{
  it('keeps all six unimported sources on HOLD without any side effect',()=>{
    for(const source of QL375_SHELLS){
      expect(reviewQl407OutcomeImport(source.id,[],now)).toMatchObject({
        connection:'HOLD',authorizedTest:false,receiverActivated:false,
        networkRequests:0,persisted:false,credentialsDisclosed:false,
        exceptions:['MISSING_PROTECTED_IMPORT']});
    }
  });
  it('does not promote even a valid server-reviewed projection to connection trust',()=>{
    expect(reviewQl407OutcomeImport('yw',[packet],now)).toMatchObject({
      connection:'HOLD',authorizedTest:false,
      exceptions:['ADDITIONAL_GATES_REQUIRED'],priority:'OWNER_FOLLOW_UP'});
  });
  it('flags expired, soon-to-expire, future and rejected outcomes',()=>{
    expect(reviewQl407OutcomeImport('yw',[{...packet,expiresAt:'2026-11-10T12:00:00.000Z'}],now)
      .exceptions).toContain('EVIDENCE_EXPIRED');
    expect(reviewQl407OutcomeImport('yw',[{...packet,expiresAt:'2026-11-11T12:00:00.000Z'}],now)
      .exceptions).toContain('REVIEW_DUE_SOON');
    expect(reviewQl407OutcomeImport('yw',[{...packet,reviewedAt:'2026-11-12T12:00:00.000Z'}],now)
      .exceptions).toContain('FUTURE_REVIEW');
    expect(reviewQl407OutcomeImport('yw',[{...packet,disposition:'REJECTED'}],now)
      .exceptions).toContain('REVIEW_REJECTED');
  });
  it('rejects foreign, unverified, malformed, duplicated and secret-bearing projections',()=>{
    for(const record of [
      {...packet,sourceId:'icamp'},
      {...packet,verifiedByProtectedServer:false},
      {...packet,caseId:'../unsafe'},
      {...packet,expiresAt:'wrong'},
      {...packet,privateKey:'do-not-import'},
      {...packet,projectionVersion:2}
    ]){
      const result=reviewQl407OutcomeImport('yw',[record],now);
      expect(result.connection).toBe('HOLD');
      expect(result.priority).toBe('REVIEW_NOW');
    }
    expect(reviewQl407OutcomeImport('yw',[packet,packet],now)
      .exceptions).toContain('INVALID_PROJECTION');
    expect(reviewQl407OutcomeImport('yw',[null],now)
      .exceptions).toContain('INVALID_PROJECTION');
  });
});
