/**
 * WalletDashboard — Investigation-first layout
 *
 * Layout philosophy:
 *   • Graph is the hero — takes all available vertical space
 *   • KPI strip is a 32px whisper bar, not an 8-card grid
 *   • No persistent sidebars — EntityInsights lives in the Overview tab
 *   • Side panel slides in only when a node is selected
 *   • Bottom analytics are hidden behind a tab bar by default
 *   • Two modes: Investigate (graph dominant) | Data (analytics dominant)
 */

import { useState } from 'react';
import {
  ArrowLeft, Network, Copy, CheckCheck, ShieldAlert,
  ChevronUp, ChevronDown, Search, Database,
} from 'lucide-react';
import WalletGraph from './WalletGraph';
import SidePanel from './SidePanel';
import TransactionTable from './TransactionTable';
import TimelineChart from './TimelineChart';
import CounterpartyChart from './CounterpartyChart';
import RiskBadge from '../shared/RiskBadge';
import { ENTITY_COLORS } from '../../constants';
import {
  walletMetrics,
  graphNodes,
  graphLinks,
  transactions,
  entityInsights,
  timelineData,
  counterpartyData,
} from '../../data/mockWalletData';

// ─────────────────────────────────────────────────────────────────
// STATIC ALERTS (derived from wallet data)
// ─────────────────────────────────────────────────────────────────
const ALERTS = [
  {
    id: 1, severity: 'critical',
    title: 'Tornado Cash Interaction',
    detail: '4 transactions totalling $487,300 sent to OFAC-sanctioned Tornado Cash mixer. Direct sanctions violation risk — no safe-harbour defence available.',
    category: 'Mixer / Sanctions', ts: '2024-11-18',
  },
  {
    id: 2, severity: 'critical',
    title: 'OFAC SDN Entity — Direct Transfer',
    detail: '$183,400 transferred directly to OFAC SDN-listed wallet. Constitutes a wilful breach of US sanctions regulations under 31 CFR.',
    category: 'Sanctions Violation', ts: '2024-11-15',
  },
  {
    id: 3, severity: 'critical',
    title: 'Layering Pattern Confirmed',
    detail: 'Funds received from a known layering hub across 12 transactions. Structured redistribution consistent with the placement-layering phase of money laundering.',
    category: 'AML — Layering', ts: '2024-11-10',
  },
  {
    id: 4, severity: 'high',
    title: 'LockBit Ransomware Nexus',
    detail: 'Indirect exposure to LockBit-attributed wallet via two-hop relay chain. $89,600 of inbound funds traceable to ransomware ransom payments per FBI attribution data.',
    category: 'Ransomware', ts: '2024-11-08',
  },
  {
    id: 5, severity: 'high',
    title: 'Garantex Exchange (OFAC)',
    detail: '$94,200 forwarded to Garantex — Russian exchange sanctioned by OFAC in April 2022 for processing illicit proceeds. Secondary sanctions exposure.',
    category: 'Sanctions', ts: '2024-10-30',
  },
  {
    id: 6, severity: 'high',
    title: 'Unregistered OTC Desk',
    detail: '$234,700 routed through an unregistered OTC service with no KYC/AML controls and no legal money services business licence on file.',
    category: 'High-Risk Service', ts: '2024-10-26',
  },
];

const TABS = [
  { key: 'overview',       label: 'Overview' },
  { key: 'transactions',   label: 'Transactions' },
  { key: 'counterparties', label: 'Counterparties' },
  { key: 'activity',       label: 'Activity' },
  { key: 'alerts',         label: `Alerts` },
];

// ─────────────────────────────────────────────────────────────────
// KPI CHIP — slim inline metric
// ─────────────────────────────────────────────────────────────────
const ACCENT = {
  red:    '#f87171', orange: '#fb923c', yellow: '#fbbf24',
  green:  '#4ade80', cyan:   '#a78bfa', purple: '#a78bfa', slate: '#64748b',
};

function KpiChip({ label, value, accent }) {
  return (
    <div className="flex items-center gap-2 px-3 h-full border-r border-white/[0.05] last:border-r-0">
      <span className="text-[9.5px] font-mono text-slate-600 uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <span className="text-[11px] font-mono font-semibold" style={{ color: ACCENT[accent] || '#64748b' }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OVERVIEW TAB
// ─────────────────────────────────────────────────────────────────
function OverviewTab() {
  const topCounterparties = counterpartyData.slice(0, 6);
  const maxVol = Math.max(...topCounterparties.map((c) => c.volume));
  const criticalAlerts = ALERTS.filter((a) => a.severity === 'critical');

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Left: Behavioural analysis ── */}
      <div
        className="flex-1 min-w-0 overflow-y-auto p-4"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-[9.5px] font-mono uppercase tracking-widest text-slate-600 mb-2">
          Behavioural Analysis
        </div>
        <p className="text-[11px] font-mono text-slate-400 leading-relaxed mb-4">
          {walletMetrics.behaviouralSummary}
        </p>

        <div className="text-[9.5px] font-mono uppercase tracking-widest text-slate-600 mb-2">
          Critical Findings — {criticalAlerts.length} confirmed
        </div>
        <div className="space-y-1.5">
          {criticalAlerts.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-2.5 px-3 py-2 rounded"
              style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}
            >
              <span className="text-red-500 text-[11px] font-mono font-bold mt-px flex-shrink-0">!</span>
              <div>
                <div className="text-[11px] font-mono font-semibold text-red-400 mb-0.5">{a.title}</div>
                <div className="text-[10px] font-mono text-slate-500 leading-relaxed">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Centre: Counterparties preview ── */}
      <div
        className="w-60 flex-shrink-0 overflow-y-auto p-4"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-[9.5px] font-mono uppercase tracking-widest text-slate-600 mb-3">
          Top Counterparties by Volume
        </div>
        <div className="space-y-2.5">
          {topCounterparties.map((cp) => {
            const color = ENTITY_COLORS[cp.type] || '#64748b';
            return (
              <div key={cp.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 truncate">{cp.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 ml-2 flex-shrink-0">
                    ${(cp.volume / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="h-0.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(cp.volume / maxVol) * 100}%`,
                      backgroundColor: color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Exposure summary ── */}
      <div className="w-52 flex-shrink-0 overflow-y-auto p-4">
        <div className="text-[9.5px] font-mono uppercase tracking-widest text-slate-600 mb-3">
          Entity Exposure
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'Sanctioned entities',  items: entityInsights.sanctioned,        color: ENTITY_COLORS.sanctioned },
            { label: 'Mixer / tumblers',     items: entityInsights.mixers,            color: ENTITY_COLORS.mixer },
            { label: 'Darknet markets',      items: entityInsights.darknet,           color: ENTITY_COLORS.darknet },
            { label: 'Ransomware-linked',    items: entityInsights.ransomware,        color: ENTITY_COLORS.ransomware },
            { label: 'High-risk services',   items: entityInsights.highRiskServices,  color: ENTITY_COLORS.high_risk_service },
            { label: 'Exchanges',            items: entityInsights.exchanges,         color: ENTITY_COLORS.exchange },
            { label: 'Bridges',              items: entityInsights.bridges,           color: ENTITY_COLORS.bridge },
          ].map(({ label, items, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-mono text-slate-500">{label}</span>
                </div>
                <span
                  className="text-[10px] font-mono font-semibold"
                  style={{ color: items.length > 0 ? color : '#334155' }}
                >
                  {items.length > 0 ? items.length : '—'}
                </span>
              </div>
              {items.length > 0 && (
                <div className="ml-3 space-y-0.5 mb-1">
                  {items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono text-slate-600 truncate">{item.name}</span>
                      <span className="text-[9.5px] font-mono text-slate-700 ml-1 flex-shrink-0">{item.volume}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ALERTS TAB
// ─────────────────────────────────────────────────────────────────
function AlertsTab() {
  return (
    <div className="h-full overflow-y-auto px-4 py-3">
      <div className="grid gap-2">
        {ALERTS.map((alert) => {
          const color = alert.severity === 'critical' ? '#ef4444' : '#f97316';
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 px-3 py-2.5 rounded"
              style={{ background: color + '07', border: `1px solid ${color}1a` }}
            >
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 mt-0.5"
                style={{ background: color + '1e', color }}
              >
                {alert.severity}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-mono font-semibold" style={{ color }}>
                    {alert.title}
                  </span>
                  <span className="text-[9px] font-mono text-slate-700 ml-3 flex-shrink-0">{alert.ts}</span>
                </div>
                <p className="text-[10px] font-mono text-slate-500 leading-relaxed mb-1">{alert.detail}</p>
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-700">
                  {alert.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────
export default function WalletDashboard({ address, onBack, onScanNetwork }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [tabsOpen, setTabsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('investigation');

  const displayAddress = address || walletMetrics.address;
  const shortAddress = displayAddress.slice(0, 6) + '...' + displayAddress.slice(-4);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayAddress).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNodeClick = (node) => setSelectedNode(node);
  const handleClosePanel = () => setSelectedNode(null);

  const handleTabClick = (key) => {
    if (activeTab === key && tabsOpen) {
      setTabsOpen(false);
    } else {
      setActiveTab(key);
      setTabsOpen(true);
    }
  };

  // Data mode always keeps tabs open + gives them more height
  const isTabsVisible = tabsOpen || viewMode === 'data';
  const tabContentHeight = viewMode === 'data' ? 300 : 250;

  const alertCount = ALERTS.filter((a) => a.severity === 'critical').length;

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#090a0f' }}>

      {/* ══════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 h-10"
        style={{ background: '#0e0f18', borderBottom: '1px solid rgba(139,92,246,0.1)' }}
      >
        {/* Left: Navigation + Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={12} />
            Back
          </button>
          <div className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={11} style={{ color: '#8b5cf6' }} />
            <span className="text-[9.5px] font-mono text-slate-500 uppercase tracking-widest">Investigation</span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-mono text-slate-300">{shortAddress}</span>
            <button onClick={handleCopy} className="text-slate-600 hover:text-purple-400 transition-colors">
              {copied ? <CheckCheck size={11} className="text-green-400" /> : <Copy size={11} />}
            </button>
          </div>
          <RiskBadge level={walletMetrics.riskLevel} score={walletMetrics.riskScore} size="xs" />
        </div>

        {/* Right: Meta + Mode toggle */}
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] font-mono text-slate-700 uppercase hidden lg:block">
            {walletMetrics.chain} · Last seen {walletMetrics.lastSeen}
          </span>
          <div className="w-px h-3.5 bg-white/10" />

          {/* Investigation / Data mode toggle */}
          <div
            className="flex items-center text-[9.5px] font-mono overflow-hidden rounded"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              onClick={() => { setViewMode('investigation'); setTabsOpen(false); }}
              className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
                viewMode === 'investigation'
                  ? 'text-purple-400 bg-purple-950/40'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Search size={9} />
              Investigate
            </button>
            <button
              onClick={() => { setViewMode('data'); setTabsOpen(true); if (activeTab === 'overview') setActiveTab('activity'); }}
              className={`flex items-center gap-1 px-2.5 py-1 transition-colors border-l ${
                viewMode === 'data'
                  ? 'text-amber-400 bg-amber-950/30'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <Database size={9} />
              Data
            </button>
          </div>

          <div className="w-px h-3.5 bg-white/10" />
          <button
            onClick={onScanNetwork}
            className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-purple-400 transition-colors"
          >
            <Network size={11} />
            Scan Network
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          KPI STRIP — 8 metrics in a single 32px bar
      ══════════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center h-8 overflow-x-auto"
        style={{ background: '#0a0b14', borderBottom: '1px solid rgba(139,92,246,0.07)' }}
      >
        <KpiChip label="Risk Score"    value={`${walletMetrics.riskScore}/100`}         accent="red"    />
        <KpiChip label="Incoming"      value={walletMetrics.totalIncoming}               accent="green"  />
        <KpiChip label="Outgoing"      value={walletMetrics.totalOutgoing}               accent="red"    />
        <KpiChip label="Sanctions"     value={`${walletMetrics.sanctionedLinks} links`}  accent="red"    />
        <KpiChip label="Layering"      value={`${walletMetrics.layeringScore}/100`}      accent="orange" />
        <KpiChip label="Anomaly"       value={`${walletMetrics.anomalyScore}/100`}       accent="purple" />
        <KpiChip label="Counterparties" value={walletMetrics.uniqueCounterparties}       accent="cyan"   />
        <KpiChip label="Stablecoin"    value={walletMetrics.stablecoinShare}             accent="yellow" />
      </div>

      {/* ══════════════════════════════════════════════════════════
          MAIN INVESTIGATION AREA  (graph + optional side panel)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Graph — fills all remaining horizontal space */}
        <WalletGraph
          nodes={graphNodes}
          links={graphLinks}
          onNodeClick={handleNodeClick}
          selectedNodeId={selectedNode?.id}
        />

        {/* Side panel — only rendered when a node is selected */}
        {selectedNode && (
          <SidePanel node={selectedNode} onClose={handleClosePanel} />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM TAB SYSTEM
      ══════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Tab bar — always visible */}
        <div
          className="flex items-center h-9 px-3 gap-0.5"
          style={{ background: '#0e0f18' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key && isTabsVisible;
            const isAlerts = tab.key === 'alerts';
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-mono uppercase tracking-widest transition-all rounded-t ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
                style={{
                  background: isActive ? 'rgba(139,92,246,0.09)' : 'transparent',
                  borderBottom: isActive ? '1px solid rgba(139,92,246,0.75)' : '1px solid transparent',
                }}
              >
                {isAlerts && alertCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                )}
                {tab.label}
                {isAlerts && alertCount > 0 && (
                  <span className="text-[9px] text-red-400 font-semibold">({alertCount})</span>
                )}
              </button>
            );
          })}

          {/* Spacer + collapse/expand control */}
          <div className="ml-auto flex items-center gap-2">
            {!isTabsVisible && (
              <span className="text-[9px] font-mono text-slate-700 hidden md:block">
                Click tab to expand analytics
              </span>
            )}
            <button
              onClick={() => setTabsOpen((v) => !v)}
              className="p-1 text-slate-600 hover:text-slate-400 transition-colors"
              title={isTabsVisible ? 'Collapse analytics panel' : 'Expand analytics panel'}
            >
              {isTabsVisible ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          </div>
        </div>

        {/* Tab content — slides open/closed */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            height: isTabsVisible ? tabContentHeight : 0,
            background: '#090a0f',
            borderTop: isTabsVisible ? '1px solid rgba(139,92,246,0.07)' : 'none',
          }}
        >
          {activeTab === 'overview' && (
            <div style={{ height: tabContentHeight }}>
              <OverviewTab />
            </div>
          )}
          {activeTab === 'transactions' && (
            <div style={{ height: tabContentHeight }} className="overflow-hidden">
              <TransactionTable transactions={transactions} />
            </div>
          )}
          {activeTab === 'counterparties' && (
            <div style={{ height: tabContentHeight }}>
              <CounterpartyChart data={counterpartyData} />
            </div>
          )}
          {activeTab === 'activity' && (
            <div style={{ height: tabContentHeight }}>
              <TimelineChart data={timelineData} />
            </div>
          )}
          {activeTab === 'alerts' && (
            <div style={{ height: tabContentHeight }}>
              <AlertsTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
