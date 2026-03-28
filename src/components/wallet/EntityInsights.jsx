import { ShieldOff, Shuffle, Building2, Globe, AlertCircle, Wrench, Lock } from 'lucide-react';
import { ENTITY_COLORS } from '../../constants';

function EntityGroup({ title, icon: Icon, color, items, emptyText }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={11} style={{ color }} />
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: color + 'bb' }}>{title}</span>
        <span className="text-[10px] font-mono text-slate-700 ml-auto">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] font-mono text-slate-700 pl-3">{emptyText}</p>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className="pl-3 py-1.5 rounded" style={{ background: '#0e1420', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300">{item.name}</span>
                <span className={`text-[10px] font-mono font-semibold ${
                  item.riskLevel === 'critical' ? 'text-red-400' :
                  item.riskLevel === 'high' ? 'text-orange-400' :
                  item.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                }`}>{item.volume}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-slate-600">{item.address}</span>
                <span className="text-[10px] font-mono text-slate-700">·</span>
                <span className="text-[10px] font-mono text-slate-600">{item.interactionCount} int.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EntityInsights({ insights }) {
  return (
    <div className="w-56 flex-shrink-0 flex flex-col border-r border-white/5 overflow-hidden"
      style={{ background: '#0e0f18' }}>
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-white/5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Entity Exposure</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <EntityGroup
          title="Sanctioned Entities"
          icon={ShieldOff}
          color={ENTITY_COLORS.sanctioned}
          items={insights.sanctioned}
          emptyText="No sanctioned exposure"
        />
        <EntityGroup
          title="Mixers & Tumblers"
          icon={Shuffle}
          color={ENTITY_COLORS.mixer}
          items={insights.mixers}
          emptyText="No mixer interaction"
        />
        <EntityGroup
          title="Exchanges"
          icon={Building2}
          color={ENTITY_COLORS.exchange}
          items={insights.exchanges}
          emptyText="No exchange interaction"
        />
        <EntityGroup
          title="Bridges"
          icon={Globe}
          color={ENTITY_COLORS.bridge}
          items={insights.bridges}
          emptyText="No bridge use detected"
        />
        <EntityGroup
          title="Darknet Markets"
          icon={AlertCircle}
          color={ENTITY_COLORS.darknet}
          items={insights.darknet}
          emptyText="No darknet exposure"
        />
        <EntityGroup
          title="High-Risk Services"
          icon={Wrench}
          color={ENTITY_COLORS.high_risk_service}
          items={insights.highRiskServices}
          emptyText="No high-risk services"
        />
        <EntityGroup
          title="Ransomware-Linked"
          icon={Lock}
          color={ENTITY_COLORS.ransomware}
          items={insights.ransomware}
          emptyText="No ransomware exposure"
        />
      </div>
    </div>
  );
}
