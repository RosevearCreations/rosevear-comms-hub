// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {Ql342OwnerGatePanel} from '../Ql342OwnerGatePanel';
import {parseQl342Preflight} from '../ql342OwnerGate';

const sample={schema:'rosevear.hub.ql342.owner-preflight.v1',
  state:'ORIGINAL_OWNER_CEREMONY_AND_DB_AUTHORITY_REVIEW_REQUIRED',
  candidateFileCount:3,evidenceDirectoryPresent:true,signedEnrollmentPresent:false,
  approvedPublicPinsPresent:false,privateCredentialEncryptedOnDisk:false,
  databaseEnrollmentVerified:false,oneHeldTestReceiptVerified:false,
  receiverActivated:false,customerCommunications:false,deviceActions:false,
  computer:'DESKTOP-AE894KC',localListenerCount:0,
  nextAction:'Complete independently reviewed original QL-340B signatures and public pins'};

it('original owner field preflight is a local claim, never authorization',()=>{
  const verified=parseQl342Preflight(sample);
  expect(verified.candidateFileCount).toBe(3);
  expect(verified.signedEnrollmentPresent).toBe(false);
  expect(verified.oneHeldTestReceiptVerified).toBe(false);
  expect(verified.receiverActivated).toBe(false);
});

it('forged receiver activation, changed host, fabricated receipt or excessive candidate count are rejected',()=>{
  for(const altered of [{...sample,receiverActivated:true},
    {...sample,oneHeldTestReceiptVerified:true},
    {...sample,computer:'untrusted-remote-host'},
    {...sample,candidateFileCount:4},
    {...sample,localListenerCount:1},
    {...sample,customerCommunications:true}])
    expect(()=>parseQl342Preflight(altered)).toThrow();
});

let host:HTMLDivElement,root:Root;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql342OwnerGatePanel/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
it('shows four owner-supervised steps, safe preflight and no live receiver or source writes',()=>{
  const section=host.querySelector('.ql342')!;
  expect(section.getAttribute('data-ql342-mode')).toBe('local-import-no-network');
  expect(section.querySelectorAll('[role="listitem"]')).toHaveLength(4);
  expect(section.textContent).toContain('FIELD APPROVAL · HOLD');
  expect(section.textContent).toContain('-OwnerPreflight');
  expect(section.textContent).toContain('No original Windows preflight imported');
  expect(section.textContent).toContain('NO CUSTOMER CALLS OR SMS');
  expect(section.querySelector('input[type="file"]')).not.toBeNull();
});
