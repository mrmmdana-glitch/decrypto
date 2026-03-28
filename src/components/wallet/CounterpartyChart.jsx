import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ENTITY_COLORS, RISK_COLORS } from '../../constants';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 text-[11px] font-mono space-y-1">
      <div className="text-slate-300 mb-1">{d.name}</div>
      <div style={{ color: ENTITY_COLORS[d.type] || '#64748b' }}>Type: {d.type}</div>
      <div style={{ color: RISK_COLORS[d.riskLevel] || '#64748b' }}>
        Volume: ${(d.volume / 1000).toFixed(0)}K
      </div>
    </div>
  );
};

export default function CounterpartyChart({ data }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Top Counterparties by Volume</span>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
            <XAxis
              type="number"
              tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v / 1000}K`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="volume" radius={[0, 2, 2, 0]} maxBarSize={10}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={ENTITY_COLORS[entry.type] || '#64748b'}
                  fillOpacity={entry.riskLevel === 'critical' ? 0.9 : entry.riskLevel === 'high' ? 0.75 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
