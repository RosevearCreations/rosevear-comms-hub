import { useState } from 'react';
import type { OperatorWorkspace, OrganizationId } from './ql191Organizations';
import { operatorOrganizations } from './ql191Organizations';
import { dashboardQueues, type QueueCategory } from './ql191DashboardData';
import { QL270_SOURCES, QL270_PROOF_SNAPSHOT } from './ql270ConnectionCentre';
import { Ql272LayoutControls } from './Ql272LayoutControls';
import { Ql273CommandAssistance, Ql273MetricHelp } from './Ql273CommandAssistance';
import { activeQl272Profile, defaultQl272Preferences, parseQl272Preferences,
  type Ql272PreferenceEnvelope } from './ql272LayoutPreferences';
import { inspectQl272LocalLayout, saveQl272LocalLayout } from '../storage/localRepository';
import './ql271-command.css';

export type Ql271CommandMode = 'it_command' | 'management' | 'analytics' | 'system_status';

const tabs: readonly { id: Ql271CommandMode; label: string; glyph: string }[] = [
  { id: 'it_command', label: 'IT Command', glyph: '⌘' },
  { id: 'management', label: 'Management', glyph: '▦' },
  { id: 'analytics', label: 'Analytics', glyph: '◫' },
  { id: 'system_status', label: 'System Status', glyph: '◈' }
];

const pageCopy: Record<Ql271CommandMode, { eyebrow: string; title: string; intro: string }> = {
  it_command: {
    eyebrow: 'Technology / Connection operations',
    title: 'IT Command & Integrations',
    intro: 'Six source systems, one reviewable connection plan. Inspect origin proof, trust boundaries and the exact release blockers.'
  },
  management: {
    eyebrow: 'Operations / Management oversight',
    title: 'Business Management Centre',
    intro: 'Four separate company desks in one overview. Review sample workloads without combining customer or tenant records.'
  },
  analytics: {
    eyebrow: 'Intelligence / Statistical overview',
    title: 'Analytics & Statistics',
    intro: 'A clear view of demonstration traffic and integration readiness. No fabricated revenue, conversion or live performance claims.'
  },
  system_status: {
    eyebrow: 'System operations / Safety monitoring',
    title: 'System Status & Release Gates',
    intro: 'Know what is configured, what is proven and what must stay disconnected before any real gateway trial can begin.'
  }
};

const examples = Object.values(dashboardQueues).flat();
const categories: readonly { id: QueueCategory; label: string; tone: string }[] = [
  { id: 'reply', label: 'Enquiries requiring reply', tone: 'violet' },
  { id: 'call', label: 'Missed-call simulations', tone: 'cyan' },
  { id: 'intake', label: 'Quote / intake examples', tone: 'gold' },
  { id: 'task', label: 'Follow-up task examples', tone: 'green' }
];

const readiness = [
  { label: 'Source registry', value: 6, max: 6, note: 'Known GitHub source mappings' },
  { label: 'Original Proof-B accepted', value: 0, max: 6, note: 'Six immutable 404 observations' },
  { label: 'Independent authorizations', value: 0, max: 6, note: 'No genuine signer / witness receipts' },
  { label: 'Authorized gateway GET trials', value: 0, max: 6, note: 'No live or nonproduction request sent' }
] as const;

const metricCopy: Record<Ql271CommandMode, readonly { label: string; value: string; max: number; current: number; note: string; tone: string }[]> = {
  it_command: [
    { label: 'Registered sources', value: '6 / 6', max: 6, current: 6, note: '4 businesses · 2 supporting', tone: 'violet' },
    { label: 'Signed proofs verified', value: '0 / 6', max: 6, current: 0, note: 'Original Proof-B not accepted', tone: 'cyan' },
    { label: 'Gateway requests', value: '0', max: 6, current: 0, note: 'No application gateway contacted', tone: 'green' },
    { label: 'Pilot safety holds', value: '12 / 12', max: 12, current: 12, note: 'Release remains blocked', tone: 'gold' }
  ],
  management: [
    { label: 'Business workspaces', value: '4', max: 4, current: 4, note: 'Company-scoped UI samples', tone: 'violet' },
    { label: 'Training examples', value: '16', max: 16, current: examples.length, note: 'Four per business', tone: 'cyan' },
    { label: 'Mock follow-up tasks', value: '4', max: 16, current: examples.filter(x => x.category === 'task').length, note: 'No actual staff assigned', tone: 'green' },
    { label: 'Live company links', value: '0 / 4', max: 4, current: 0, note: 'Tenant access remains off', tone: 'gold' }
  ],
  analytics: [
    { label: 'Sample queue events', value: '16', max: 16, current: examples.length, note: 'Training dataset only', tone: 'violet' },
    { label: 'Reply scenarios', value: '4', max: 16, current: 4, note: '25% of training examples', tone: 'cyan' },
    { label: 'Sample categories', value: '4', max: 4, current: 4, note: 'Reply · call · intake · task', tone: 'green' },
    { label: 'Live analytics feed', value: '0', max: 6, current: 0, note: 'AI Data Platform not linked', tone: 'gold' }
  ],
  system_status: [
    { label: 'Systems registered', value: '6 / 6', max: 6, current: 6, note: 'Source mapping verified', tone: 'violet' },
    { label: 'Original source files', value: '0 / 6', max: 6, current: 0, note: 'All observed HTTP 404', tone: 'cyan' },
    { label: 'Connected tenants', value: '0', max: 6, current: 0, note: 'Nonproduction isolation unverified', tone: 'green' },
    { label: 'Release holds', value: '12', max: 12, current: 12, note: 'Safety gate enforced', tone: 'gold' }
  ]
};

export function Ql271CommandSurfaces({ mode, organizationId, onNavigate, onSelectOrganization }: {
  mode: Ql271CommandMode;
  organizationId: OrganizationId;
  onNavigate: (workspace: OperatorWorkspace) => void;
  onSelectOrganization: (organization: OrganizationId) => void;
}) {
  const copy = pageCopy[mode];
  const [preferences, setPreferences] = useState(() => parseQl272Preferences(inspectQl272LocalLayout().value));
  const [saved, setSaved] = useState(() => inspectQl272LocalLayout().state !== 'unavailable');
  const profile = activeQl272Profile(preferences);
  const view = profile.views[mode];

  function updatePreferences(next: Ql272PreferenceEnvelope) {
    setPreferences(next);
    setSaved(saveQl272LocalLayout(next));
  }

  function openBusiness(id: OrganizationId) {
    onSelectOrganization(id);
    onNavigate('queue');
  }

  return <section className="ql271-command" data-command-view={mode} data-ql272-density={profile.density}
    data-ql272-role-preview={profile.rolePreview} aria-labelledby="ql271-title">
    <nav className="ql271-tabs" aria-label="Command centre views">
      {tabs.map(tab => <button key={tab.id} type="button" aria-current={mode === tab.id ? 'page' : undefined}
        className={mode === tab.id ? 'active' : ''} onClick={() => onNavigate(tab.id)}>
        <span aria-hidden="true">{tab.glyph}</span>{tab.label}
      </button>)}
    </nav>

    <Ql272LayoutControls preferences={preferences} mode={mode} saved={saved}
      metricLabels={metricCopy[mode].map(metric => metric.label)} onChange={updatePreferences}
      onReset={() => updatePreferences(defaultQl272Preferences())} />

    <Ql273CommandAssistance mode={mode} onNavigate={onNavigate} onRestore={restored => { setPreferences(restored); setSaved(true); }}
      onReset={updatePreferences} />

    <header className="ql271-hero">
      <div className="ql271-hero-copy">
        <p className="ql271-eyebrow">QL-273 · {copy.eyebrow}</p>
        <h3 id="ql271-title">{copy.title}</h3>
        <p>{copy.intro}</p>
        <div className="ql271-hero-actions">
          <button type="button" onClick={() => onNavigate('connections')}>Manage six-app connections <span aria-hidden="true">↗</span></button>
          <button type="button" className="secondary" onClick={() => onNavigate('six_app_evidence')}>Review proof evidence <span aria-hidden="true">›</span></button>
        </div>
      </div>
      <svg className="ql271-hero-art" viewBox="0 0 420 270" role="img" aria-label="Decorative communications network illustration">
        <defs><linearGradient id="ql271-signal" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9c60ff"/><stop offset="1" stopColor="#27dcf2"/></linearGradient></defs>
        <circle cx="210" cy="135" r="113" fill="none" stroke="#36759e" strokeWidth="1" opacity=".45"/>
        <circle cx="210" cy="135" r="81" fill="none" stroke="#2a8dbe" strokeWidth="1" opacity=".6"/>
        <circle cx="210" cy="135" r="48" fill="#0b2037" stroke="url(#ql271-signal)" strokeWidth="2"/>
        <path d="M210 87V23M210 183v58M162 135H59M258 135h103M176 101l-74-62M244 169l74 62M244 101l74-62M176 169l-74 62" stroke="url(#ql271-signal)" strokeWidth="2" opacity=".76" fill="none"/>
        {[ [210,23],[210,241],[59,135],[361,135],[102,39],[318,231],[318,39],[102,231] ].map(([x,y],index)=><circle key={index} cx={x} cy={y} r="7" fill="#061c32" stroke={index%2?'#a26cff':'#28dded'} strokeWidth="2"/>)}
        <text x="210" y="128" textAnchor="middle" fill="#e8f8ff" fontSize="19" fontWeight="800">COMMS</text>
        <text x="210" y="151" textAnchor="middle" fill="#73d6eb" fontSize="13" letterSpacing="3">HUB</text>
      </svg>
    </header>

    <p className="ql271-truth" role="note"><span aria-hidden="true">◆</span> SYNTHETIC / READ-ONLY VIEW — charts use the 16 fictional training events and six known repository mappings. No live customer, finance, staffing, device or gateway telemetry is connected.</p>

    <div className="ql271-kpis" aria-label="Command centre metrics">
      {view.order.filter(index => !view.hidden.includes(index)).map(index=>{
        const metric = metricCopy[mode][index];
        return <article className={`ql271-kpi tone-${metric.tone}`} key={metric.label}>
        <div className="ql271-kpi-top"><span className="ql271-kpi-icon" aria-hidden="true">{['▧','◇','◉','⚑'][index]}</span><span className="ql271-kpi-label">{metric.label}</span><Ql273MetricHelp mode={mode} index={index} label={metric.label} /></div>
        <strong>{metric.value}</strong><small>{metric.note}</small>
        <div className="ql271-track" role="meter" aria-label={metric.label} aria-valuemin={0} aria-valuemax={metric.max} aria-valuenow={metric.current}>
          <span style={{ width: `${metric.current / metric.max * 100}%` }}/>
        </div>
      </article>;
      })}
    </div>

    {view.showPanels && mode === 'it_command' && <div className="ql271-columns">
      <section className="ql271-panel ql271-wide" aria-labelledby="ql271-it-sources"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Connection registry</p><h4 id="ql271-it-sources">Six application interfaces</h4></div><span className="ql271-badge amber">0 authenticated</span></div>
        <div className="ql271-source-list">{QL270_SOURCES.map(source=><div className="ql271-source-row" key={source.id}>
          <span className={`ql271-source-glyph tone-${source.tone}`} aria-hidden="true">{source.icon}</span>
          <div><strong>{source.label}</strong><small>{source.kind} · {source.benefit}</small></div>
          <span className="ql271-status-pill">Proof 404 · HOLD</span>
        </div>)}</div>
      </section>
      <section className="ql271-panel" aria-labelledby="ql271-it-gates"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Independent verification</p><h4 id="ql271-it-gates">Connection release checklist</h4></div></div>
        <ol className="ql271-steps"><li><strong>Original Proof-B</strong><small>Six source files absent</small></li><li><strong>Role &amp; signer pin</strong><small>Independent custody evidence not accepted</small></li><li><strong>Isolated TEST tenant</strong><small>No reviewed role-specific tenant receipt</small></li><li><strong>Owner-authorized GET</strong><small>Trial remains blocked</small></li></ol>
        <button className="ql271-panel-action" type="button" onClick={()=>onNavigate('connections')}>Open preflight inspector <span>›</span></button>
      </section>
    </div>}

    {view.showPanels && mode === 'management' && <div className="ql271-columns">
      <section className="ql271-panel ql271-wide" aria-labelledby="ql271-management-desks"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Company-isolated views</p><h4 id="ql271-management-desks">Four business workspaces</h4></div><span className="ql271-badge">16 fictional records</span></div>
        <div className="ql271-company-table" role="table" aria-label="Sample business workload">
          <div className="ql271-table-head" role="row"><span role="columnheader">Business</span><span role="columnheader">Examples</span><span role="columnheader">Follow-ups</span><span role="columnheader">Review</span></div>
          {operatorOrganizations.map(org=><div className="ql271-table-row" role="row" key={org.id}>
            <div role="cell"><strong>{org.name}</strong><small>{org.businessType}</small></div>
            <span role="cell">{dashboardQueues[org.id].length} sample</span>
            <span role="cell">{dashboardQueues[org.id].filter(x=>x.category==='task').length} mock</span>
            <div role="cell"><button type="button" onClick={()=>openBusiness(org.id)} aria-label={`Open ${org.name} sample queue`}>{org.id===organizationId?'Open current desk':'View sample desk'} <span aria-hidden="true">›</span></button></div>
          </div>)}</div>
      </section>
      <section className="ql271-panel" aria-labelledby="ql271-management-controls"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Management controls</p><h4 id="ql271-management-controls">Operator safeguards</h4></div></div>
        <div className="ql271-control-list"><p><span className="ql271-dot green"/>Company context isolated <small>Four separate sample queues</small></p><p><span className="ql271-dot amber"/>Provider dispatch disabled <small>No real calls, SMS or assignments</small></p><p><span className="ql271-dot amber"/>Shared reporting held <small>AI Data Platform has no live feed</small></p><p><span className="ql271-dot amber"/>Local relay held <small>Rosevear AI Hub not activated</small></p></div>
        <button className="ql271-panel-action" type="button" onClick={()=>onNavigate('queue')}>Current business task preview <span>›</span></button>
      </section>
    </div>}

    {view.showPanels && mode === 'analytics' && <div className="ql271-columns">
      <section className="ql271-panel ql271-wide" aria-labelledby="ql271-category-chart"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Synthetic training distribution</p><h4 id="ql271-category-chart">Activity by category</h4></div><span className="ql271-badge">16 sample events</span></div>
        <div className="ql271-chart-bars">{categories.map(category=>{
          const count=examples.filter(x=>x.category===category.id).length;
          return <div className="ql271-chart-row" key={category.id}><span>{category.label}</span><div className="ql271-chart-track"><i className={`tone-${category.tone}`} style={{width:`${count/examples.length*100}%`}}/></div><strong>{count} <small>/ {examples.length}</small></strong></div>;
        })}</div><p className="ql271-chart-note">Each category represents exactly four fabricated scenarios across the four business desks. These are not trend or conversion estimates.</p>
      </section>
      <section className="ql271-panel" aria-labelledby="ql271-category-mix"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Training dataset</p><h4 id="ql271-category-mix">Sample workload mix</h4></div></div>
        <div className="ql271-donut-area"><div className="ql271-donut" role="img" aria-label="Four equal categories, each 25 percent"><div><strong>16</strong><small>fictional</small></div></div>
          <ul>{categories.map(category=><li key={category.id}><span className={`ql271-dot ${category.tone}`}/>{category.label}<strong>25%</strong></li>)}</ul></div>
      </section>
      <section className="ql271-panel ql271-full" aria-labelledby="ql271-readiness-funnel"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Connection conversion · actual proof state</p><h4 id="ql271-readiness-funnel">Approval funnel</h4></div><span className="ql271-badge amber">HELD</span></div>
        <div className="ql271-funnel">{readiness.map(step=><div key={step.label}><strong>{step.value}<small>/{step.max}</small></strong><span>{step.label}</span><div className="ql271-track"><i style={{width:`${step.value/step.max*100}%`}}/></div></div>)}</div>
      </section>
    </div>}

    {view.showPanels && mode === 'system_status' && <div className="ql271-columns">
      <section className="ql271-panel ql271-wide" aria-labelledby="ql271-status-ledger"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Six-app proof register</p><h4 id="ql271-status-ledger">Original Proof-B status</h4></div><span className="ql271-badge amber">All 6 HELD</span></div>
        <div className="ql271-status-table">{QL270_SOURCES.map(source=>{
          const proof=QL270_PROOF_SNAPSHOT.find(p=>p.source===source.id);
          return <div key={source.id}><span className="ql271-dot amber"/><strong>{source.label}</strong><small>main · {proof?.sha.slice(0,9)}</small><span className="ql271-status-pill">HTTP 404</span></div>;
        })}</div><p className="ql271-chart-note">Dated original GitHub proof checks from QL-270, 30 October 2026; these are not live heartbeat checks.</p>
      </section>
      <section className="ql271-panel" aria-labelledby="ql271-safety-switches"><div className="ql271-panel-header"><div><p className="ql271-eyebrow">Runtime safeguards</p><h4 id="ql271-safety-switches">Safety &amp; activation</h4></div></div>
        <div className="ql271-switch-list"><p><span>Live calls and SMS</span><strong>OFF</strong></p><p><span>Customer record exchange</span><strong>OFF</strong></p><p><span>Read-only gateway GETs</span><strong>0 SENT</strong></p><p><span>Tenant authorization</span><strong>HELD</strong></p><p><span>Independent proof acceptance</span><strong>0 / 6</strong></p></div>
        <button className="ql271-panel-action" type="button" onClick={()=>onNavigate('six_app_evidence')}>Review evidence and exceptions <span>›</span></button>
      </section>
    </div>}

    <footer className="ql271-footer"><span>◆</span><strong>Production software and integration authorization are separate.</strong> The interface may be GREEN while every source remains DISCONNECTED / HOLD. No secret, real tenant, public report or event is sent by these command views.</footer>
  </section>;
}
