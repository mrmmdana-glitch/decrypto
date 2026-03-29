import { useState } from 'react';
import { ShieldAlert, GitBranch, Filter, Zap, Share2, Repeat2, Hexagon, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

const ICON_MAP = {
  'shield-alert': ShieldAlert,
  'git-branch': GitBranch,
  'filter': Filter,
  'zap': Zap,
  'share-2': Share2,
  'repeat': Repeat2,
  'hexagon': Hexagon,
  'dollar-sign': DollarSign,
};

const SEVERITY_STYLES = {
  critical: {
    border: 'border-red-500/25',
    bg: 'rgba(239,68,68,0.05)',
    dot: 'bg-red-500',
    label: 'text-red-400',
    badge: 'bg-risk-critical border-risk-critical text-red-400',
  },
  high: {
    border: 'border-orange-500/25',
    bg: 'rgba(249,115,22,0.05)',
    dot: 'bg-orange-500',
    label: 'text-orange-400',
    badge: 'bg-risk-high border-risk-high text-orange-400',
  },
  medium: {
    border: 'border-yellow-500/20',
    bg: 'rgba(234,179,8,0.04)',
    dot: 'bg-yellow-500',
    label: 'text-yellow-400',
    badge: 'bg-risk-medium border-risk-medium text-yellow-400',
  },
};

function AlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false);
  const s = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
  const Icon = ICON_MAP[alert.icon] || ShieldAlert;

  return (
    <div
      className={`rounded-lg border ${s.border} transition-all duration-150 cursor-pointer`}
      style={{ background: s.bg }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon size={13} className={s.label} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200 leading-tight">{alert.title}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${s.badge}`}>
                {alert.severity}
              </span>
              {expanded ? <ChevronUp size={10} className="text-slate-600" /> : <ChevronDown size={10} className="text-slate-600" />}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-mono text-slate-600">{alert.timestamp}</span>
            <span className="text-[10px] font-mono text-slate-700">·</span>
            <span className="text-[10px] font-mono text-slate-500">{alert.category}</span>
            <span className="text-[10px] font-mono text-slate-700">·</span>
            <span className="text-[10px] font-mono text-slate-500">{alert.wallets} wallets</span>
            <span className="text-[10px] font-mono text-slate-700">·</span>
            <span className={`text-[10px] font-mono font-semibold ${s.label}`}>{alert.volume}</span>
          </div>
          {expanded && (
            <p className="text-[11px] font-mono text-slate-400 leading-relaxed mt-2 animate-fade-in">
              {alert.description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.dot}`} />
        </div>
      </div>
    </div>
  );
}

export default function AlertCards({ alerts }) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Active Alerts</span>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {criticalCount > 0 && <span className="text-red-400">{criticalCount} critical</span>}
          {criticalCount > 0 && highCount > 0 && <span className="text-slate-700">·</span>}
          {highCount > 0 && <span className="text-orange-400">{highCount} high</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
