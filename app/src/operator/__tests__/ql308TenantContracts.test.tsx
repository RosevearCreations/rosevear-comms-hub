// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect} from 'vitest';
import {QL308_CAPABILITY_MATRIX,QL308_ENDPOINTS,QL308_SCENARIOS,QL308_TENANT_FIXTURES,ql308ContractAudit,ql308Regression,ql308ValidateAlias} from '../ql308TenantContracts';
import {Ql308TenantContracts} from '../Ql308TenantContracts';

describe('QL-308 nonproduction tenant-scope and credential-free contract review',()=>{
  it('keeps four business tenants isolated and two supporting services tenant-free',()=>{
    expect(QL308_CAPABILITY_MATRIX).toHaveLength(6);expect(QL308_TENANT_FIXTURES).toHaveLength(4);
    expect(new Set(QL308_TENANT_FIXTURES.map(row=>row.alias)).size).toBe(4);
    for(const row of QL308_CAPABILITY_MATRIX){expect(row.status).toBe('DISCONNECTED / HOLD');expect(row.allowedMethods).toEqual(['GET']);expect(row.allowedEndpoints).toEqual(QL308_ENDPOINTS.map(endpoint=>endpoint.path));expect(row.customerReads).toBe(false);expect(row.crossCompanySharing).toBe(false);expect(row.writes).toBe(false);expect(row.credentialsAvailable).toBe(false);expect(row.approvedGates).toBe(0);}
    expect(QL308_CAPABILITY_MATRIX.filter(row=>row.fixtureAlias===null)).toHaveLength(2);
    expect(QL308_ENDPOINTS).toHaveLength(2);
  });
  it('regresses 28 expected denial / unapproved shape cases, never making requests',()=>{
    expect(QL308_SCENARIOS).toHaveLength(7);
    expect(ql308Regression()).toEqual({cases:28,denied:28,expectedDecisions:true,businessIsolation:true,supportingServicesWithoutCustomerTenant:true,credentialsRead:0,gatewayRequests:0,approvedGates:0});
    for(const fixture of QL308_TENANT_FIXTURES){for(const scenario of QL308_SCENARIOS){const result=ql308ContractAudit(fixture.source,fixture.alias,scenario.id);expect(result.decision).toBe(scenario.expect);expect(result.authorized).toBe(false);expect(result.connected).toBe(false);expect(result.gatewayRequests).toBe(0);}}
    expect(ql308ContractAudit('rosiedazzlers','np-devil-demo').decision).toBe('DENY_TENANT_BOUNDARY');
    expect(ql308ContractAudit('icamp','prod-camp-rosevear').decision).toBe('DENY_NONPRODUCTION_ONLY');
    expect(ql308ContractAudit('ai-data-platform','np-ai-demo').decision).toBe('DENY_SCOPE_REQUIRED');
    expect(ql308ValidateAlias('np-safe-demo')).toBe(true);expect(ql308ValidateAlias('np-')).toBe(false);
    expect(()=>ql308ContractAudit('bad' as never,'np-safe-demo')).toThrow('UNKNOWN_INTEGRATION_SOURCE');
    expect(()=>ql308ContractAudit('icamp','np-icamp-demo','bad' as never)).toThrow('UNKNOWN_DENIAL_SCENARIO');
  });
  it('renders accessible contract studio, changes sources and never exposes a release action',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
    await act(async()=>root.render(<Ql308TenantContracts/>));
    expect(host.querySelectorAll('.ql308-table tbody tr')).toHaveLength(6);
    expect(host.textContent).toContain('28 / 28 contract cases');
    expect(host.textContent).toContain('SHAPE_ONLY_NOT_AUTHORIZED');
    const scenario=host.querySelector<HTMLSelectElement>('#ql308-scenario')!;
    await act(async()=>{scenario.value='cross_company';scenario.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.textContent).toContain('DENY_TENANT_BOUNDARY');
    const source=host.querySelector<HTMLSelectElement>('#ql308-source')!;
    await act(async()=>{source.value='ai-data-platform';source.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.textContent).toContain('DENY_NONPRODUCTION_ONLY');
    expect(host.textContent).toContain('No · HOLD');
    expect(host.querySelectorAll('button')).toHaveLength(0);
    await act(async()=>root.unmount());host.remove();
  });
});
