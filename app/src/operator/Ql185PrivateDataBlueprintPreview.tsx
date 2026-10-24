import { useMemo, useState } from 'react';
import type { BrandId } from '../types';
import { assessQl185Lifecycle, QL185_ACTIONS, QL185_CATEGORIES, QL185_DECISIONS_HELD,
  QL185_STORAGE_RISKS, QL185_VERSION, type Ql185CategoryId, type Ql185LifecycleAction } from './ql185PrivateDataBlueprint';
import './ql185-private-data-blueprint.css';

const brandNames: Readonly<Record<BrandId, string>> = { rosiedazzlers: 'Rosie Dazzlers', devilndove: 'Devil n Dove' };

export function Ql185PrivateDataBlueprintPreview({ brandId }: { brandId: BrandId }) {
  const [categoryId, setCategoryId] = useState<Ql185CategoryId>('contact_identity');
  const [action, setAction] = useState<Ql185LifecycleAction>('retain');
  const [targetBrand, setTargetBrand] = useState<BrandId>(brandId);
  const assessment = useMemo(() => assessQl185Lifecycle(brandId, { targetBrand, categoryId, action }),
    [brandId, targetBrand, categoryId, action]);
  const selectedCategory = assessment.disposition === 'PLANNING_ONLY_HELD'
    ? QL185_CATEGORIES.find(item => item.id === categoryId) : null;

  return <section className="ql185-blueprint" aria-labelledby="ql185-heading">
    <header className="ql185-header">
      <div>
        <p className="ql185-kicker">QL-185 · {QL185_VERSION}</p>
        <h3 id="ql185-heading">Private data minimization & retention blueprint</h3>
        <p>Review QL-004 data fields, browser storage risks and proposed lifecycle safeguards for {brandNames[brandId]}.</p>
      </div>
      <strong className="ql185-badge">POLICY UNAPPROVED · LIVE PILOT HELD</strong>
    </header>
    <p className="ql185-warning" role="note"><strong>Illustrative inventory only.</strong> No real customer record is loaded.
      These selectors cannot read, export, change, delete or retain private data. Do not enter real names or messages
      in the QL-004 browser-local demo. A simulated policy decision never clears any of the 12 QL-181 holds.</p>

    <div className="ql185-controls" role="group" aria-label="Preview a private-data policy decision">
      <div><label htmlFor="ql185-brand">Business under review</label>
        <select id="ql185-brand" value={targetBrand} onChange={event => setTargetBrand(event.target.value as BrandId)}>
          <option value="rosiedazzlers">Rosie Dazzlers</option><option value="devilndove">Devil n Dove</option>
        </select></div>
      <div><label htmlFor="ql185-category">Example data category</label>
        <select id="ql185-category" value={categoryId} onChange={event => setCategoryId(event.target.value as Ql185CategoryId)}>
          {QL185_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></div>
      <div><label htmlFor="ql185-action">Proposed lifecycle request</label>
        <select id="ql185-action" value={action} onChange={event => setAction(event.target.value as Ql185LifecycleAction)}>
          {QL185_ACTIONS.map(item => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)} — policy review only</option>)}
        </select></div>
    </div>

    <div className="ql185-result" role="status" aria-live="polite" aria-atomic="true">
      <h4>{assessment.disposition === 'CROSS_BRAND_REJECTED' ? 'CROSS-BRAND REVIEW REJECTED'
        : assessment.disposition === 'INVALID_BLUEPRINT_REQUEST' ? 'INVALID BLUEPRINT REQUEST'
          : 'POLICY PLANNING ONLY · ALL PRIVATE ACTIONS HELD'}</h4>
      {selectedCategory && <><p><strong>Existing fields:</strong> {selectedCategory.existingFields}</p>
        <p><strong>Exposure:</strong> {selectedCategory.currentSurface}</p>
        <p><strong>Reduce collection:</strong> {selectedCategory.proposedMinimization}</p></>}
      <p><strong>Future safeguard:</strong> {assessment.proposedSafeguard}</p>
      <p><strong>Approved minimum / maximum retention:</strong> NOT SET / NOT SET. Legal and owner review required.</p>
      <strong>Real reads: 0 · Browser writes: 0 · Exports: 0 · Deletions: 0 · Owner approvals: 0 · Live-pilot holds: 12</strong>
    </div>

    <div className="ql185-table-wrap"><table>
      <caption>QL-004 and public synthetic data classes — inventory of fields, not customer contents.</caption>
      <thead><tr><th scope="col">Category</th><th scope="col">Classification</th><th scope="col">Minimization proposal</th></tr></thead>
      <tbody>{QL185_CATEGORIES.map(item => <tr key={item.id}><th scope="row">{item.label}</th>
        <td>{item.classification === 'synthetic_public' ? 'Public synthetic only' : 'Potential private data'}</td>
        <td>{item.proposedMinimization}</td></tr>)}</tbody>
    </table></div>

    <details className="ql185-help">
      <summary><span aria-hidden="true">ⓘ</span> Where does QL-004 expose data, and what replaces it?</summary>
      <div className="ql185-risk-list">{QL185_STORAGE_RISKS.map(risk => <article key={risk.source}>
        <h4>{risk.source}</h4><p><strong>Observed:</strong> {risk.observed}</p>
        <p><strong>Threat:</strong> {risk.risk}</p><p><strong>Staged alternative:</strong> {risk.alternative}</p>
      </article>)}</div>
      <p>Public synthetic Supabase samples are distinct from any future private data API. Actual private tables would
        require separate grants, per-record/brand RLS, verified server sessions, field filtering and independent tests.
        This build does not create or change any of those policies.</p>
    </details>
    <details className="ql185-help"><summary><span aria-hidden="true">ⓘ</span> Which decisions still block actual retention, exports and deletion?</summary>
      <ol>{QL185_DECISIONS_HELD.map(item => <li key={item}>{item}</li>)}</ol>
      <p>Deletion/export requests must include independently verified identity and brand scope, access/correction rights,
        backup/disclosure reconciliation and an approved minimum/maximum retention schedule. Resetting browser demo data
        is not secure erasure. This preview cannot perform any of these operations.</p>
    </details>
  </section>;
}
