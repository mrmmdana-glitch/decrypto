export default function MetricCard({ label, value, sub, accent, icon: Icon, trend, onClick, className = '' }) {
  const accentColor = {
    cyan: 'text-purple-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    slate: 'text-slate-400',
  }[accent] || 'text-slate-300';

  const borderColor = {
    cyan: 'border-purple-500/20 hover:border-purple-500/35',
    red: 'border-red-500/20 hover:border-red-500/40',
    orange: 'border-orange-500/20 hover:border-orange-500/40',
    yellow: 'border-yellow-500/20 hover:border-yellow-500/40',
    green: 'border-green-500/20 hover:border-green-500/40',
    purple: 'border-purple-500/20 hover:border-purple-500/40',
    blue: 'border-blue-500/20 hover:border-blue-500/40',
  }[accent] || 'border-white/5 hover:border-white/10';

  return (
    <div
      className={`card-surface border ${borderColor} p-3 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">{label}</span>
        {Icon && <Icon size={12} className="text-slate-600 mt-0.5" />}
      </div>
      <div className={`text-lg font-semibold font-mono leading-tight ${accentColor}`}>{value}</div>
      {sub && (
        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{sub}</div>
      )}
      {trend && (
        <div className={`text-[10px] mt-1 font-mono ${trend.up ? 'text-red-400' : 'text-green-400'}`}>
          {trend.up ? '▲' : '▼'} {trend.label}
        </div>
      )}
    </div>
  );
}
