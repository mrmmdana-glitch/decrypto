/**
 * WalletGraph — Spatial clarity rebuild
 *
 * Key improvements vs previous version:
 *  1. Much stronger repulsion (-350) + longer link distance (120-200px)
 *  2. Density control: Low / Medium / Full  (caps visible nodes + edges)
 *  3. Cluster meta-nodes that expand on click — replaces raw peripheral nodes
 *  4. Edge pruning — only Top-N edges shown per density tier, others fade/hide
 *  5. Directional spread: outgoing nodes lean right, incoming lean left
 *  6. Cluster padding zones via repulsion between cluster centroids
 *  7. Compressed node-size range (smaller variance)
 *  8. Particles only on suspicious / high-volume paths
 *  9. Zoom-based decluttering: labels + halos fade at low zoom
 * 10. Centre node is fixed; ring-1 uses structured radial; outer nodes free
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  Eye, AlertTriangle, ArrowRight, Layers,
  ChevronDown, ChevronUp, ZoomIn, ZoomOut,
} from 'lucide-react';
import { ENTITY_COLORS, RISK_COLORS, ENTITY_ICON_LETTERS } from '../../constants';
import { TARGET_WALLET } from '../../data/mockWalletData';
import HoverTooltip from './HoverTooltip';

// ─────────────────────────────────────────────────────────────────────────────
// DENSITY TIERS
// Each tier clamps the max nodes from ring-1 and ring-2 shown, and caps edges.
// ─────────────────────────────────────────────────────────────────────────────
const DENSITY_TIERS = {
  low:    { ring1Max: 6,  ring2Max: 0, edgeMax: 8,  label: 'Essential', subLabel: 'Top connections only' },
  medium: { ring1Max: 10, ring2Max: 3, edgeMax: 14, label: 'Standard',  subLabel: 'Direct + key 2° nodes' },
  full:   { ring1Max: 99, ring2Max: 99, edgeMax: 99, label: 'Full Graph', subLabel: 'All connections visible' },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLUSTER DEFINITIONS  (semantic groupings for meta-nodes + halos)
// ─────────────────────────────────────────────────────────────────────────────
const CLUSTER_DEFS = [
  {
    id: 'exchange',
    label: 'Exchange Layer',
    sublabel: 'KYC-compliant cash-out',
    color: '#22d3ee',
    side: 'right',          // directional spread — right = cash-out
    nodeIds: [
      '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
      '0xFb9C4C11a5C8d8A8b031f9e7B2c5D3e6f4a8b012',
    ],
  },
  {
    id: 'obfuscation',
    label: 'Obfuscation',
    sublabel: 'OFAC-sanctioned mixer',
    color: '#a855f7',
    side: 'top',
    nodeIds: ['0x7f268357A8c2537a18A166b5Cd1C6525B2f59A9B'],
  },
  {
    id: 'sanctions',
    label: 'Sanctions',
    sublabel: 'OFAC SDN / EU designated',
    color: '#ef4444',
    side: 'top-left',
    nodeIds: [
      '0x3F8c3D1A7e5F2b9C0d4E6a8B2f1c3D5e7F9a0B2d',
      '0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0',
      '0x9e3F1C8d2B7a4E5f0C6D3b8A1e4F7c2D9B5a3E1f',
      '0x2C5e8B1f4A7d3E6c9F0b2D5a8E1f4B7c0D3f6A9b',
    ],
  },
  {
    id: 'routing',
    label: 'Routing Layer',
    sublabel: 'Pass-through intermediaries',
    color: '#f97316',
    side: 'left',          // incoming — spread left
    nodeIds: [
      '0x1D4f7A2b8C5e3F9d0E6b1A4c7D2f5B8e1C4d7F0',
      '0x5A8d2E1b4F7c0D3e6A9b2C5f8D1e4B7a0C3f6Ab',
      '0xE3b1C7a4D9f2A6c0B5e8D1f4C7a0B3e6D9f2A5c',
      '0xB6c3F9e1D4a7B2f5C8e0A3d6B9f2C5a8E1d4F78',
    ],
  },
  {
    id: 'highRisk',
    label: 'High-Risk Services',
    sublabel: 'OTC · Escrow · Darknet',
    color: '#fbbf24',
    side: 'bottom',
    nodeIds: [
      '0x8D1f4B7c0D3f6A9b2C5e8B1f4A7d3E6c9F0b2D5',
      '0x3E6c9F0b2D5a8E1f4B7c0D3f6A9b2C5e8B1f4Ab',
    ],
  },
];

// Build a quick lookup: nodeId → cluster
const NODE_CLUSTER_MAP = new Map();
CLUSTER_DEFS.forEach((c) => c.nodeIds.forEach((id) => NODE_CLUSTER_MAP.set(id, c)));

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const getId = (ref) => (ref && typeof ref === 'object' ? ref.id : ref);

function buildAdj(nodes, links) {
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, new Set()));
  links.forEach((l) => {
    const s = getId(l.source);
    const t = getId(l.target);
    adj.get(s)?.add(t);
    adj.get(t)?.add(s);
  });
  return adj;
}

function bfsDepths(adj, startId) {
  const depths = new Map([[startId, 0]]);
  const queue = [startId];
  while (queue.length) {
    const id = queue.shift();
    const d = depths.get(id);
    for (const nb of adj.get(id) || []) {
      if (!depths.has(nb)) {
        depths.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  return depths;
}

function getNeighborSet(nodeId, adj) {
  const s = new Set([nodeId]);
  for (const nb of (adj.get(nodeId) || [])) s.add(nb);
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE PRIORITY — for density culling (higher = more important)
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_PRIORITY = {
  sanctioned: 100, mixer: 95, ransomware: 90, darknet: 88,
  laundering: 82, scam_cluster: 78, high_risk_service: 74, escrow: 70,
  bridge: 50, contract: 45, exchange: 40, wallet: 20,
};

function nodePriority(node) {
  return (TYPE_PRIORITY[node.type] ?? 20) + (node.riskScore || 0) * 0.3;
}

// Sort depth-1 ring: most dangerous at top, cluster-mates adjacent
function sortRing(ringNodes) {
  return [...ringNodes].sort((a, b) => {
    const ca = NODE_CLUSTER_MAP.get(a.id)?.id || 'z';
    const cb = NODE_CLUSTER_MAP.get(b.id)?.id || 'z';
    if (ca !== cb) {
      const pa = TYPE_PRIORITY[a.type] ?? 20;
      const pb = TYPE_PRIORITY[b.type] ?? 20;
      return pb - pa;
    }
    return (b.riskScore || 0) - (a.riskScore || 0);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DENSITY FILTERING — returns { visibleNodes, visibleLinks, metaNodes }
// Meta-nodes are synthetic collapsed cluster nodes for low/medium density.
// ─────────────────────────────────────────────────────────────────────────────
function applyDensityFilter(allNodes, allLinks, density, expandedClusters, depths) {
  const tier = DENSITY_TIERS[density];

  // Always include center
  const centerNode = allNodes.find((n) => n.id === TARGET_WALLET);

  // Rank ring-1 nodes by priority, cap by tier
  const rawRing1 = allNodes.filter((n) => depths.get(n.id) === 1);
  const rankedRing1 = [...rawRing1].sort((a, b) => nodePriority(b) - nodePriority(a));

  // For each cluster: if expanded, show individual nodes; otherwise create meta-node
  const clusterMetaNodes = [];
  const expandedNodeIds = new Set([TARGET_WALLET]);

  CLUSTER_DEFS.forEach((cd) => {
    const members = rankedRing1.filter((n) => cd.nodeIds.includes(n.id));
    if (members.length === 0) return;

    if (expandedClusters.has(cd.id) || members.length === 1) {
      // Show individual nodes
      members.forEach((n) => expandedNodeIds.add(n.id));
    } else if (density === 'low') {
      // Always collapse multi-node clusters in Low density
      clusterMetaNodes.push(makeMeta(cd, members));
    } else {
      // Medium/Full: show up to ring1Max per cluster, collapse rest
      const allowed = tier.ring1Max;
      const shown = members.slice(0, Math.min(allowed, members.length));
      const collapsed = members.slice(shown.length);
      shown.forEach((n) => expandedNodeIds.add(n.id));
      if (collapsed.length > 0 && density !== 'full') {
        clusterMetaNodes.push(makeMeta(cd, collapsed, shown.length));
      } else {
        collapsed.forEach((n) => expandedNodeIds.add(n.id));
      }
    }
  });

  // Nodes not in any cluster — show top N
  const unclusteredRing1 = rankedRing1
    .filter((n) => !NODE_CLUSTER_MAP.has(n.id))
    .slice(0, tier.ring1Max);
  unclusteredRing1.forEach((n) => expandedNodeIds.add(n.id));

  // Ring-2 nodes — only in medium/full
  const ring2Nodes = allNodes
    .filter((n) => (depths.get(n.id) ?? 99) >= 2)
    .sort((a, b) => nodePriority(b) - nodePriority(a))
    .slice(0, tier.ring2Max);
  ring2Nodes.forEach((n) => expandedNodeIds.add(n.id));

  // Build final node list
  const visibleReal = allNodes.filter((n) => expandedNodeIds.has(n.id));
  const visibleNodes = [...visibleReal, ...clusterMetaNodes];

  // Rank and cap links
  const rankedLinks = [...allLinks]
    .filter((l) => {
      const s = getId(l.source);
      const t = getId(l.target);
      return expandedNodeIds.has(s) && expandedNodeIds.has(t);
    })
    .sort((a, b) => {
      const rp = { critical: 4, high: 3, medium: 2, low: 1 };
      const rDiff = (rp[b.risk] ?? 0) - (rp[a.risk] ?? 0);
      if (rDiff !== 0) return rDiff;
      return (b.value || 0) - (a.value || 0);
    })
    .slice(0, tier.edgeMax);

  // Add synthetic edges for meta-nodes (connect to center or to member's parent)
  clusterMetaNodes.forEach((meta) => {
    const connectsTo = meta._memberIds.some((id) =>
      allLinks.some((l) => {
        const s = getId(l.source);
        const t = getId(l.target);
        return (s === TARGET_WALLET && t === id) || (t === TARGET_WALLET && s === id);
      })
    );
    if (connectsTo) {
      const topRisk = meta._topRisk;
      rankedLinks.push({
        source: TARGET_WALLET,
        target: meta.id,
        value: meta._totalVolume,
        risk: topRisk,
        label: `${meta._count} nodes · $${Math.round(meta._totalVolume / 1000)}K combined`,
        _isMeta: true,
      });
    }
  });

  return { visibleNodes, visibleLinks: rankedLinks, metaNodeIds: new Set(clusterMetaNodes.map((m) => m.id)) };
}

const RISK_RANK = { critical: 4, high: 3, medium: 2, low: 1 };

function makeMeta(clusterDef, members, shownCount = 0) {
  const totalVol = members.reduce((s, n) => s + (n.volume || 0), 0);
  const topRisk = members.reduce((best, n) => {
    return (RISK_RANK[n.riskLevel] || 0) > (RISK_RANK[best] || 0) ? n.riskLevel : best;
  }, 'low');
  const id = `__meta_${clusterDef.id}`;
  return {
    id,
    label: clusterDef.label,
    shortLabel: clusterDef.label,
    entityLabel: clusterDef.label,
    type: '_meta',
    _clusterId: clusterDef.id,
    _clusterDef: clusterDef,
    _memberIds: members.map((n) => n.id),
    _count: members.length + shownCount,
    _collapsedCount: members.length,
    _totalVolume: totalVol,
    _topRisk: topRisk,
    riskLevel: topRisk,
    riskScore: Math.max(...members.map((n) => n.riskScore || 0)),
    volume: totalVol,
    isCenter: false,
    behaviouralSummary: `${members.length} nodes collapsed. Click to expand.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NODE RENDERING
// ─────────────────────────────────────────────────────────────────────────────
// Compressed size range — avoids large/small contrast that hides small nodes
function getNodeRadius(node, graphMode) {
  if (node.isCenter) return 18;
  if (node.type === '_meta') {
    // Meta-nodes sized by collapsed count — but capped tighter
    return Math.max(13, Math.min(22, 10 + node._collapsedCount * 1.6));
  }
  const base = 7;
  // Much tighter volume scaling — min 7, max 14 (was 7–17)
  const vol = Math.min(7, Math.sqrt((node.volume || 5000) / 80000) * 9);
  let r = base + vol;
  if (graphMode === 'risk') {
    // Smaller multiplier range to keep proportions sane
    if (node.riskScore > 80) r = Math.min(r * 1.2, 16);
    else if (node.riskScore < 25) r = Math.max(r * 0.75, 6);
  }
  return r;
}

function drawNode(node, ctx, globalScale, alpha, r, isSelected, graphMode) {
  const { x: cx, y: cy } = node;
  const isMeta = node.type === '_meta';
  const cd = isMeta ? node._clusterDef : NODE_CLUSTER_MAP.get(node.id);
  const color = isMeta
    ? (cd?.color || '#7c3aed')
    : (ENTITY_COLORS[node.type] || '#60a5fa');

  ctx.save();
  ctx.globalAlpha = alpha;

  // Center pulse
  if (node.isCenter) {
    const h = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 4);
    h.addColorStop(0, 'rgba(6,182,212,0.15)');
    h.addColorStop(1, 'rgba(6,182,212,0)');
    ctx.fillStyle = h;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Selection ring
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();
  }

  // Critical dashed ring
  if ((node.riskLevel === 'critical' || node._topRisk === 'critical') && alpha > 0.35) {
    ctx.save();
    ctx.setLineDash([3 / globalScale, 3 / globalScale]);
    ctx.beginPath();
    ctx.arc(cx, cy, r + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(239,68,68,${alpha * 0.75})`;
    ctx.lineWidth = 0.8 / globalScale;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Meta-node: hexagonal border to visually distinguish
  if (isMeta) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color + '30';
    ctx.fill();
    ctx.strokeStyle = color + 'bb';
    ctx.lineWidth = 1.2 / globalScale;
    ctx.stroke();
    ctx.restore();

    // Count badge
    const badgeSize = Math.max(6, r * 0.55);
    ctx.font = `bold ${badgeSize}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node._collapsedCount.toString(), cx, cy);
  } else {
    // Normal node glow + fill
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = node.isCenter ? 22 : (graphMode === 'risk' && node.riskLevel === 'critical') ? 16 : 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = node.isCenter ? '#00b4d8' : color + 'dd';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = node.isCenter ? 'rgba(255,255,255,0.65)' : color;
    ctx.lineWidth = (node.isCenter ? 1.8 : 0.7) / globalScale;
    ctx.stroke();

    // Icon
    const letter = node.isCenter ? '⊙' : (ENTITY_ICON_LETTERS[node.type] || '?');
    const fontSize = Math.max(5, r * (node.isCenter ? 0.52 : 0.68));
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = node.isCenter ? '#001a2e' : 'rgba(255,255,255,0.93)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, cx, cy);
  }

  // Label — only at sufficient zoom; fade-in by scale for decluttering
  const labelThreshold = isMeta ? 0.25 : 0.38;
  if (globalScale >= labelThreshold || node.isCenter) {
    const labelAlphaBoost = Math.min(1, (globalScale - labelThreshold) / 0.3 + 0.5);
    const labelSize = Math.max(7, Math.min(11, 9 / globalScale));
    ctx.font = `${labelSize}px JetBrains Mono, monospace`;
    ctx.fillStyle = node.isCenter
      ? `rgba(6,182,212,${labelAlphaBoost})`
      : isMeta
      ? color + Math.round(labelAlphaBoost * 200).toString(16).padStart(2, '0')
      : `rgba(148,163,184,${labelAlphaBoost * 0.85})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      isMeta ? node.label : (node.shortLabel || node.id.slice(0, 6) + '…'),
      cx,
      cy + r + 3 / globalScale,
    );
    // Meta sub-label
    if (isMeta && globalScale >= 0.5) {
      const sf = Math.max(5.5, 7 / globalScale);
      ctx.font = `${sf}px JetBrains Mono, monospace`;
      ctx.fillStyle = color + '66';
      ctx.fillText(`${node._collapsedCount} nodes`, cx, cy + r + labelSize / globalScale + 5 / globalScale);
    }
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH MODE CONFIGS
// ─────────────────────────────────────────────────────────────────────────────
const MODES = [
  { key: 'overview', label: 'Overview', Icon: Eye,           desc: 'Balanced view with risk hierarchy.' },
  { key: 'risk',     label: 'Risk',     Icon: AlertTriangle, desc: 'High-risk nodes enlarged. Low-risk dimmed.' },
  { key: 'flow',     label: 'Flow',     Icon: ArrowRight,    desc: 'All fund flows animated with direction.' },
];

const DENSITY_KEYS = ['low', 'medium', 'full'];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function WalletGraph({ nodes: allNodes, links: allLinks, onNodeClick, selectedNodeId }) {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const layoutApplied = useRef(false);
  const densityRef = useRef('medium');

  const [dims, setDims] = useState({ width: 700, height: 500 });
  const [graphMode, setGraphMode] = useState('overview');
  const [density, setDensity] = useState('medium');
  const [expandedClusters, setExpandedClusters] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Keep densityRef in sync so the layout effect can read it fresh
  useEffect(() => { densityRef.current = density; }, [density]);

  // ─── Structural analysis ───────────────────────────────────────
  const adj = useMemo(() => buildAdj(allNodes, allLinks), [allNodes, allLinks]);
  const depths = useMemo(() => bfsDepths(adj, TARGET_WALLET), [adj]);

  // ─── Density-filtered graph data ──────────────────────────────
  const { visibleNodes, visibleLinks, metaNodeIds } = useMemo(
    () => applyDensityFilter(allNodes, allLinks, density, expandedClusters, depths),
    [allNodes, allLinks, density, expandedClusters, depths],
  );

  const graphData = useMemo(() => ({ nodes: visibleNodes, links: visibleLinks }), [visibleNodes, visibleLinks]);

  // ─── Hover neighbourhood sets ──────────────────────────────────
  const visAdj = useMemo(() => buildAdj(visibleNodes, visibleLinks), [visibleNodes, visibleLinks]);

  const highlightedNodes = useMemo(
    () => (hoveredNode ? getNeighborSet(hoveredNode.id, visAdj) : null),
    [hoveredNode, visAdj],
  );
  const highlightedLinkSet = useMemo(() => {
    if (!hoveredNode) return null;
    const s = new Set();
    visibleLinks.forEach((l) => {
      if (getId(l.source) === hoveredNode.id || getId(l.target) === hoveredNode.id) s.add(l);
    });
    return s;
  }, [hoveredNode, visibleLinks]);

  // ─── Resize ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ width: e.contentRect.width, height: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ─── Layout — re-run when visible node set changes ────────────
  useEffect(() => {
    if (!fgRef.current || dims.width < 200) return;

    const fg = fgRef.current;
    const cw = dims.width;
    const ch = dims.height;
    const minDim = Math.min(cw, ch);

    // Radii — larger for breathing room
    const r1 = minDim * 0.32;
    const r2 = minDim * 0.52;

    const ring1Raw = visibleNodes.filter((n) => {
      if (n.id === TARGET_WALLET) return false;
      const d = depths.get(n.id);
      return d === 1 || n.type === '_meta';
    });
    const ring2 = visibleNodes.filter((n) => (depths.get(n.id) ?? 99) >= 2 && n.type !== '_meta');
    const ring1 = sortRing(ring1Raw);

    // Apply sector-biased angles: directional spread
    // Outgoing-dominant nodes (exchanges) → right; incoming-dominant / suspicious → left/top
    ring1.forEach((n, i) => {
      const cd = n.type === '_meta' ? n._clusterDef : NODE_CLUSTER_MAP.get(n.id);
      let baseAngle;
      if (cd?.side === 'right')      baseAngle = -Math.PI * 0.15 + (i / ring1.length) * Math.PI * 0.4;
      else if (cd?.side === 'left')  baseAngle = Math.PI * 0.6 + (i / ring1.length) * Math.PI * 0.5;
      else if (cd?.side === 'top')   baseAngle = -Math.PI * 0.85;
      else if (cd?.side === 'top-left') baseAngle = Math.PI * 0.65 + (i / ring1.length) * Math.PI * 0.4;
      else if (cd?.side === 'bottom') baseAngle = Math.PI * 0.3 + (i / ring1.length) * Math.PI * 0.4;
      else {
        // Even spread for uncategorised
        baseAngle = (2 * Math.PI * i) / ring1.length - Math.PI / 2;
      }
      // Jitter adjacent same-cluster nodes a little so they don't exactly overlap
      const jitter = (i % 3 - 1) * 0.08;
      const angle = baseAngle + jitter;
      n.__rx = cw / 2 + Math.cos(angle) * r1;
      n.__ry = ch / 2 + Math.sin(angle) * r1;
      n.x = n.__rx;
      n.y = n.__ry;
      n.vx = 0; n.vy = 0;
    });

    ring2.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(ring2.length, 1) - Math.PI / 4;
      n.__rx = cw / 2 + Math.cos(angle) * r2;
      n.__ry = ch / 2 + Math.sin(angle) * r2;
      n.x = n.__rx; n.y = n.__ry;
      n.vx = 0; n.vy = 0;
    });

    const center = visibleNodes.find((n) => n.id === TARGET_WALLET);
    if (center) {
      center.__rx = cw / 2; center.__ry = ch / 2;
      center.x = cw / 2;   center.y = ch / 2;
      center.fx = cw / 2;  center.fy = ch / 2; // FIXED — prevents drift
      center.vx = 0; center.vy = 0;
    }

    // Custom guide force
    let _gn = [];
    function radialGuide(alpha) {
      _gn.forEach((n) => {
        if (n.fx != null || n.__rx == null) return;
        const str = 0.12 * alpha;
        n.vx = (n.vx || 0) + (n.__rx - n.x) * str;
        n.vy = (n.vy || 0) + (n.__ry - n.y) * str;
      });
    }
    radialGuide.initialize = (ns) => { _gn = ns; };

    fg.d3Force('radialGuide', radialGuide);

    // *** KEY FIX 1: Much stronger repulsion + longer link distance ***
    fg.d3Force('charge')?.strength(-350);
    fg.d3Force('link')
      ?.distance((l) => {
        const s = getId(l.source);
        const t = getId(l.target);
        const sD = depths.get(s) ?? 2;
        const tD = depths.get(t) ?? 2;
        // Longer distance for deeper / lower-priority edges
        const baseD = Math.max(sD, tD) >= 2 ? 200 : 130;
        // Extra spacing for sanctioned / mixer links (they are spatially distinct)
        const srcNode = visibleNodes.find((n) => n.id === s);
        const bonus = srcNode && ['sanctioned','mixer','ransomware'].includes(srcNode.type) ? 30 : 0;
        return baseD + bonus;
      });

    // Cluster-level padding: extra repulsion between meta-nodes / cluster anchor nodes
    let _cn = [];
    function clusterPadding(alpha) {
      const clusterReps = [];
      CLUSTER_DEFS.forEach((cd) => {
        const rep = _cn.find((n) => n._clusterId === cd.id || cd.nodeIds[0] === n.id);
        if (rep && rep.x != null) clusterReps.push({ n: rep, cd });
      });
      for (let i = 0; i < clusterReps.length; i++) {
        for (let j = i + 1; j < clusterReps.length; j++) {
          const ni = clusterReps[i].n;
          const nj = clusterReps[j].n;
          const dx = nj.x - ni.x;
          const dy = nj.y - ni.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 160;
          if (dist < minDist) {
            const push = ((minDist - dist) / dist) * 0.02 * alpha;
            ni.vx -= dx * push;
            ni.vy -= dy * push;
            nj.vx += dx * push;
            nj.vy += dy * push;
          }
        }
      }
    }
    clusterPadding.initialize = (ns) => { _cn = ns; };
    fg.d3Force('clusterPad', clusterPadding);

    fg.d3ReheatSimulation();
    layoutApplied.current = true;

    const tid = setTimeout(() => fg.zoomToFit(600, 80), 1200);
    return () => clearTimeout(tid);
  // Re-layout whenever visible graph changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNodes.length, dims.width, dims.height]);

  // ─── Cluster halo pre-render ───────────────────────────────────
  const handleRenderFramePre = useCallback(
    (ctx, globalScale) => {
      if (graphMode === 'flow') return;
      // Fade out halos when zoomed out (too much noise at low zoom)
      const haloAlpha = Math.min(1, Math.max(0, (globalScale - 0.22) / 0.3));
      if (haloAlpha < 0.05) return;

      CLUSTER_DEFS.forEach((cd) => {
        const members = visibleNodes.filter(
          (n) => (cd.nodeIds.includes(n.id) || n._clusterId === cd.id) && n.x != null && !isNaN(n.x),
        );
        if (members.length === 0) return;

        const mx = members.reduce((s, n) => s + n.x, 0) / members.length;
        const my = members.reduce((s, n) => s + n.y, 0) / members.length;
        const maxR = Math.max(
          48,
          Math.max(...members.map((n) => Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2))) + 44,
        );

        ctx.save();
        ctx.globalAlpha = haloAlpha;

        const fill = graphMode === 'risk' ? '1e' : '0e';
        const grad = ctx.createRadialGradient(mx, my, maxR * 0.25, mx, my, maxR);
        grad.addColorStop(0, cd.color + fill);
        grad.addColorStop(1, cd.color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(mx, my, maxR, 0, 2 * Math.PI); ctx.fill();

        ctx.beginPath(); ctx.arc(mx, my, maxR, 0, 2 * Math.PI);
        ctx.strokeStyle = cd.color + '22';
        ctx.lineWidth = 0.8 / globalScale;
        ctx.setLineDash([4 / globalScale, 4 / globalScale]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cluster label — only when zoomed enough
        if (globalScale >= 0.45) {
          const fs = Math.min(11, 9 / globalScale);
          ctx.font = `600 ${fs}px JetBrains Mono, monospace`;
          ctx.fillStyle = cd.color + 'aa';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(cd.label, mx, my - maxR + fs * 0.8);
        }
        ctx.restore();
      });
    },
    [visibleNodes, graphMode],
  );

  // ─── Node canvas renderer ──────────────────────────────────────
  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const depth = depths.get(node.id) ?? 3;
      let alpha = 1.0;

      if (hoveredNode) {
        alpha = highlightedNodes?.has(node.id) ? 1.0 : 0.07;
      } else if (graphMode === 'risk') {
        if (node.riskLevel === 'low') alpha = 0.38;
        else if ((node.riskScore ?? 0) < 40) alpha = 0.52;
      }

      const r = getNodeRadius(node, graphMode);
      drawNode(node, ctx, globalScale, alpha, r, node.id === selectedNodeId, graphMode);
    },
    [depths, hoveredNode, highlightedNodes, graphMode, selectedNodeId],
  );

  const nodePointerArea = useCallback(
    (node, color, ctx) => {
      const r = getNodeRadius(node, graphMode) + 9;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, 2 * Math.PI); ctx.fill();
    },
    [graphMode],
  );

  // ─── Link styling ──────────────────────────────────────────────
  const getLinkColor = useCallback(
    (link) => {
      const base = RISK_COLORS[link.risk] || '#475569';
      if (link._isMeta) return base + '70';
      if (hoveredNode) return highlightedLinkSet?.has(link) ? base : 'rgba(255,255,255,0.02)';
      if (graphMode === 'risk') {
        if (link.risk === 'critical') return base;
        if (link.risk === 'high') return base + 'bb';
        return base + '3a';
      }
      if (graphMode === 'flow') return base + 'cc';
      return base + '55';
    },
    [hoveredNode, highlightedLinkSet, graphMode],
  );

  const getLinkWidth = useCallback(
    (link) => {
      const base = Math.max(0.6, Math.min(3, Math.sqrt((link.value || 1000) / 120000) * 3));
      if (hoveredNode) return highlightedLinkSet?.has(link) ? base * 3 : 0.2;
      if (link._isMeta) return base * 0.7;
      if (graphMode === 'risk') {
        if (link.risk === 'critical') return base * 1.6;
        if (link.risk === 'high') return base * 1.15;
        return base * 0.55;
      }
      if (graphMode === 'flow') return base * 1.3;
      return base;
    },
    [hoveredNode, highlightedLinkSet, graphMode],
  );

  // KEY FIX 8: Particles only on suspicious/high-volume — not everything
  const getLinkParticles = useCallback(
    (link) => {
      if (link._isMeta) return 0;
      if (hoveredNode) return highlightedLinkSet?.has(link) ? (link.risk === 'critical' ? 4 : 2) : 0;
      if (graphMode === 'flow') return link.risk === 'critical' ? 5 : link.risk === 'high' ? 3 : 1;
      // Default: ONLY critical and high — low/medium = static
      if (link.risk === 'critical') return 3;
      if (link.risk === 'high')     return 1;
      return 0;
    },
    [graphMode, hoveredNode, highlightedLinkSet],
  );

  const getParticleColor = useCallback((link) => RISK_COLORS[link.risk] || '#475569', []);
  const getParticleSpeed = useCallback(
    (link) => graphMode === 'flow' ? 0.008 : link.risk === 'critical' ? 0.005 : 0.003,
    [graphMode],
  );
  const getArrowLength = useCallback(() => graphMode === 'flow' ? 7 : 5, [graphMode]);

  // ─── Node click — expand meta-node or propagate ────────────────
  const handleNodeClick = useCallback(
    (node) => {
      if (node.type === '_meta') {
        setExpandedClusters((prev) => {
          const next = new Set(prev);
          next.has(node._clusterId) ? next.delete(node._clusterId) : next.add(node._clusterId);
          return next;
        });
        return;
      }
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  // ─── Hover / mouse ─────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node || null);
    if (node) setHoveredLink(null);
    if (containerRef.current) {
      containerRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, []);

  const handleLinkHover = useCallback((link) => {
    if (!hoveredNode) setHoveredLink(link || null);
  }, [hoveredNode]);

  // ─── Zoom tracking for decluttering ───────────────────────────
  const handleZoom = useCallback(({ k }) => setZoomLevel(k), []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const curTier = DENSITY_TIERS[density];

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-w-0 min-h-0 overflow-hidden"
      style={{ background: '#090a0f' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setHoveredNode(null); setHoveredLink(null); }}
    >
      {/* Background dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-25 pointer-events-none" />
      {/* Vignette */}
      <div className="absolute inset-0 graph-vignette z-10 pointer-events-none" />

      {/* ── Force Graph ── */}
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dims.width}
        height={dims.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode="replace"
        nodePointerAreaPaint={nodePointerArea}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onLinkHover={handleLinkHover}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalArrowLength={getArrowLength}
        linkDirectionalArrowRelPos={0.85}
        linkDirectionalArrowColor={getLinkColor}
        linkDirectionalParticles={getLinkParticles}
        linkDirectionalParticleSpeed={getParticleSpeed}
        linkDirectionalParticleColor={getParticleColor}
        linkDirectionalParticleWidth={2}
        linkCurvature={0.12}
        onRenderFramePre={handleRenderFramePre}
        onZoom={handleZoom}
        nodeLabel=""
        linkLabel=""
        d3AlphaDecay={0.018}
        d3VelocityDecay={0.45}
        cooldownTicks={260}
        enableNodeDrag
      />

      {/* ── Top controls bar ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">

        {/* Graph mode tabs */}
        <div
          className="flex items-center text-[10px] font-mono overflow-hidden"
          style={{
            background: 'rgba(9,10,15,0.94)',
            border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: '7px',
            backdropFilter: 'blur(16px)',
          }}
        >
          {MODES.map(({ key, label, Icon }, i) => {
            const active = graphMode === key;
            return (
              <button
                key={key}
                onClick={() => setGraphMode(key)}
                title={MODES.find((m) => m.key === key)?.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase tracking-widest transition-all duration-150
                  ${active ? 'text-purple-400' : 'text-slate-600 hover:text-slate-400'}
                  ${i > 0 ? 'border-l' : ''}`}
                style={{
                  borderColor: 'rgba(139,92,246,0.12)',
                  background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
                }}
              >
                <Icon size={10} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Density selector */}
        <div
          className="flex items-center text-[10px] font-mono overflow-hidden"
          style={{
            background: 'rgba(8,12,22,0.93)',
            border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: '7px',
            backdropFilter: 'blur(16px)', }}
        >
          {DENSITY_KEYS.map((dk, i) => {
            const active = density === dk;
            const t = DENSITY_TIERS[dk];
            return (
              <button
                key={dk}
                onClick={() => { setDensity(dk); setExpandedClusters(new Set()); }}
                title={t.subLabel}
                className={`flex items-center gap-1 px-2.5 py-1.5 uppercase tracking-widest transition-all duration-150
                  ${active ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}
                  ${i > 0 ? 'border-l' : ''}`}
                style={{
                  borderColor: 'rgba(139,92,246,0.12)',
                  background: active ? 'rgba(251,191,36,0.08)' : 'transparent',
                }}
              >
                {dk === 'low' && <Layers size={9} />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mode hint ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 text-[9px] font-mono text-slate-700 pointer-events-none whitespace-nowrap">
        {MODES.find((m) => m.key === graphMode)?.desc}
        {' · '}
        {curTier.subLabel}
        {density !== 'full' && (
          <span className="text-slate-600">
            {' — '}showing {visibleNodes.length} of {allNodes.length} nodes
          </span>
        )}
      </div>

      {/* ── Expand hint for meta nodes (shown only in low/medium) ── */}
      {density !== 'full' && metaNodeIds.size > 0 && !hoveredNode && (
        <div className="absolute top-[3.6rem] left-1/2 -translate-x-1/2 z-20 text-[8.5px] font-mono text-amber-700/70 pointer-events-none">
          Hexagonal nodes ⬡ are collapsed clusters — click to expand
        </div>
      )}

      {/* ── Hover tooltip ── */}
      {(hoveredNode || hoveredLink) && (
        <HoverTooltip
          node={hoveredNode}
          link={hoveredLink}
          mousePos={mousePos}
          containerDims={dims}
          graphMode={graphMode}
          depths={depths}
        />
      )}

      {/* ── Legend ── */}
      <div
        className="absolute bottom-8 right-3 z-20 text-[9px] font-mono"
        style={{
          background: 'rgba(8,12,22,0.9)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '7px',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          minWidth: '158px',
        }}
      >
        <button
          className="w-full flex items-center justify-between px-3 py-2 text-slate-500 hover:text-slate-400 transition-colors"
          onClick={() => setShowLegend((v) => !v)}
        >
          <span className="uppercase tracking-widest text-[8px]">Legend</span>
          {showLegend ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </button>

        {showLegend && (
          <div className="px-3 pb-3">
            <div className="text-slate-600 uppercase tracking-widest text-[7.5px] mb-1.5">Entity types</div>
            {[
              { type: 'wallet',           label: 'Wallet / Unknown' },
              { type: 'exchange',         label: 'Exchange — cash-out' },
              { type: 'mixer',            label: 'Mixer — obfuscation' },
              { type: 'sanctioned',       label: 'OFAC Sanctioned' },
              { type: 'laundering',       label: 'Layering node' },
              { type: 'darknet',          label: 'Darknet market' },
              { type: 'bridge',           label: 'Cross-chain bridge' },
              { type: 'ransomware',       label: 'Ransomware-linked' },
              { type: 'high_risk_service',label: 'Unreg. OTC service' },
              { type: 'scam_cluster',     label: 'Fraud / scam cluster' },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ENTITY_COLORS[type] }} />
                <span className="text-slate-600">{label}</span>
              </div>
            ))}

            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="text-slate-600 uppercase tracking-widest text-[7.5px] mb-1.5">Edge risk</div>
              {['critical','high','medium','low'].map((risk) => (
                <div key={risk} className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-4 h-0.5 rounded" style={{ backgroundColor: RISK_COLORS[risk] }} />
                  <span className="text-slate-600 capitalize">{risk}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="text-slate-600 uppercase tracking-widest text-[7.5px] mb-1">Density</div>
              <div className="text-slate-700 leading-relaxed">
                ◆ Low = clusters collapsed<br />
                ◆ Standard = top 10 direct<br />
                ◆ Full = all connections
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Zoom level indicator ── */}
      <div
        className="absolute bottom-3 right-3 z-20 text-[8px] font-mono text-slate-800"
      >
        {Math.round(zoomLevel * 100)}%
      </div>

      {/* ── Bottom hint ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-[9px] font-mono text-slate-700 pointer-events-none">
        Hover to trace paths · Click nodes to investigate · Scroll to zoom
      </div>
    </div>
  );
}
