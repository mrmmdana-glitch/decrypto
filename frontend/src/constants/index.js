export const ENTITY_COLORS = {
  wallet: '#7dd3fc',
  exchange: '#22d3ee',
  mixer: '#c084fc',
  bridge: '#38bdf8',
  sanctioned: '#f87171',
  contract: '#fb923c',
  darknet: '#a78bfa',
  scam_cluster: '#fb7185',
  laundering: '#f87171',
  high_risk_service: '#fb923c',
  escrow: '#fbbf24',
  ransomware: '#e11d48',
  unknown: '#64748b',
};

export const RISK_COLORS = {
  critical: '#f87171',
  high:     '#fb923c',
  medium:   '#fbbf24',
  low:      '#4ade80',
  unknown:  '#64748b',
};

export const ENTITY_LABELS = {
  wallet: 'Wallet',
  exchange: 'Exchange',
  mixer: 'Mixer / Tumbler',
  bridge: 'Cross-Chain Bridge',
  sanctioned: 'Sanctioned Entity',
  contract: 'Smart Contract',
  darknet: 'Darknet Market',
  scam_cluster: 'Scam Cluster',
  laundering: 'Laundering Network',
  high_risk_service: 'High-Risk Service',
  escrow: 'Escrow / Guarantee Mkt',
  ransomware: 'Ransomware-Linked',
  unknown: 'Unknown',
};

export const ENTITY_ICON_LETTERS = {
  wallet: 'W',
  exchange: 'E',
  mixer: 'M',
  bridge: 'B',
  sanctioned: '!',
  contract: '#',
  darknet: 'D',
  scam_cluster: 'S',
  laundering: 'L',
  high_risk_service: 'H',
  escrow: 'G',
  ransomware: 'R',
  unknown: '?',
};

export const RISK_BG_CLASSES = {
  critical: 'bg-risk-critical border border-risk-critical text-red-400',
  high: 'bg-risk-high border border-risk-high text-orange-400',
  medium: 'bg-risk-medium border border-risk-medium text-yellow-400',
  low: 'bg-risk-low border border-risk-low text-green-400',
  unknown: 'bg-slate-800 border border-slate-700 text-slate-400',
};
