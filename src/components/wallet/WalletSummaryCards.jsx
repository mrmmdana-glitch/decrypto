import MetricCard from '../shared/MetricCard';
import {
  TrendingUp, TrendingDown, Shield, AlertTriangle, Users, RefreshCw, Layers, Activity
} from 'lucide-react';

export default function WalletSummaryCards({ metrics }) {
  return (
    <div className="flex-shrink-0 grid grid-cols-8 gap-2 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <MetricCard
        label="Risk Score"
        value={`${metrics.riskScore}/100`}
        sub={metrics.riskLevel.toUpperCase()}
        accent="red"
        icon={AlertTriangle}
      />
      <MetricCard
        label="Total Incoming"
        value={metrics.totalIncoming}
        sub={`${metrics.incomingTxCount} transactions`}
        accent="green"
        icon={TrendingDown}
      />
      <MetricCard
        label="Total Outgoing"
        value={metrics.totalOutgoing}
        sub={`${metrics.outgoingTxCount} transactions`}
        accent="red"
        icon={TrendingUp}
      />
      <MetricCard
        label="Stablecoin Share"
        value={metrics.stablecoinShare}
        sub="of total flow"
        accent="yellow"
        icon={RefreshCw}
      />
      <MetricCard
        label="Counterparties"
        value={metrics.uniqueCounterparties}
        sub="unique addresses"
        accent="blue"
        icon={Users}
      />
      <MetricCard
        label="Sanctions Exposure"
        value={metrics.sanctionedLinks > 0 ? `${metrics.sanctionedLinks} Links` : 'None'}
        sub="OFAC / CFSPs"
        accent={metrics.sanctionedLinks > 0 ? 'red' : 'slate'}
        icon={Shield}
      />
      <MetricCard
        label="Layering Score"
        value={`${metrics.layeringScore}/100`}
        sub="obfuscation index"
        accent="orange"
        icon={Layers}
      />
      <MetricCard
        label="Anomaly Score"
        value={`${metrics.anomalyScore}/100`}
        sub="behavioural deviation"
        accent="purple"
        icon={Activity}
      />
    </div>
  );
}
