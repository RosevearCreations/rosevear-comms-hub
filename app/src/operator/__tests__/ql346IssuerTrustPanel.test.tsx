// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,expect,it} from 'vitest';
import {Ql346IssuerTrustPanel,parseQl346Readback} from '../Ql346IssuerTrustPanel';

const packet={schema:'rosevear.hub.ql346.offline-test-readiness.v1',
  state:'CRYPTOGRAPHIC_TEST_PROOFS_VALID_INDEPENDENT_ISSUER_CUSTODY_AND_FIELD_WITNESS_HOLD',
  issuerSignatureCryptographicallyValid:true,devicePinMatches:true,
  originalIssuerIndependentlyAuthenticated:false,
  originalIssuerOutOfBandCustodyApproved:false,
  sourceOwnerTestSignatureValid:true,masterOwnerTestSignatureValid:true,
  readyForDatabaseEnrollment:false,independentHumanReviewRequired:true,
  originalReceiverStopped:false,receiverActivated:false,
  databaseEnrollmentCreated:false,connected:false,
  networkRequests:0,customerCommunications:false,deviceActions:false};

it('no imported format-only readback may assert issuer custody, receiver activation or enrollment',()=>{
  expect(parseQl346Readback(packet).readyForDatabaseEnrollment).toBe(false);
  for(const mutation of [{originalIssuerIndependentlyAuthenticated:true},
    {originalIssuerOutOfBandCustodyApproved:true},
    {readyForDatabaseEnrollment:true},{independentHumanReviewRequired:false},
    {originalReceiverStopped:true},{receiverActivated:true},
    {databaseEnrollmentCreated:true},{connected:true},{networkRequests:1},
    {customerCommunications:true},{deviceActions:true},
    {state:'READY_FOR_PRODUCTION'}])
    expect(()=>parseQl346Readback({...packet,...mutation})).toThrow();
});

let root:Root,host:HTMLDivElement;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql346IssuerTrustPanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

it('shows modern guided offline issuer/owner preflight without an activation control',()=>{
  const panel=host.querySelector('[data-ql346="offline-issuer-trust"]')!;
  expect(panel).not.toBeNull();
  expect(panel.textContent).toContain('CONTROLLED TEST · HOLD');
  expect(panel.querySelectorAll('ol li')).toHaveLength(4);
  expect(panel.textContent).toContain('--sign-once');
  expect(panel.textContent).toContain('--verify-issuer');
  expect(panel.textContent).toContain('--preflight');
  expect(panel.textContent).toContain('--send-once');
  expect(panel.querySelector('button')).toBeNull();
  expect(panel.querySelector('input[type="file"]')).not.toBeNull();
});
