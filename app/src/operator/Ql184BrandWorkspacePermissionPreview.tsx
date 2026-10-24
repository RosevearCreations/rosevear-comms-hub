import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { assessQl184Permission, QL184_OPERATIONS, QL184_ROLES, QL184_VERSION,
  type Ql184OperationId, type Ql184Role } from './ql184BrandWorkspacePermissions';
import './ql184-brand-workspace-permissions.css';

const brandNames: Record<BrandId, string> = {
  rosiedazzlers: 'Rosie Dazzlers',
  devilndove: 'Devil n Dove'
};

const scopeChoices: ReadonlyArray<{ id: string; label: string; assigned: readonly BrandId[] }> = [
  { id: 'none', label: 'No assigned business', assigned: [] },
  { id: 'rosie', label: 'Rosie Dazzlers only', assigned: ['rosiedazzlers'] },
  { id: 'devil', label: 'Devil n Dove only', assigned: ['devilndove'] },
  { id: 'both', label: 'Both businesses (separate contexts)', assigned: ['rosiedazzlers', 'devilndove'] }
];

const roleNames: Readonly<Record<Ql184Role, string>> = {
  signed_out: 'Signed out / no verified identity', staff_readonly: 'Staff read-only (illustration)',
  admin: 'Admin (illustration)', owner: 'Owner (illustration)'
};

export function Ql184BrandWorkspacePermissionPreview({ brandId }: { brandId: BrandId }) {
  const [role, setRole] = useState<Ql184Role>('signed_out');
  const [scopeId, setScopeId] = useState('none');
  const [targetBrand, setTargetBrand] = useState<BrandId>(brandId);
  const [operationId, setOperationId] = useState<Ql184OperationId>('inbox_read');
  const assignedBrands = scopeChoices.find(option => option.id === scopeId)?.assigned ?? [];
  const assessment = useMemo(() => assessQl184Permission(brandId, {
    role, assignedBrands, targetBrand, operationId
  }), [brandId, role, assignedBrands, targetBrand, operationId]);
  const selectedOperation = QL184_OPERATIONS.find(operation => operation.id === operationId)!;

  return (
    <section className="ql184-permissions" aria-labelledby="ql184-heading">
      <header className="ql184-header">
        <div>
          <p className="ql184-kicker">QL-184 · {QL184_VERSION}</p>
          <h3 id="ql184-heading">Brand workspace permission blueprint</h3>
          <p>Compare proposed roles and business scopes before any real server-side permission implementation.</p>
        </div>
        <strong className="ql184-hold">NO SERVER GRANTS · LIVE PILOT HELD</strong>
      </header>
      <p className="ql184-warning" role="note">
        <strong>Design simulation only.</strong> Role, assigned-business and target choices here are not a login,
        actual Supabase allowlist, database policy, user identity or permission grant. No private customer data is read.
        A design match always remains <strong>RUNTIME DENIED</strong>.
      </p>

      <div className="ql184-controls" role="group" aria-label="Illustrative permission request">
        <div>
          <label htmlFor="ql184-role">Prospective role</label>
          <select id="ql184-role" value={role} onChange={event => setRole(event.target.value as Ql184Role)}>
            {QL184_ROLES.map(id => <option key={id} value={id}>{roleNames[id]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ql184-scope">Proposed assigned brand scope</label>
          <select id="ql184-scope" value={scopeId} onChange={event => setScopeId(event.target.value)}>
            {scopeChoices.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ql184-target">Requested business</label>
          <select id="ql184-target" value={targetBrand} onChange={event => setTargetBrand(event.target.value as BrandId)}>
            {(Object.keys(brandNames) as BrandId[]).map(id => <option key={id} value={id}>{brandNames[id]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ql184-operation">Proposed resource action</label>
          <select id="ql184-operation" value={operationId} onChange={event => setOperationId(event.target.value as Ql184OperationId)}>
            {QL184_OPERATIONS.map(operation => <option key={operation.id} value={operation.id}>{operation.label}</option>)}
          </select>
        </div>
      </div>

      <section className="ql184-result" aria-label="Permission blueprint outcome" role="status" aria-live="polite" aria-atomic="true">
        <p>Active workspace: <strong>{brandNames[brandId]}</strong> · Proposed resource: <code>{selectedOperation.resource}</code></p>
        <h4>{assessment.proposedDesignAllows ? 'DESIGN MATCH ONLY · RUNTIME DENIED' : 'DESIGN DENIED · RUNTIME DENIED'}</h4>
        <p>{assessment.reason}</p>
        <strong>Verified session: NO · Real access granted: NO · Live-pilot prerequisites: 12 HELD</strong>
        <p>Private records read: 0 · Database writes: 0 · Phone/SMS sent: 0 · Owner approvals: 0.</p>
      </section>

      <div className="ql184-table-wrap">
        <table>
          <caption>Proposed same-brand roles, not effective permissions. All actions remain disabled in this public preview.</caption>
          <thead><tr><th scope="col">Proposed operation</th><th scope="col">Staff read-only</th><th scope="col">Admin</th><th scope="col">Owner</th></tr></thead>
          <tbody>{QL184_OPERATIONS.map(operation => <tr key={operation.id}>
            <th scope="row">{operation.label}</th>
            {(['staff_readonly', 'admin', 'owner'] as const).map(id => <td key={id}>
              {operation.proposedRoles.includes(id) ? 'Design yes · held' : 'Design no · held'}
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <details className="ql184-help">
        <summary><span aria-hidden="true">ⓘ</span> What must be verified before any real permissions exist?</summary>
        <ul>{assessment.pendingSecurityReviews.map(item => <li key={item}>{item}</li>)}</ul>
        <p>Existing QL-009 role names and the <code>brand_scope</code> field are only inputs to this proposal.
          Future private APIs must check signed-in identity, active status, permitted business, record ownership,
          operation and field scope on the server. A page selector alone must never authorize access.</p>
        <p>Public QL-087/090 synthetic read-only samples remain a separate, intentionally public class;
          they are not proof of authorization for future customer records.</p>
      </details>
      <p className="ql184-footer">Every proposed role—including owner—is blocked from real customer exports, live provider dispatch,
        actual role changes, private owner decisions and pilot approval. Switching the sidebar business resets this illustration.</p>
    </section>
  );
}
