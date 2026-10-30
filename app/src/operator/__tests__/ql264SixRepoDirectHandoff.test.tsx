// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it,vi} from 'vitest';
import {Ql264SixRepoDirectHandoff} from '../Ql264SixRepoDirectHandoff';
import {QL264_GUIDE_PATH,QL264_REPO_OBSERVATIONS,QL264_TEST_SLOT,
  ql264ClassifyReceipt,ql264GuideUrl,ql264SixAppCoordinationReport}
  from '../ql264SixRepoDirectHandoff';

describe('QL-264 six direct GitHub source handoffs and original private security gate',()=>{
  it('maps exactly six app-local Markdown guides, using main not a guessed branch',()=>{
    const report=ql264SixAppCoordinationReport();
    expect(report.sourceRepositoryHandoffs).toBe(6);
    expect(QL264_REPO_OBSERVATIONS).toHaveLength(6);
    expect(new Set(QL264_REPO_OBSERVATIONS.map(row=>row.repository)).size).toBe(6);
    expect(report.rows.map(row=>row.directGitHubGuide)).toEqual(
      report.rows.map(row=>ql264GuideUrl(row.repository)));
    expect(report.rows.every(row=>row.directGitHubGuide.endsWith(`/blob/main/${QL264_GUIDE_PATH}`)))
      .toBe(true);
    expect(()=>ql264GuideUrl('unknown')).toThrow();
    expect(report.rows.find(row=>row.system==='yw')?.sourceSpecificAction)
      .toContain('nonproduction Supabase');
    expect(report.rows.find(row=>row.system==='rosevear-ai-hub')?.sourceSpecificAction)
      .toContain('relay stays OFF');
  });
  it('does not turn an original owner status packet into a signed private receipt',()=>{
    const report=ql264SixAppCoordinationReport();
    expect(report.originalOwnerSelfReports).toBe(1);
    expect(report.originalRosiePacketSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.authenticatedPrivateRoleDecisions).toBe(0);
    expect(report.verifiedSignedProofs).toBe(0);
    expect(report.verifiedNonproductionTenants).toBe(0);
    expect(report.authenticatedOwnerTestApprovals).toBe(0);
    expect(report.actualGatewayGets).toBe(0);
    expect(report.livePilotHolds).toBe(12);
    expect(report.integration).toBe('DISCONNECTED / HOLD');
    expect(report.rows.every(row=>row.originalProofAtHistoricalSha==='HTTP_404')).toBe(true);
  });
  it('never authenticates a fabricated owner approval or HTTP 200 public text',()=>{
    const sourceA='a'.repeat(40);const proofB='b'.repeat(40);
    const report=ql264ClassifyReceipt({publicFileStatus:'HTTP_200',sourceA,proofB,
      independentPrivateReceipt:true,ownerReportsTestApproved:true});
    expect(report.sourceCommitStructure).toBe('TWO_DISTINCT_SHA_FORMATS_ONLY');
    expect(report.realSignatureAndIndependentPin).toBe('NOT_VERIFIED');
    expect(report.independentSignerWitnessReviewer).toBe('NOT_VERIFIED');
    expect(report.authenticatedOwnerTestAuthorization).toBe('NOT_GIVEN');
    expect(report.currentDecision).toBe('DISCONNECTED / HOLD');
    expect(ql264ClassifyReceipt({publicFileStatus:'HTTP_404',sourceA,proofB:sourceA})
      .sourceCommitStructure).toBe('NOT_SHOWN');
  });
  it('retains a 9-GET, 15-minute, 7-denial proposal that cannot run',()=>{
    expect(QL264_TEST_SLOT.maxRequestsPerApp).toBe(9);
    expect(QL264_TEST_SLOT.maxWindowMinutes).toBe(15);
    expect(QL264_TEST_SLOT.positiveReadOnlyPaths).toEqual(['/health','/capabilities']);
    expect(QL264_TEST_SLOT.negativeOnlyGetCases).toHaveLength(7);
    expect(QL264_TEST_SLOT.authenticatedGatewayRequests).toBe(0);
    expect(QL264_TEST_SLOT.executed).toBe(false);
    expect(QL264_TEST_SLOT.ownerTestAuthorization).toBe('NOT_GIVEN');
    expect(QL264_TEST_SLOT.testSlot).toBe('HELD_UNSCHEDULED');
    expect(QL264_TEST_SLOT.privateRelay).toBe(false);
  });
  it('renders linked guides and an offline review without fetch or persistence',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
    const host=document.createElement('div');document.body.append(host);
    const root=createRoot(host);
    const fetchSpy=vi.spyOn(globalThis,'fetch');
    const setItemSpy=vi.spyOn(Storage.prototype,'setItem');
    try{
      await act(async()=>root.render(<Ql264SixRepoDirectHandoff/>));
      const panel=host.querySelector('[data-ql264-release]')!;
      expect(panel.querySelectorAll('tbody tr')).toHaveLength(6);
      expect(panel.querySelectorAll('a[href*="github.com/RosevearCreations/"]')).toHaveLength(6);
      expect(panel.textContent).toContain('DISCONNECTED / HOLD');
      await act(async()=>{
        Array.from(panel.querySelectorAll('button')).find(b=>b.textContent?.includes('Review conditional'))!.click();
      });
      const text=panel.querySelector<HTMLTextAreaElement>('[aria-label="QL-264 six-source coordination report"]')!.value;
      const report=JSON.parse(text);
      expect(report.conditionalSlotReview).toBe('OFFLINE_REVIEWED_NOT_AUTHORIZED');
      expect(report.proposedSlot.authenticatedGatewayRequests).toBe(0);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(setItemSpy).not.toHaveBeenCalled();
    }finally{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();}
  });
});
