import { networkApi } from '../api/endpoints';

function normaliseNetworkScan(raw) {
  return {
    walletsScanned: raw.wallets_scanned ?? 0,
    flaggedWallets: raw.flagged_wallets ?? 0,
    flaggedPct: raw.flagged_pct ?? 0,
    networkRiskIndex: raw.network_risk_index ?? 0,
    rankedEntities: raw.ranked_entities ?? [],
    graph: raw.graph ?? { nodes: [], edges: [] },
    dataSource: raw.data_source ?? 'unavailable',
    message: raw.message ?? null,
  };
}

export async function fetchNetworkScan() {
  const raw = await networkApi.summary();
  return normaliseNetworkScan(raw);
}
