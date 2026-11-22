import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createQl484PrivateReviewHttpsServer,QL484_REVIEW_PATH,
 QL484_HTTPS_BOUNDARY} from './ql484-private-field-https.mjs';
test('QL484 private endpoint only supports explicitly supplied mTLS material and field reviewer',()=>{
 assert.throws(()=>createQl484PrivateReviewHttpsServer(),
  /QL484_PRIVATE_MUTUAL_TLS_AND_REVIEW_REQUIRED/);
 assert.throws(()=>createQl484PrivateReviewHttpsServer({tlsOptions:{
  key:'key',cert:'cert',ca:'ca'}}),/QL484_PRIVATE_MUTUAL_TLS_AND_REVIEW_REQUIRED/);
 assert.equal(typeof createQl484PrivateReviewHttpsServer,'function');
 assert.equal(QL484_HTTPS_BOUNDARY.autoListen,false);
 assert.equal(QL484_HTTPS_BOUNDARY.publicRoute,false);
 assert.equal(QL484_REVIEW_PATH,'/internal/comms/ql484/field/review');
});
