import { ENTITY_COLORS, ENTITY_LABELS } from '../../constants';

export default function EntityBadge({ type = 'unknown', size = 'sm' }) {
  const color = ENTITY_COLORS[type] || '#64748b';
  const label = ENTITY_LABELS[type] || type;
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded ${pad}`}
      style={{
        backgroundColor: color + '18',
        border: `1px solid ${color}40`,
        color: color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
