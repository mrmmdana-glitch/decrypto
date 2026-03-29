import RiskBadge from '../shared/RiskBadge';
import EntityBadge from '../shared/EntityBadge';
import { ExternalLink } from 'lucide-react';

export default function RankedEntities({ entities, onAnalyse }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">Highest-Risk Entities</span>
        <span className="text-[10px] font-mono text-slate-600">Ranked by risk score</span>
      </div>

      {/* Column headers */}
      <div className="flex-shrink-0 grid text-[9px] font-mono uppercase tracking-widest text-slate-700 px-4 py-1.5"
        style={{
          gridTemplateColumns: '28px 130px 110px 80px 95px 70px 60px auto',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
        <span>#</span>
        <span>Address</span>
        <span>Label</span>
        <span>Type</span>
        <span>Primary Flag</span>
        <span className="text-right">Volume</span>
        <span className="text-right">Risk</span>
        <span></span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {entities.map((ent) => (
          <div
            key={ent.rank}
            className="grid px-4 py-2 border-b border-white/[0.025] hover:bg-white/[0.02] transition-colors items-center"
            style={{ gridTemplateColumns: '28px 130px 110px 80px 95px 70px 60px auto' }}
          >
            <span className="text-[11px] font-mono text-slate-600">{ent.rank}</span>
            <span className="text-[11px] font-mono text-slate-400 truncate">{ent.address}</span>
            <span className="text-[11px] text-slate-300 truncate">{ent.label}</span>
            <div>
              <EntityBadge type={ent.type} size="xs" />
            </div>
            <span className={`text-[10px] font-mono truncate ${
              ent.riskScore >= 90 ? 'text-red-400' :
              ent.riskScore >= 70 ? 'text-orange-400' :
              ent.riskScore >= 50 ? 'text-yellow-400' : 'text-slate-500'
            }`}>
              {ent.primaryFlag}
            </span>
            <span className={`text-[11px] font-mono text-right ${
              ent.riskScore >= 90 ? 'text-red-400' : ent.riskScore >= 70 ? 'text-orange-400' : 'text-slate-400'
            }`}>
              {ent.volume}
            </span>
            <div className="flex justify-end">
              <RiskBadge
                level={ent.riskScore >= 90 ? 'critical' : ent.riskScore >= 70 ? 'high' : ent.riskScore >= 50 ? 'medium' : 'low'}
                score={ent.riskScore}
                size="xs"
                showLabel={false}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => onAnalyse && onAnalyse(ent.address)}
                className="text-slate-600 hover:text-purple-400 transition-colors"
                title="Investigate this wallet"
              >
                <ExternalLink size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
