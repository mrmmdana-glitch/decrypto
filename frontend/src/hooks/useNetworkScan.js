import { useState, useEffect, useCallback } from 'react';
import { fetchNetworkSummary } from '../services/api';
import {
  normalizeNetworkSummary,
  normalizeRankedEntities,
  deriveNetworkAlerts,
  normalizeNetworkGraph,
} from '../adapters/networkAdapter';

/**
 * Fetches and normalises the network summary for NetworkScanDashboard.
 *
 * @returns {{
 *   networkMetrics: object | null,
 *   rankedEntities: Array,
 *   alertCards: Array,
 *   graphData: { nodes: Array, links: Array } | null,
 *   loading: boolean,
 *   error: string | null,
 *   unavailable: boolean,
 *   refetch: () => void,
 * }}
 */
export function useNetworkScan() {
  const [state, setState] = useState({
    networkMetrics: null,
    rankedEntities: [],
    alertCards: [],
    graphData: null,
    loading: false,
    error: null,
    unavailable: false,
  });

  const run = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetchNetworkSummary();

      const networkMetrics = normalizeNetworkSummary(response);
      const rankedEntities = normalizeRankedEntities(response.ranked_entities ?? []);
      const alertCards = deriveNetworkAlerts(networkMetrics, rankedEntities);
      const graphData = normalizeNetworkGraph(response.graph, rankedEntities);

      setState({
        networkMetrics,
        rankedEntities,
        alertCards,
        graphData,
        loading: false,
        error: null,
        unavailable: networkMetrics.unavailable,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err.message ?? 'Failed to load network scan data.',
        unavailable: false,
      }));
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, refetch: run };
}
