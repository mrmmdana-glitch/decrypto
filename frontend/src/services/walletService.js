import { walletApi } from '../api/endpoints';
import { normalizeGraph, normalizeWalletRisk, riskScoreToDisplay } from '../adapters/walletAdapter';

export async function fetchWalletAnalysis(address) {
  const raw = await walletApi.analyse(address);
  return normalizeWalletRisk(raw, address);
}

export async function fetchWalletGraph(address) {
  const [walletRaw, graphRaw] = await Promise.all([
    walletApi.analyse(address),
    walletApi.graph(address),
  ]);

  return normalizeGraph(graphRaw, walletRaw);
}

export async function fetchRiskPrediction(address) {
  const raw = await walletApi.predict(address);
  return {
    score: riskScoreToDisplay(raw.risk_score),
    label: raw.risk_label ?? 'unknown',
    confidence: raw.risk_score ?? 0,
    signals: raw.top_features ?? [],
  };
}
