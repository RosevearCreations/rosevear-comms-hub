// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {QL341_SIX_PEERS} from '../ql341PrivateStatus';
import {parseQl348Readback,Ql348DiagnosticsPanel} from '../Ql348DiagnosticsPanel';

const snapshot={schema:'rosevear.hub.ql348.supervised-single-test-diagnostics.v1',
  state:'HOLD_ONE_INDEPENDENTLY_VERIFIED_TEST_RECEIPT_REQUIRED',
  inspectedAt:new Date().toISOString(),peerCount:6,connectedCount:0,
  singleTestReceiptVerified:false,
  singleTestReceiptState:'HOLD_OWNER_REVIEW_AND_ONE_ORIGINAL_SIGNED_PACKET_REQUIRED',
  observedHeldReceiptCount:0,privateDatabaseRoleVerified:true,
  evidenceSource:'PRIVATE_POSTGRES_READ_ONLY_NOT_BROWSER_OR_OPERATOR_ASSERTION',
  supervisedTestExecuted:false,independentIssuerAuthorityVerified:false,
  ownerApprovalGranted:false,receiverActivated:false,databaseWrites:0,
  customerCommunications:false,deviceActions:false,
  diagnostics:QL341_SIX_PEERS.map(p=>({peerId:p.id,repository:p.repository,
    kind:p.kind==='Business app'?'business':'support',state:'DISCONNECTED / HOLD',
    reason:'SOURCE_SIDE_SIGNED_TEST_HANDSHAKE_NOT_AUTHORIZED',
    sourceTestAuthorized:false,customerDataAllowed:false}))};

it('accepts six truthful held shell diagnostics but never grants source access',()=>{
  expect(parseQl348Readback(snapshot).connectedCount).toBe(0);
  for(const mutation of [{connectedCount:1},{ownerApprovalGranted:true},
    {receiverActivated:true},{singleTestReceiptVerified:true},
    {databaseWrites:1},{peerCount:5},
    {diagnostics:snapshot.diagnostics.map((v,i)=>i? v:{...v,state:'CONNECTED'})},
    {diagnostics:snapshot.diagnostics.map((v,i)=>i? v:{...v,customerDataAllowed:true})}])
    expect(()=>parseQl348Readback({...snapshot,...mutation})).toThrow();
});

let root:Root;let host:HTMLDivElement;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql348DiagnosticsPanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});

it('provides a modern six-peer operator view without a live activation control',()=>{
  const section=host.querySelector('[data-ql348="supervised-readonly"]')!;
  expect(section.querySelectorAll('.ql348-peers article')).toHaveLength(6);
  expect(section.textContent).toContain('6 / 6 HOLD');
  expect(section.textContent).toContain('No private QL-348 readback imported');
  expect(section.querySelector('input[type="file"]')).not.toBeNull();
  expect(section.querySelector('button')).toBeNull();
});
