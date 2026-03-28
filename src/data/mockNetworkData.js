export const networkMetrics = {
  walletsScan: '1,247,839',
  flaggedWallets: '3,412',
  flaggedPct: '0.27%',
  suspiciousTxCount: '47,283',
  sanctionedExposure: 126,
  exchangeLinkedEntities: 8741,
  highRiskServiceInteractions: 2893,
  launderingPathsDetected: 34,
  networkRiskIndex: 7.4,
  scanTimestamp: 'March 28, 2026 — 18:43 UTC',
};

export const alertCards = [
  {
    id: 'alert_001',
    severity: 'critical',
    title: 'Sanctions-Linked Exposure Detected',
    description: 'Cluster of 14 wallets found transacting directly with OFAC-designated entities. Combined exposure: $4.2M. Wallets routed through Garantex and Tornado Cash.',
    wallets: 14,
    volume: '$4.2M',
    timestamp: '2 minutes ago',
    category: 'Sanctions Screening',
    icon: 'shield-alert',
  },
  {
    id: 'alert_002',
    severity: 'critical',
    title: 'Possible Laundering Chain Identified',
    description: 'Multi-hop layering path detected across 7 intermediary wallets. Funds originating from darknet market proceeds funnelled through unverified contracts to exchange deposit addresses over 18 hours.',
    wallets: 7,
    volume: '$2.1M',
    timestamp: '11 minutes ago',
    category: 'Layering Detection',
    icon: 'git-branch',
  },
  {
    id: 'alert_003',
    severity: 'critical',
    title: 'Suspicious Funnel Behaviour',
    description: '83 wallets simultaneously routing funds into a single aggregator address. Pattern consistent with structured fund consolidation prior to cashing out.',
    wallets: 83,
    volume: '$8.7M',
    timestamp: '34 minutes ago',
    category: 'Funnel Pattern',
    icon: 'filter',
  },
  {
    id: 'alert_004',
    severity: 'high',
    title: 'Unusual Transaction Burst Detected',
    description: 'Target wallet 0x4f2C...91e3 executed 47 outbound transactions within 6 minutes. Volume: $1.3M across 23 unique counterparties. Anomaly score: 94.',
    wallets: 1,
    volume: '$1.3M',
    timestamp: '1 hour ago',
    category: 'Anomaly Detection',
    icon: 'zap',
  },
  {
    id: 'alert_005',
    severity: 'high',
    title: 'Rapid Redistribution Across Multiple Wallets',
    description: 'Hub wallet receiving funds from 1 source then distributed to 31 wallets within 40 minutes. Classic hub-and-spoke redistribution consistent with ransomware cash-out.',
    wallets: 32,
    volume: '$3.4M',
    timestamp: '2 hours ago',
    category: 'Hub-and-Spoke',
    icon: 'share-2',
  },
  {
    id: 'alert_006',
    severity: 'high',
    title: 'Repeated High-Risk Service Interaction',
    description: 'Wallet cluster (6 addresses) repeatedly transacting with 3 separate unregistered OTC desks. USDT-heavy flow. 14 interactions over 72 hours.',
    wallets: 6,
    volume: '$890K',
    timestamp: '3 hours ago',
    category: 'High-Risk Service',
    icon: 'repeat',
  },
  {
    id: 'alert_007',
    severity: 'medium',
    title: 'Suspicious Clustering Pattern Observed',
    description: 'New cluster of 22 previously unlinked wallets exhibiting correlated transaction timing and similar counterparty sets. Possible coordinated operation.',
    wallets: 22,
    volume: '$560K',
    timestamp: '5 hours ago',
    category: 'Cluster Analysis',
    icon: 'hexagon',
  },
  {
    id: 'alert_008',
    severity: 'medium',
    title: 'Stablecoin-Heavy Suspicious Flow',
    description: 'Large volume of USDT flow (92% stablecoin share) concentrated through a small cluster. Pattern consistent with value preservation during obfuscation.',
    wallets: 9,
    volume: '$2.8M',
    timestamp: '6 hours ago',
    category: 'Stablecoin Flow',
    icon: 'dollar-sign',
  },
];

export const rankedSuspiciousEntities = [
  { rank: 1, address: '0x0E3f6B9c...D1f4B7', label: 'Layering Hub Alpha', type: 'laundering', riskScore: 96, primaryFlag: 'Laundering Network Node', volume: '$4.2M', txCount: 234, linkedWallets: 47 },
  { rank: 2, address: '0x7f26...9B', label: 'Tornado Cash', type: 'mixer', riskScore: 95, primaryFlag: 'OFAC-Sanctioned Mixer', volume: '$12.8M', txCount: 891, linkedWallets: 312 },
  { rank: 3, address: '0xD4e8...3F2a', label: 'Ransomware Hub', type: 'ransomware', riskScore: 94, primaryFlag: 'Ransomware Cash-Out', volume: '$3.1M', txCount: 78, linkedWallets: 31 },
  { rank: 4, address: '0x8f3C...43f2', label: 'Unknown Wallet', type: 'wallet', riskScore: 87, primaryFlag: 'Layering + Sanctions Exposure', volume: '$2.8M', txCount: 223, linkedWallets: 47 },
  { rank: 5, address: '0xA1b2...A9b0', label: 'Garantex', type: 'sanctioned', riskScore: 98, primaryFlag: 'OFAC-Sanctioned Exchange', volume: '$8.4M', txCount: 1247, linkedWallets: 892 },
  { rank: 6, address: '0xF4c1...9D3e', label: 'Scam Coordinator', type: 'scam_cluster', riskScore: 88, primaryFlag: 'Phishing + Rug Pull Operator', volume: '$1.7M', txCount: 167, linkedWallets: 89 },
  { rank: 7, address: '0x6B9e...2A4c', label: 'OTC Cash-Out Desk', type: 'high_risk_service', riskScore: 85, primaryFlag: 'Unregistered OTC Service', volume: '$5.1M', txCount: 342, linkedWallets: 156 },
  { rank: 8, address: '0x3E6c...f4Ab', label: 'Darknet Escrow', type: 'escrow', riskScore: 79, primaryFlag: 'Darknet Market Escrow', volume: '$890K', txCount: 89, linkedWallets: 34 },
  { rank: 9, address: '0x9e3F...3E1f', label: 'Hydra-Linked Wallet', type: 'darknet', riskScore: 97, primaryFlag: 'Darknet Market Proceeds', volume: '$2.3M', txCount: 156, linkedWallets: 43 },
  { rank: 10, address: '0x4A7d...a8D1', label: 'Obfuscation Contract', type: 'contract', riskScore: 76, primaryFlag: 'Unverified Proxy Contract', volume: '$3.4M', txCount: 445, linkedWallets: 78 },
];

// Network-wide graph data — multi-cluster layout for whole-network scan
const buildNetworkGraph = () => {
  const nodes = [];
  const links = [];

  // Cluster 1: Sanctioned Hub (red core)
  nodes.push({ id: 'sanctioned_hub', label: 'OFAC Hub', shortLabel: 'Sanctions Hub', type: 'sanctioned', riskScore: 98, riskLevel: 'critical', volume: 8400000, txCount: 1247, entityLabel: 'Garantex / SDN Hub' });
  for (let i = 0; i < 8; i++) {
    const id = `sanc_feeder_${i}`;
    nodes.push({ id, shortLabel: `Feeder ${i+1}`, type: 'wallet', riskScore: 70 + i * 3, riskLevel: 'high', volume: 200000 + i * 50000, txCount: 20 + i * 5, entityLabel: 'High-Risk Wallet' });
    links.push({ source: id, target: 'sanctioned_hub', value: 200000 + i * 50000, risk: 'critical' });
  }

  // Cluster 2: Mixer Network (purple)
  nodes.push({ id: 'tornado_cash', label: 'Tornado Cash', shortLabel: 'Tornado Cash', type: 'mixer', riskScore: 95, riskLevel: 'critical', volume: 12800000, txCount: 891, entityLabel: 'Tornado Cash (OFAC)' });
  for (let i = 0; i < 7; i++) {
    const id = `mixer_user_${i}`;
    nodes.push({ id, shortLabel: `Mixer User ${i+1}`, type: 'wallet', riskScore: 60 + i * 4, riskLevel: i > 3 ? 'high' : 'medium', volume: 150000 + i * 80000, txCount: 10 + i * 8, entityLabel: 'Mixer User' });
    links.push({ source: id, target: 'tornado_cash', value: 150000 + i * 80000, risk: i > 3 ? 'critical' : 'high' });
  }
  links.push({ source: 'tornado_cash', target: 'sanctioned_hub', value: 3200000, risk: 'critical' });

  // Cluster 3: Ransomware Distribution Hub
  nodes.push({ id: 'ransomware_hub', label: 'Ransomware Hub', shortLabel: 'RW Hub', type: 'ransomware', riskScore: 94, riskLevel: 'critical', volume: 3100000, txCount: 78, entityLabel: 'LockBit Cash-Out Hub' });
  for (let i = 0; i < 5; i++) {
    const id = `rw_wallet_${i}`;
    nodes.push({ id, shortLabel: `RW Wallet ${i+1}`, type: 'wallet', riskScore: 80 + i * 2, riskLevel: 'critical', volume: 300000 + i * 100000, txCount: 8 + i * 3, entityLabel: 'Ransomware Wallet' });
    links.push({ source: id, target: 'ransomware_hub', value: 300000 + i * 100000, risk: 'critical' });
  }
  links.push({ source: 'ransomware_hub', target: 'tornado_cash', value: 1200000, risk: 'critical' });

  // Cluster 4: Exchange Cluster (cyan)
  nodes.push({ id: 'binance', shortLabel: 'Binance', type: 'exchange', riskScore: 15, riskLevel: 'low', volume: 45000000, txCount: 12000, entityLabel: 'Binance Exchange' });
  nodes.push({ id: 'kraken', shortLabel: 'Kraken', type: 'exchange', riskScore: 18, riskLevel: 'low', volume: 12000000, txCount: 4200, entityLabel: 'Kraken Exchange' });
  nodes.push({ id: 'coinbase', shortLabel: 'Coinbase', type: 'exchange', riskScore: 12, riskLevel: 'low', volume: 38000000, txCount: 9800, entityLabel: 'Coinbase Exchange' });
  for (let i = 0; i < 6; i++) {
    const id = `exchange_user_${i}`;
    nodes.push({ id, shortLabel: `Ex. User ${i+1}`, type: 'wallet', riskScore: 15 + i * 5, riskLevel: 'low', volume: 50000 + i * 30000, txCount: 5 + i * 3, entityLabel: 'Exchange User' });
    links.push({ source: id, target: i % 2 === 0 ? 'binance' : 'kraken', value: 50000 + i * 30000, risk: 'low' });
  }

  // Cluster 5: Darknet Market Cluster
  nodes.push({ id: 'hydra_market', shortLabel: 'Hydra Market', type: 'darknet', riskScore: 97, riskLevel: 'critical', volume: 4200000, txCount: 567, entityLabel: 'Hydra Darknet Market' });
  nodes.push({ id: 'escrow_contract', shortLabel: 'Escrow Mkt', type: 'escrow', riskScore: 79, riskLevel: 'high', volume: 890000, txCount: 89, entityLabel: 'Darknet Escrow Service' });
  for (let i = 0; i < 6; i++) {
    const id = `darknet_seller_${i}`;
    nodes.push({ id, shortLabel: `Seller ${i+1}`, type: 'wallet', riskScore: 75 + i * 3, riskLevel: 'high', volume: 100000 + i * 60000, txCount: 15 + i * 5, entityLabel: 'Darknet Seller' });
    links.push({ source: id, target: 'hydra_market', value: 100000 + i * 60000, risk: 'critical' });
  }
  links.push({ source: 'hydra_market', target: 'escrow_contract', value: 890000, risk: 'high' });
  links.push({ source: 'hydra_market', target: 'tornado_cash', value: 2100000, risk: 'critical' });

  // Cluster 6: Scam / Rug Pull cluster
  nodes.push({ id: 'scam_coordinator', shortLabel: 'Scam Coord.', type: 'scam_cluster', riskScore: 88, riskLevel: 'critical', volume: 1700000, txCount: 167, entityLabel: 'Phishing Coordinator' });
  for (let i = 0; i < 5; i++) {
    const id = `scam_wallet_${i}`;
    nodes.push({ id, shortLabel: `Scam Wallet ${i+1}`, type: 'scam_cluster', riskScore: 80 + i * 2, riskLevel: 'critical', volume: 120000 + i * 40000, txCount: 20 + i * 6, entityLabel: 'Scam Wallet' });
    links.push({ source: id, target: 'scam_coordinator', value: 120000 + i * 40000, risk: 'critical' });
  }

  // Laundering Network (bridge between clusters)
  nodes.push({ id: 'layering_hub_a', shortLabel: 'Layering Hub A', type: 'laundering', riskScore: 96, riskLevel: 'critical', volume: 4200000, txCount: 234, entityLabel: 'Layering Network Node' });
  nodes.push({ id: 'layering_hub_b', shortLabel: 'Layering Hub B', type: 'laundering', riskScore: 91, riskLevel: 'critical', volume: 2100000, txCount: 145, entityLabel: 'Layering Network Node' });
  for (let i = 0; i < 4; i++) {
    const id = `launder_relay_${i}`;
    nodes.push({ id, shortLabel: `Relay ${i+1}`, type: 'wallet', riskScore: 72 + i * 4, riskLevel: 'high', volume: 300000 + i * 100000, txCount: 30 + i * 10, entityLabel: 'Layering Relay' });
    links.push({ source: 'layering_hub_a', target: id, value: 300000 + i * 100000, risk: 'high' });
    links.push({ source: id, target: 'layering_hub_b', value: 200000 + i * 70000, risk: 'high' });
  }
  links.push({ source: 'layering_hub_a', target: 'binance', value: 1800000, risk: 'medium' });
  links.push({ source: 'layering_hub_b', target: 'tornado_cash', value: 900000, risk: 'critical' });
  links.push({ source: 'sanctioned_hub', target: 'layering_hub_a', value: 2400000, risk: 'critical' });
  links.push({ source: 'ransomware_hub', target: 'layering_hub_a', value: 900000, risk: 'critical' });

  // OTC and Bridge nodes
  nodes.push({ id: 'otc_desk', shortLabel: 'OTC Desk', type: 'high_risk_service', riskScore: 85, riskLevel: 'critical', volume: 5100000, txCount: 342, entityLabel: 'Unregistered OTC' });
  nodes.push({ id: 'stargate', shortLabel: 'Stargate', type: 'bridge', riskScore: 42, riskLevel: 'medium', volume: 9200000, txCount: 2400, entityLabel: 'Stargate Bridge' });
  nodes.push({ id: 'across', shortLabel: 'Across Protocol', type: 'bridge', riskScore: 38, riskLevel: 'medium', volume: 6800000, txCount: 1800, entityLabel: 'Across Bridge' });
  links.push({ source: 'layering_hub_b', target: 'otc_desk', value: 1200000, risk: 'critical' });
  links.push({ source: 'layering_hub_a', target: 'stargate', value: 800000, risk: 'medium' });
  links.push({ source: 'scam_coordinator', target: 'across', value: 400000, risk: 'high' });

  return { nodes, links };
};

export const networkGraphData = buildNetworkGraph();
