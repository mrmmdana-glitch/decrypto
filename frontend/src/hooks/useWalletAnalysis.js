import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWalletRisk, fetchWalletGraph } from '../services/api';
import {
  normalizeWalletRisk,
  normalizeGraph,
  deriveEntityInsights,
  deriveCounterpartyData,
  deriveTransactionsFromEdges,
  deriveAlerts,
  deriveTimelineData,
} from '../adapters/walletAdapter';

/**
 * Fetches and derives all data needed by WalletDashboard for a given address.
 *
 * @param {string | null} address  Bitcoin address to analyse
 * @returns {{
 *   walletMetrics: object | null,
 *   graph: { nodes: Array, links: Array } | null,
 *   transactions: Array,
 *   entityInsights: object | null,
 *   counterpartyData: Array,
 *   timelineData: Array,
 *   alerts: Array,
 *   walletRiskRaw: object | null,
 *   graphRaw: object | null,
 *   loading: boolean,
 *   error: string | null,
 *   refetch: () => void,
 * }}
 */
export function useWalletAnalysis(address) {
  const [state, setState] = useState({
    walletMetrics: null,
    graph: null,
    transactions: [],
    entityInsights: null,
    counterpartyData: [],
    timelineData: [],
    alerts: [],
    walletRiskRaw: null,
    graphRaw: null,
    loading: false,
    error: null,
  });

  // Track whether the request that triggered setState is still current
  const requestRef = useRef(0);

  const buildFallbackGraphResponse = useCallback(() => ({
    center_wallet: address,
    nodes: address
      ? [{ id: address, label: address, type: 'wallet', is_center: true }]
      : [],
    edges: [],
  }), [address]);

  const run = useCallback(async () => {
    if (!address) return;

    const requestId = ++requestRef.current;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const riskResponse = await fetchWalletRisk(address);

      if (requestId !== requestRef.current) return; // stale

      const walletMetrics = normalizeWalletRisk(riskResponse, address);
      const initialAlerts = deriveAlerts(riskResponse);

      setState((prev) => ({
        ...prev,
        walletMetrics,
        alerts: initialAlerts,
        walletRiskRaw: riskResponse,
        loading: true,
        error: null,
      }));

      let graphResponse = buildFallbackGraphResponse();
      let graphWarning = null;

      try {
        // Fetch graph after wallet risk so the backend can reuse cached tx history.
        graphResponse = await fetchWalletGraph(address);
      } catch (err) {
        graphWarning = err?.message ?? 'Transaction graph is currently unavailable.';
      }

      if (requestId !== requestRef.current) return; // stale
      const graph = normalizeGraph(graphResponse, riskResponse);
      const transactions = deriveTransactionsFromEdges(graph.links, address);
      const entityInsights = deriveEntityInsights(graph.nodes);
      const counterpartyData = deriveCounterpartyData(graph.nodes, graph.links, address);
      const timelineData = deriveTimelineData(transactions);
      const alerts = [...initialAlerts];

      if (graphWarning) {
        alerts.unshift({
          id: 'graph-unavailable',
          severity: 'medium',
          title: 'Transaction graph unavailable',
          description: `${graphWarning} Wallet risk metrics are still shown below.`,
          timestamp: new Date().toISOString(),
        });
      }

      setState({
        walletMetrics,
        graph,
        transactions,
        entityInsights,
        counterpartyData,
        timelineData,
        alerts,
        walletRiskRaw: riskResponse,
        graphRaw: graphResponse,
        loading: false,
        error: null,
      });
    } catch (err) {
      if (requestId !== requestRef.current) return;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.message ?? 'An unexpected error occurred.',
      }));
    }
  }, [address, buildFallbackGraphResponse]);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, refetch: run };
}
