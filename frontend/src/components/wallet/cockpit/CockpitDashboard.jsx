import { useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useWalletAnalysis } from '../../../hooks/useWalletAnalysis';
import { ENTITY_COLORS } from '../../../constants';
import { getFeatureInsight } from '../../../adapters/walletAdapter';

import CockpitCommandBar from './CockpitCommandBar';
import CockpitSidebar from './CockpitSidebar';
import CockpitGraph from './CockpitGraph';
import PathInspector from './PathInspector';
import CockpitMetrics from './CockpitMetrics';
import AnalysisTabs from './AnalysisTabs';
import GridScanBackground from './GridScanBackground';

const pageTransition = { type: 'spring', stiffness: 140, damping: 22, mass: 0.85 };

function deriveSignals(walletMetrics, alerts) {
  const signals = [];
  const seen = new Set();

  walletMetrics?.topFeatures?.slice(0, 3).forEach((feature) => {
    const insight = getFeatureInsight(feature);
    const value = `${insight.label}: ${insight.summary}`;
    if (!seen.has(value)) {
      seen.add(value);
      signals.push(value);
    }
  });

  alerts?.filter((a) => a.severity === 'critical' || a.severity === 'high')
    .slice(0, 2)
    .forEach((alert) => {
      if (!seen.has(alert.title)) {
        seen.add(alert.title);
        signals.push(alert.title);
      }
    });

  return signals.slice(0, 5);
}

function buildCompactSummary(walletMetrics, entityInsights) {
  if (!walletMetrics) return 'Analysis in progress.';

  const topFeature = walletMetrics.topFeatures?.[0];
  const featureLabel = topFeature ? getFeatureInsight(topFeature).label : null;
  const exposureCount = [
    entityInsights?.sanctioned ?? 0,
    entityInsights?.mixers ?? 0,
    entityInsights?.darknet ?? 0,
    entityInsights?.highRiskServices ?? 0,
  ].reduce((sum, value) => sum + value, 0);

  const summaryParts = [
    `${walletMetrics.riskLabel} wallet with ${walletMetrics.totalTxCount ?? 0} transactions across ${walletMetrics.uniqueCounterparties ?? 0} counterparties.`,
  ];

  if (featureLabel) {
    summaryParts.push(`Primary signal: ${featureLabel}.`);
  }

  if (exposureCount > 0) {
    summaryParts.push(`${exposureCount} higher-risk counterparty link${exposureCount === 1 ? '' : 's'} surfaced in the visible graph.`);
  } else {
    summaryParts.push('No elevated exposure surfaced in the visible graph.');
  }

  return summaryParts.join(' ');
}

function deriveExposure(entityInsights) {
  const items = [
    { label: 'Sanctioned entities', count: entityInsights?.sanctioned ?? 0, color: ENTITY_COLORS.sanctioned },
    { label: 'Mixers', count: entityInsights?.mixers ?? 0, color: ENTITY_COLORS.mixer },
    { label: 'Darknet links', count: entityInsights?.darknet ?? 0, color: ENTITY_COLORS.darknet },
    { label: 'High-risk services', count: entityInsights?.highRiskServices ?? 0, color: ENTITY_COLORS.high_risk_service },
    { label: 'Exchanges', count: entityInsights?.exchanges ?? 0, color: ENTITY_COLORS.exchange },
  ];

  return items.filter((item) => item.count > 0);
}

export default function CockpitDashboard({ address, onAnalyse, onClear, onBack }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const analysisRef = useRef(null);
  const hasActiveAddress = Boolean(address);

  const {
    walletMetrics,
    graph,
    transactions,
    entityInsights,
    counterpartyData,
    timelineData,
    alerts,
    loading,
    error,
    refetch,
  } = useWalletAnalysis(address);

  const suspiciousFeature = useMemo(
    () => (walletMetrics?.topFeatures?.length ? getFeatureInsight(walletMetrics.topFeatures[0]) : null),
    [walletMetrics]
  );

  const signals = useMemo(
    () => deriveSignals(walletMetrics, alerts),
    [walletMetrics, alerts]
  );

  const exposure = useMemo(
    () => deriveExposure(entityInsights),
    [entityInsights]
  );

  const compactSummary = useMemo(
    () => buildCompactSummary(walletMetrics, entityInsights),
    [walletMetrics, entityInsights]
  );

  const exposureCount = useMemo(() => {
    return [
      entityInsights?.sanctioned ?? 0,
      entityInsights?.mixers ?? 0,
      entityInsights?.darknet ?? 0,
      entityInsights?.highRiskServices ?? 0,
      entityInsights?.ransomware ?? 0,
    ].reduce((sum, value) => sum + value, 0);
  }, [entityInsights]);

  const highSeverityAlerts = useMemo(
    () => alerts?.filter((a) => a.severity === 'critical' || a.severity === 'high').length ?? 0,
    [alerts]
  );

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
    setSelectedPath(null);
  };

  const handlePathSelect = (path) => {
    setSelectedPath(path);
    setSelectedNode(null);
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
      requestAnimationFrame(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const handleClear = () => {
    setSelectedNode(null);
    setSelectedPath(null);
    onClear?.();
  };

  return (
    <div className="relative h-full overflow-y-auto" style={{ background: '#090a0f' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 32%)' }}
      />

      {!hasActiveAddress && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <GridScanBackground />
        </motion.div>
      )}

      <motion.div
        layout
        transition={pageTransition}
        className={
          hasActiveAddress
            ? 'relative z-[1] mx-auto max-w-[1580px] px-5 pb-8 pt-2'
            : 'relative z-[1] mx-auto flex min-h-full max-w-[1580px] items-center justify-center px-5 py-10'
        }
      >
        <motion.div layout transition={pageTransition} className="w-full">
          <CockpitCommandBar
            address={address}
            onBack={onBack}
            onAnalyse={onAnalyse}
            onClear={handleClear}
            flaggedReason={suspiciousFeature?.label}
            flaggedSummary={suspiciousFeature?.summary}
            centered={!hasActiveAddress}
          />

          <AnimatePresence mode="wait">
            {hasActiveAddress && (
              <motion.div
                key="analysis-content"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mt-3 space-y-3"
              >
                <CockpitSidebar
                  activeSection={activeSection}
                  onSectionChange={handleSectionChange}
                  txCount={walletMetrics?.totalTxCount}
                  counterparties={walletMetrics?.uniqueCounterparties}
                  alerts={highSeverityAlerts}
                />

                <div className="grid items-start gap-3 xl:h-[calc(100vh-172px)] xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] 2xl:grid-cols-[minmax(0,1.32fr)_minmax(400px,0.88fr)]">
                  <div className="relative min-w-0 xl:sticky xl:top-4 xl:h-[calc(100vh-188px)] xl:self-start">
                    <CockpitGraph
                      nodes={graph?.nodes ?? []}
                      links={graph?.links ?? []}
                      centerAddress={address}
                      onNodeSelect={handleNodeSelect}
                      onPathSelect={handlePathSelect}
                      selectedNodeId={selectedNode?.id}
                    />

                    {loading && (
                      <div
                        className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-[28px]"
                        style={{ background: 'rgba(8,10,15,0.84)', backdropFilter: 'blur(4px)' }}
                      >
                        <Loader2 size={24} className="animate-spin text-violet-300" />
                        <div className="mt-3 text-[12px] text-slate-300">Analysing wallet activity</div>
                        <div className="mt-1 text-[11px] text-slate-600">Building graph and risk profile...</div>
                      </div>
                    )}

                    {error && !loading && (
                      <div
                        className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-[28px]"
                        style={{ background: 'rgba(8,10,15,0.90)', backdropFilter: 'blur(4px)' }}
                      >
                        <AlertCircle size={24} className="text-red-400" />
                        <div className="mt-3 text-[12px] text-red-300">Analysis failed</div>
                        <div className="mt-1 max-w-xs text-center text-[11px] text-slate-500">{error}</div>
                        <button
                          onClick={refetch}
                          className="mt-4 flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-white"
                        >
                          <RefreshCw size={11} />
                          Retry
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-3 xl:max-h-[calc(100vh-188px)] xl:overflow-y-auto xl:pr-1">
                    <PathInspector
                      selectedNode={selectedNode}
                      selectedPath={selectedPath}
                      primaryPath={null}
                      centerAddress={address}
                      onClose={() => {
                        setSelectedNode(null);
                        setSelectedPath(null);
                      }}
                      fullWidth
                    />

                    <CockpitMetrics
                      riskScore={walletMetrics?.riskScore}
                      riskLabel={walletMetrics?.riskLabel}
                      riskLevel={walletMetrics?.riskLevel}
                      alertCount={highSeverityAlerts}
                      totalTxs={walletMetrics?.totalTxCount}
                      counterparties={walletMetrics?.uniqueCounterparties}
                      chain={walletMetrics?.chain}
                      outbound={walletMetrics?.totalOutgoing}
                      fees={walletMetrics?.feesTotal}
                      graphRelationships={graph?.links?.length}
                      exposureFlagged={exposureCount}
                    />

                    <div ref={analysisRef}>
                      <AnalysisTabs
                        summary={compactSummary}
                        signals={signals}
                        exposure={exposure}
                        counterparties={counterpartyData}
                        transactions={transactions}
                        alerts={alerts}
                        timelineData={timelineData}
                        activeTab={activeSection}
                        onTabChange={handleSectionChange}
                        showTabBar={false}
                        onSelectCounterparty={(counterparty) => {
                          const node = graph?.nodes?.find((candidate) => candidate.id === counterparty.address);
                          if (node) {
                            handleNodeSelect(node);
                            if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
                              requestAnimationFrame(() => {
                                analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              });
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
