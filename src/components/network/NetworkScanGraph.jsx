import { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ENTITY_COLORS, RISK_COLORS, ENTITY_ICON_LETTERS } from '../../constants';

function getNodeRadius(node) {
  const base = 5;
  const vol = Math.min(14, Math.sqrt((node.volume || 5000) / 200000) * 10);
  return base + vol;
}

function drawNetworkNode(node, ctx, globalScale) {
  const color = ENTITY_COLORS[node.type] || '#64748b';
  const r = getNodeRadius(node);

  // Halo
  const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 2.5);
  halo.addColorStop(0, color + '28');
  halo.addColorStop(1, color + '00');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(node.x, node.y, r * 2.5, 0, 2 * Math.PI);
  ctx.fill();

  // Critical dashed ring
  if (node.riskLevel === 'critical') {
    ctx.save();
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI);
    ctx.strokeStyle = RISK_COLORS.critical + '80';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Glow
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color + 'dd';
  ctx.fill();
  ctx.restore();

  // Border
  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Icon
  const letter = ENTITY_ICON_LETTERS[node.type] || '?';
  const fs = Math.max(6, r * 0.72);
  ctx.font = `bold ${fs}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, node.x, node.y);

  // Label for large or focused nodes
  if (globalScale >= 0.55 && r > 10) {
    const fsl = Math.max(7, 9 / globalScale);
    ctx.font = `${fsl}px JetBrains Mono, monospace`;
    ctx.fillStyle = 'rgba(148,163,184,0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(node.shortLabel || node.id.slice(0, 8), node.x, node.y + r + 2);
  }
}

export default function NetworkScanGraph({ graphData, onNodeClick }) {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ width: e.contentRect.width, height: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      setTimeout(() => fgRef.current.zoomToFit(600, 50), 1000);
    }
  }, []);

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    drawNetworkNode(node, ctx, globalScale);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1 min-h-0 min-w-0 overflow-hidden" style={{ background: '#05070d' }}>
      <div className="absolute inset-0 graph-vignette z-10" />

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dims.width}
        height={dims.height}
        backgroundColor="#05070d"
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode="replace"
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, getNodeRadius(node) + 6, 0, 2 * Math.PI);
          ctx.fill();
        }}
        onNodeClick={onNodeClick}
        linkColor={(l) => (RISK_COLORS[l.risk] || '#334155') + '55'}
        linkWidth={(l) => Math.max(0.5, Math.sqrt((l.value || 500) / 500000) * 1.5)}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={0.9}
        linkDirectionalArrowColor={(l) => (RISK_COLORS[l.risk] || '#475569') + '80'}
        linkDirectionalParticles={(l) => l.risk === 'critical' ? 2 : l.risk === 'high' ? 1 : 0}
        linkDirectionalParticleSpeed={0.003}
        linkDirectionalParticleColor={(l) => RISK_COLORS[l.risk] || '#64748b'}
        linkDirectionalParticleWidth={2}
        d3AlphaDecay={0.018}
        d3VelocityDecay={0.3}
        cooldownTicks={180}
      />

      {/* Cluster labels */}
      <div className="absolute top-3 left-3 z-20 space-y-1.5 text-[10px] font-mono">
        {[
          { label: 'Sanctions Hub', color: '#ef4444' },
          { label: 'Mixer Network', color: '#a855f7' },
          { label: 'Ransomware', color: '#be123c' },
          { label: 'Layering Network', color: '#dc2626' },
          { label: 'Darknet Cluster', color: '#7c3aed' },
          { label: 'Scam Cluster', color: '#f43f5e' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
            <span className="text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-[10px] font-mono text-slate-600 pointer-events-none">
        Network snapshot · {graphData.nodes.length} entities · {graphData.links.length} relationships
      </div>
    </div>
  );
}
