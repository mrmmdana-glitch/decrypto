import MetricCard from '../shared/MetricCard';
import { Radar, Flag, TrendingUp, ShieldOff, Building2, Wrench, GitBranch, AlertTriangle } from 'lucide-react';

export default function NetworkMetrics({ metrics }) {
  return (
    <div className="flex-shrink-0 grid grid-cols-8 gap-2 px-4 py-2"
      style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}>
      <MetricCard
        label="Wallets Scanned"
        value={metrics.walletsScan}
        sub="Ethereum mainnet"
        accent="cyan"
        icon={Radar}
      />
      <MetricCard
        label="Flagged Wallets"
        value={metrics.flaggedWallets}
        sub={metrics.flaggedPct + ' of total'}
        accent="orange"
        icon={Flag}
      />
      <MetricCard
        label="Suspicious Txs"
        value={metrics.suspiciousTxCount}
        sub="past 30 days"
        accent="yellow"
        icon={TrendingUp}
      />
      <MetricCard
        label="Sanctions Exposure"
        value={metrics.sanctionedExposure}
        sub="OFAC / CFSPs"
        accent="red"
        icon={ShieldOff}
      />
      <MetricCard
        label="Exchange-Linked"
        value={metrics.exchangeLinkedEntities.toLocaleString()}
        sub="entities"
        accent="blue"
        icon={Building2}
      />
      <MetricCard
        label="High-Risk Services"
        value={metrics.highRiskServiceInteractions.toLocaleString()}
        sub="interactions"
        accent="orange"
        icon={Wrench}
      />
      <MetricCard
        label="Laundering Paths"
        value={metrics.launderingPathsDetected}
        sub="detected chains"
        accent="purple"
        icon={GitBranch}
      />
      <MetricCard
        label="Network Risk Index"
        value={`${metrics.networkRiskIndex}/10`}
        sub="overall score"
        accent="red"
        icon={AlertTriangle}
      />
    </div>
  );
}
