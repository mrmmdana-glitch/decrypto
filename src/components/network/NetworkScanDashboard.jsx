import { ArrowLeft, ShieldAlert, Clock } from 'lucide-react';
import NetworkScanGraph from './NetworkScanGraph';
import NetworkMetrics from './NetworkMetrics';
import AlertCards from './AlertCards';
import RankedEntities from './RankedEntities';
import { networkMetrics, alertCards, rankedSuspiciousEntities, networkGraphData } from '../../data/mockNetworkData';

export default function NetworkScanDashboard({ onBack, onAnalyseWallet }) {
  const handleNodeClick = (node) => {
    if (node && onAnalyseWallet) {
      onAnalyseWallet(node.id);
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: '#090a0f' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 h-12"
        style={{ background: '#0e0f18', borderBottom: '1px solid rgba(139,92,246,0.12)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={13} />
            Back
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={13} style={{ color: '#8b5cf6' }} />
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Network Surveillance</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>{alertCards.filter(a => a.severity === 'critical').length} critical alerts active</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock size={10} />
            <span>{networkMetrics.scanTimestamp}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div>
            Chain: <span className="text-slate-400">Ethereum Mainnet</span>
          </div>
        </div>
      </div>

      {/* ── Network Metrics ── */}
      <NetworkMetrics metrics={networkMetrics} />

      {/* ── Main section: Graph + Alerts ── */}
      <div className="flex flex-1 min-h-0">
        {/* Graph */}
        <NetworkScanGraph graphData={networkGraphData} onNodeClick={handleNodeClick} />

        {/* Right: Alert cards */}
        <div className="w-80 flex-shrink-0 border-l"
          style={{ background: '#0e0f18', borderColor: 'rgba(139,92,246,0.1)' }}>
          <AlertCards alerts={alertCards} />
        </div>
      </div>

      {/* ── Bottom: Ranked entities ── */}
      <div
        className="flex-shrink-0"
        style={{ height: '220px', borderTop: '1px solid rgba(139,92,246,0.08)', background: '#0e0f18' }}
      >
        <RankedEntities entities={rankedSuspiciousEntities} onAnalyse={onAnalyseWallet} />
      </div>
    </div>
  );
}
