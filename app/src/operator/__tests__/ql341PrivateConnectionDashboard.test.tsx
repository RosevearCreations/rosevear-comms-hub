// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {Ql341PrivateConnectionDashboard} from '../Ql341PrivateConnectionDashboard';
import {QL341_SIX_PEERS,ql341ParsePrivateReadback} from '../ql341PrivateStatus';

const base={schema:'rosevear.hub.ql341.private-peer-readback.v1',
  exportedAt:new Date().toISOString(),source:'PRIVATE_POSTGRES_OWNER_READBACK',
  peerCount:6,connectedCount:0,customerCommunications:0,deviceActions:0,
  authorizedExternalGets:0,heldDeviceReceiptCount:0,
  peers:QL341_SIX_PEERS.map(p=>({peerId:p.id,
    kind:p.kind==='Business app'?'business':'support',repository:p.repository,
    connection:'DISCONNECTED / HOLD',sourceTestAuthorized:false,customerDataAllowed:false})),
  witness:{state:'NOT_OBSERVED_NO_ORIGINAL_SIGNED_TEST_PACKET',verified:false,connected:false}};

describe('QL-341 six-app private connection truth',()=>{
  it('keeps four businesses and two supports in immutable HELD classification',()=>{
    expect(QL341_SIX_PEERS).toHaveLength(6);
    expect(QL341_SIX_PEERS.filter(p=>p.kind==='Business app')).toHaveLength(4);
    expect(QL341_SIX_PEERS.filter(p=>p.kind!=='Business app')).toHaveLength(2);
    expect(ql341ParsePrivateReadback(base).connectedCount).toBe(0);
  });
  it('rejects forged connection counts, unknown peers and false signed-witness claims',()=>{
    for(const test of [{...base,connectedCount:1},
      {...base,peers:[...base.peers.slice(0,5),{...base.peers[5],peerId:'untrusted'}]},
      {...base,peers:base.peers.map((p,i)=>i? p:{...p,customerDataAllowed:true})},
      {...base,witness:{state:'SIGNED_TEST',verified:true,connected:false}}]){
      expect(()=>ql341ParsePrivateReadback(test)).toThrow();
    }
  });
});

let root:Root;let host:HTMLDivElement;
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
  await act(async()=>root.render(<Ql341PrivateConnectionDashboard/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
it('displays six actual mapped peers and zero connections before an independently exported status file',()=>{
  const section=host.querySelector('.ql341')!;
  expect(section.getAttribute('data-ql341-transport')).toBe('owner-import-only');
  expect(section.querySelectorAll('.ql341-peer')).toHaveLength(6);
  expect(section.textContent).toContain('0 / 6 CONNECTED');
  expect(section.textContent).toContain('NO PRIVATE READBACK LOADED');
  expect(section.querySelector('input[type="file"]')).not.toBeNull();
  expect(section.textContent).toContain('No key, password, database URL');
  expect(window.localStorage.length).toBe(0);
});
