import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="card-surface px-3 py-2 text-[11px] font-mono space-y-1">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((point) => (
        <div key={point.dataKey} style={{ color: point.color }}>
          {point.dataKey === 'incoming' ? 'In' : 'Out'}: {Number(point.value ?? 0).toFixed(4)} BTC
        </div>
      ))}
    </div>
  );
};

export default function TimelineChart({ data }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Transaction Activity · 12 Months</span>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Number(value ?? 0).toFixed(2)} BTC`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="incoming"
              stroke="#22c55e"
              strokeWidth={1.5}
              fill="url(#inGrad)"
              dot={false}
              activeDot={{ r: 3, fill: '#22c55e' }}
            />
            <Area
              type="monotone"
              dataKey="outgoing"
              stroke="#ef4444"
              strokeWidth={1.5}
              fill="url(#outGrad)"
              dot={false}
              activeDot={{ r: 3, fill: '#ef4444' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
