import { useState } from 'react';
import { X, ExternalLink, AlertTriangle, Hash, ChevronRight, ChevronLeft } from 'lucide-react';
import RiskBadge from '../shared/RiskBadge';
import EntityBadge from '../shared/EntityBadge';
import { ENTITY_COLORS } from '../../constants';

function StatRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/4">
      <span className="text-[11px] text-slate-500 font-mono">{label}</span>
      <span className={`text-[11px] text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export default function SidePanel({ node, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!node) return null;

  // Collapsed: narrow strip showing just color dot + risk level
  if (collapsed) {
    const color = ENTITY_COLORS[node.type] || '#64748b';
    return (
      <div
        className="w-9 flex-shrink-0 flex flex-col items-center border-l py-3 gap-3"
        style={{ background: '#0e0f18', borderColor: 'rgba(139,92,246,0.1)' }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="text-slate-600 hover:text-slate-400 transition-colors"
          title="Expand node panel"
        >
          <ChevronLeft size={14} />
        </button>
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}60` }}
        />
        <span
          className="text-[9px] font-mono font-bold"
          style={{
            color: node.riskLevel === 'critical' ? '#f87171'
                 : node.riskLevel === 'high'     ? '#fb923c'
                 : node.riskLevel === 'medium'   ? '#fbbf24'
                 : '#4ade80',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            letterSpacing: '0.1em',
          }}
        >
          {node.riskLevel?.toUpperCase()}
        </span>
      </div>
    );
  }

  const color = ENTITY_COLORS[node.type] || '#64748b';
  const isHighRisk = node.riskLevel === 'critical' || node.riskLevel === 'high';

  return (
    <div className="w-60 flex-shrink-0 flex flex-col border-l overflow-hidden animate-slide-in-right"
      style={{ background: '#0e0f18', borderColor: 'rgba(139,92,246,0.1)' }}>

      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'rgba(139,92,246,0.08)' }}>
        <div className="flex items-start justify-between mb-3">
          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(true)}
            className="mr-2 mt-0.5 flex-shrink-0 text-slate-700 hover:text-slate-500 transition-colors"
            title="Collapse panel"
          >
            <ChevronRight size={13} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
              <span className="text-xs font-semibold text-slate-200 truncate">{node.entityLabel || node.label}</span>
            </div>
            <div className="font-mono text-[10px] text-slate-500 break-all leading-relaxed">
              {node.id}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors ml-2 flex-shrink-0">
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <EntityBadge type={node.type} size="xs" />
          <RiskBadge level={node.riskLevel} score={node.riskScore} size="xs" />
        </div>
      </div>

      {/* Risk warning banner */}
      {isHighRisk && (
        <div className="flex-shrink-0 flex items-start gap-2 px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(139,92,246,0.08)', background: node.riskLevel === 'critical' ? 'rgba(220,38,38,0.06)' : 'rgba(234,88,12,0.06)' }}>
          <AlertTriangle size={12} className={node.riskLevel === 'critical' ? 'text-red-400 mt-0.5 flex-shrink-0' : 'text-orange-400 mt-0.5 flex-shrink-0'} />
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            {node.behaviouralSummary}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mb-2">Transaction Profile</div>
        <div className="space-y-0">
          <StatRow label="Total Received" value={node.totalReceived} />
          <StatRow label="Total Sent" value={node.totalSent} />
          <StatRow label="Inbound Txs" value={`${node.inTx ?? '—'}`} />
          <StatRow label="Outbound Txs" value={`${node.outTx ?? '—'}`} />
          <StatRow label="Total Tx Volume" value={`$${(node.volume || 0).toLocaleString()}`} />
          <StatRow label="Tx Count" value={`${node.txCount ?? '—'}`} />
        </div>

        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mt-4 mb-2">Risk Assessment</div>
        <div className="space-y-0">
          <StatRow label="Risk Score" value={`${node.riskScore ?? '—'} / 100`} mono />
          <StatRow label="Risk Level" value={node.riskLevel ? node.riskLevel.charAt(0).toUpperCase() + node.riskLevel.slice(1) : '—'} />
          <StatRow label="Entity Type" value={node.entityLabel || '—'} />
        </div>

        {node.behaviouralSummary && !isHighRisk && (
          <>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-600 mt-4 mb-2">Behavioural Summary</div>
            <p className="text-[11px] text-slate-400 font-mono leading-relaxed">{node.behaviouralSummary}</p>
          </>
        )}

        <div className="mt-4 pt-3 border-t border-white/5">
          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-mono text-slate-500 hover:text-purple-400 transition-colors"
            style={{ background: '#0e1420', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ExternalLink size={11} />
            Open Full Investigation
          </button>
        </div>
      </div>
    </div>
  );
}
