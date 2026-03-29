import { ArrowLeft, ShieldAlert, Clock, Loader2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import NetworkScanGraph from './NetworkScanGraph';
import NetworkMetrics from './NetworkMetrics';
import AlertCards from './AlertCards';
import RankedEntities from './RankedEntities';
import { useNetworkScan } from '../../hooks/useNetworkScan';

export default function NetworkScanDashboard({ onBack, onAnalyseWallet }) {
  const {
    networkMetrics,
    rankedEntities,
    alertCards,
    graphData,
    loading,
    error,
    unavailable,
    refetch,
  } = useNetworkScan();

  const handleNodeClick = (node) => {
    if (node && onAnalyseWallet) {
      onAnalyseWallet(node.id);
    }
  };

  const criticalCount = (alertCards ?? []).filter((a) => a.severity === 'critical').length;
  const scanTime = networkMetrics?.scanTimestamp
    ? new Date(networkMetrics.scanTimestamp * 1000).toLocaleString()
    : '—';

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
          {loading ? (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
              <Loader2 size={10} className="animate-spin" />
              <span>Scanning network…</span>
            </div>
          ) : criticalCount > 0 ? (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>{criticalCount} critical alert{criticalCount !== 1 ? 's' : ''} active</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
          {networkMetrics && !unavailable && (
            <div className="flex items-center gap-1.5">
              <Clock size={10} />
              <span>{scanTime}</span>
            </div>
          )}
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Database size={10} />
            <span className="text-slate-400">
              {networkMetrics?.dataSource === 'local_dataset'
                ? 'Elliptic Dataset'
                : networkMetrics?.dataSource === 'unavailable'
                  ? 'Unavailable'
                  : 'Bitcoin Mainnet'}
            </span>
          </div>
          {error && (
            <button
              onClick={refetch}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
            >
              <RefreshCw size={9} /> Retry
            </button>
          )}
        </div>
      </div>

      {/* ── Unavailable state ── */}
      {unavailable && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
          <Database size={28} className="text-slate-700" />
          <span className="text-[13px] font-mono text-slate-500">Network data unavailable</span>
          <span className="text-[11px] font-mono text-slate-600 max-w-sm">
            {networkMetrics?.message ?? 'Place the Elliptic dataset files in backend/data/ to enable network scanning.'}
          </span>
          <code className="text-[10px] font-mono text-slate-700 mt-1">
            backend/data/wallets_features.csv<br />
            backend/data/wallets_classes.csv<br />
            backend/data/AddrAddr_edgelist.csv
          </code>
        </div>
      )}

      {/* ── Error state ── */}
      {error && !loading && !unavailable && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={22} className="text-red-400" />
          <span className="text-[12px] font-mono text-red-400">Scan failed</span>
          <span className="text-[10px] font-mono text-slate-500 max-w-xs text-center">{error}</span>
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 mt-1 px-3 py-1.5 text-[10px] font-mono text-slate-400 hover:text-slate-200 border border-white/10 rounded transition-colors"
          >
            <RefreshCw size={10} /> Retry
          </button>
        </div>
      )}

      {!unavailable && !error && (
        <>
          {/* ── Network Metrics ── */}
          <NetworkMetrics metrics={networkMetrics} loading={loading} />

          {/* ── Main section: Graph + Alerts ── */}
          <div className="flex flex-1 min-h-0">
            {/* Graph */}
            <NetworkScanGraph graphData={graphData} onNodeClick={handleNodeClick} loading={loading} />

            {/* Right: Alert cards */}
            <div className="w-80 flex-shrink-0 border-l"
              style={{ background: '#0e0f18', borderColor: 'rgba(139,92,246,0.1)' }}>
              <AlertCards alerts={alertCards} loading={loading} />
            </div>
          </div>

          {/* ── Bottom: Ranked entities ── */}
          <div
            className="flex-shrink-0"
            style={{ height: '220px', borderTop: '1px solid rgba(139,92,246,0.08)', background: '#0e0f18' }}
          >
            <RankedEntities entities={rankedEntities} onAnalyse={onAnalyseWallet} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}
