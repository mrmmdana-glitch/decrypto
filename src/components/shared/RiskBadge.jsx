import { RISK_BG_CLASSES } from '../../constants';

const RISK_LABELS = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', unknown: 'Unknown' };

export default function RiskBadge({ level = 'unknown', score, size = 'sm', showLabel = true }) {
  const cls = RISK_BG_CLASSES[level] || RISK_BG_CLASSES.unknown;
  const label = RISK_LABELS[level] || 'Unknown';
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${pad} ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        level === 'critical' ? 'bg-red-400' :
        level === 'high' ? 'bg-orange-400' :
        level === 'medium' ? 'bg-yellow-400' :
        level === 'low' ? 'bg-green-400' : 'bg-slate-500'
      }`} />
      {showLabel && <span>{label}</span>}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
