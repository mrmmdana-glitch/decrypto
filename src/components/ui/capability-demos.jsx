import { useEffect, useState } from "react";

// ── 1. Graph Intelligence — animated transaction trace ────────────────────────
export const GraphDemo = () => {
  const [phase, setPhase] = useState(0);
  const traceEdges = [[0, 1], [1, 4], [4, 5], [5, 7]];

  useEffect(() => {
    let timeout;
    let p = 0;
    const step = () => {
      p = p < traceEdges.length ? p + 1 : 0;
      setPhase(p);
      timeout = setTimeout(step, p === traceEdges.length ? 1400 : 650);
    };
    timeout = setTimeout(step, 400);
    return () => clearTimeout(timeout);
  }, []);

  const nodes = [
    { id: 0, x: 38,  y: 95 },
    { id: 1, x: 110, y: 58 },
    { id: 2, x: 172, y: 98 },
    { id: 3, x: 108, y: 150 },
    { id: 4, x: 248, y: 62 },
    { id: 5, x: 295, y: 130 },
    { id: 6, x: 220, y: 170 },
    { id: 7, x: 368, y: 105 },
  ];
  const allEdges = [[0,1],[1,2],[2,3],[1,3],[1,4],[2,5],[4,5],[5,6],[5,7],[6,7]];
  const get = id => nodes.find(n => n.id === id);
  const isActive = (a, b) => traceEdges.findIndex(([ta,tb]) => ta===a && tb===b) < phase && traceEdges.findIndex(([ta,tb]) => ta===a && tb===b) >= 0;
  const litNodes = new Set(traceEdges.slice(0, phase).flat());

  return (
    <svg viewBox="0 0 420 210" width="100%" height="100%" style={{ overflow: "visible" }}>
      {allEdges.map(([a, b]) => {
        const na = get(a), nb = get(b);
        const active = isActive(a, b);
        return (
          <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
            style={{
              stroke: active ? "#7c3aed" : "rgba(255,255,255,0.05)",
              strokeWidth: active ? 1.5 : 1,
              transition: "all 0.35s",
            }}
          />
        );
      })}
      {nodes.map(n => {
        const isMixer = n.id === 5;
        const isFlagged = n.id === 7;
        const isLit = litNodes.has(n.id);
        return (
          <g key={n.id}>
            {isFlagged && (
              <circle cx={n.x} cy={n.y} r={10} fill="rgba(239,68,68,0.1)">
                <animate attributeName="r" values="8;13;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={n.x} cy={n.y}
              r={isFlagged || isMixer ? 5.5 : n.id === 0 ? 5 : 4}
              style={{
                fill: isFlagged ? "#ef4444" : isMixer ? "#c0392b" : isLit ? "#6d28d9" : "#141820",
                stroke: isFlagged ? "rgba(239,68,68,0.55)" : isMixer ? "rgba(192,57,43,0.5)" : isLit ? "rgba(109,40,217,0.5)" : "rgba(255,255,255,0.08)",
                strokeWidth: 1,
                transition: "fill 0.35s, stroke 0.35s",
              }}
            />
          </g>
        );
      })}
      <text x={nodes[0].x - 4} y={nodes[0].y + 17} fontSize="7.5" fill="rgba(255,255,255,0.18)" fontFamily="Inter,sans-serif">Source</text>
      <text x={nodes[5].x - 8} y={nodes[5].y + 17} fontSize="7.5" fill="rgba(192,57,43,0.55)" fontFamily="Inter,sans-serif">Mixer</text>
      <text x={nodes[7].x - 13} y={nodes[7].y + 18} fontSize="7.5" fill="rgba(239,68,68,0.65)" fontFamily="Inter,sans-serif">Flagged</text>
    </svg>
  );
};

// ── 2. Entity Clustering — three animated cluster groups ─────────────────────
export const ClusteringDemo = () => {
  const groups = [
    { label: "Exchanges", color: "#6366f1", cx: 80, cy: 92, dots: [{x:57,y:74},{x:86,y:63},{x:106,y:83},{x:74,y:108},{x:54,y:100}] },
    { label: "Mixers",    color: "#ef4444", cx: 210, cy: 98, dots: [{x:191,y:80},{x:218,y:73},{x:236,y:94},{x:220,y:118},{x:195,y:115}] },
    { label: "Unknown",   color: "#6b7280", cx: 340, cy: 92, dots: [{x:319,y:78},{x:350,y:70},{x:366,y:94},{x:350,y:115},{x:321,y:108}] },
  ];

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <style>{`
        @keyframes fltA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(0,-5px)} }
        @keyframes fltB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3px,3px)} }
        @keyframes fltC { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-2px,4px)} }
      `}</style>
      <svg viewBox="0 0 420 170" width="100%" height="100%">
        {groups.map(g => (
          <g key={g.label}>
            <ellipse cx={g.cx} cy={g.cy} rx={45} ry={40} fill="none"
              stroke={g.color} strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />
            {g.dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={4.5} fill={g.color} fillOpacity={0.65}
                style={{
                  animation: `${["fltA","fltB","fltC","fltA","fltB"][i]} ${[3,3.5,2.8,4,3.2][i]}s ease-in-out infinite`,
                  animationDelay: `${i * 0.35}s`,
                }}
              />
            ))}
            <text x={g.cx} y={g.cy + 58} textAnchor="middle"
              fontSize="8.5" fill={g.color} fillOpacity="0.55" fontFamily="Inter,sans-serif">
              {g.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── 3. Real-Time Risk Scoring — animated arc gauge ────────────────────────────
export const RiskScoreDemo = () => {
  const [score, setScore] = useState(0);
  const TARGET = 73;

  useEffect(() => {
    let timeout;
    let val = 0;
    const tick = () => {
      if (val >= TARGET) {
        timeout = setTimeout(() => { val = 0; setScore(0); timeout = setTimeout(tick, 200); }, 2200);
        return;
      }
      val += 2;
      setScore(Math.min(val, TARGET));
      timeout = setTimeout(tick, 35);
    };
    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, []);

  const R = 52;
  const circ = 2 * Math.PI * R;
  const filled = (score / 100) * circ;
  const color = score < 40 ? "#22c55e" : score < 70 ? "#f59e0b" : "#ef4444";
  const riskLabel = score < 40 ? "LOW" : score < 70 ? "MEDIUM" : "HIGH";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        <svg width="134" height="134">
          <circle cx="67" cy="67" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle cx="67" cy="67" r={R} fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 67 67)"
            style={{ transition: "stroke 0.6s" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "2rem", fontWeight: 700, color: "#f1f0f4", letterSpacing: "-0.04em", lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: "9px", fontWeight: 700, color, letterSpacing: "0.1em", marginTop: "4px" }}>{riskLabel}</span>
        </div>
      </div>
    </div>
  );
};

// ── 4. Sanctions Screening — animated address scan ────────────────────────────
export const SanctionsDemo = () => {
  const rows = [
    { addr: "0x1a2b…c3d4", result: "clear" },
    { addr: "0xf5e6…7891", result: "flagged", match: "OFAC SDN" },
    { addr: "0x2b3c…d4e5", result: "clear" },
    { addr: "0x9a8b…6c7d", result: "flagged", match: "Tornado Cash" },
    { addr: "0x3c4d…e5f6", result: "clear" },
  ];

  const [checked, setChecked] = useState(0);

  useEffect(() => {
    let timeout;
    let count = 0;
    const advance = () => {
      count = count < rows.length ? count + 1 : 0;
      setChecked(count);
      timeout = setTimeout(advance, count === 0 ? 500 : count === rows.length ? 2200 : 700);
    };
    timeout = setTimeout(advance, 400);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ padding: "14px 18px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: "9px" }}>
      {rows.map((row, i) => {
        const revealed = i < checked;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.22)", flexShrink: 0 }}>
              {row.addr}
            </span>
            <span style={{
              fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em",
              padding: "2px 8px", borderRadius: "3px", flexShrink: 0,
              opacity: revealed ? 1 : 0.2,
              background: revealed ? (row.result === "flagged" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.08)") : "rgba(255,255,255,0.03)",
              border: `1px solid ${revealed ? (row.result === "flagged" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.25)") : "rgba(255,255,255,0.06)"}`,
              color: revealed ? (row.result === "flagged" ? "#ef4444" : "#4ade80") : "#374151",
              transition: "all 0.4s ease",
            }}>
              {revealed ? (row.result === "flagged" ? row.match : "CLEAR") : "···"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── 5. Cross-Chain Coverage — animated coverage bars ─────────────────────────
export const CrossChainDemo = () => {
  const chains = [
    { name: "ETH",  pct: 88 },
    { name: "POL",  pct: 71 },
    { name: "ARB",  pct: 79 },
    { name: "OP",   pct: 62 },
    { name: "BASE", pct: 55 },
  ];

  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ padding: "16px 22px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: "11px" }}>
      {chains.map((c, i) => (
        <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "36px", fontSize: "9px", fontWeight: 600, color: "#4b5563", fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{c.name}</span>
          <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: loaded ? `${c.pct}%` : "0%",
              background: "rgba(139,92,246,0.6)",
              borderRadius: "2px",
              transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.12}s`,
            }} />
          </div>
          <span style={{ width: "26px", fontSize: "9px", color: "#374151", textAlign: "right", flexShrink: 0 }}>{c.pct}%</span>
        </div>
      ))}
    </div>
  );
};

// ── 6. Audit Reporting — animated report generation ──────────────────────────
export const AuditDemo = () => {
  const lines = [
    { key: "Address",    val: "0x1A2b…C4Df" },
    { key: "Risk Score", val: "73 — HIGH",        accent: "#ef4444" },
    { key: "Sanctions",  val: "2 matches",         accent: "#ef4444" },
    { key: "Exposure",   val: "$2.4M flagged" },
    { key: "Hops",       val: "6 levels" },
    { key: "Chains",     val: "ETH · ARB · BASE" },
    { key: "Status",     val: "Export ready",      accent: "#4ade80" },
  ];

  const [count, setCount] = useState(0);

  useEffect(() => {
    let timeout;
    let i = 0;
    const advance = () => {
      i = i < lines.length ? i + 1 : 0;
      setCount(i);
      timeout = setTimeout(advance, i === 0 ? 500 : i === lines.length ? 2500 : 280);
    };
    timeout = setTimeout(advance, 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ padding: "14px 18px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <style>{`@keyframes fadeSl { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ fontSize: "9px", letterSpacing: "0.1em", color: "#374151", marginBottom: "12px" }}>
        {count >= lines.length ? "REPORT GENERATED" : "GENERATING REPORT..."}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {lines.slice(0, count).map((l, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", animation: "fadeSl 0.2s ease" }}>
            <span style={{ fontSize: "9px", color: "#374151", width: "64px", flexShrink: 0 }}>{l.key}</span>
            <span style={{ fontSize: "10px", color: l.accent || "#9ca3af", fontFamily: "'JetBrains Mono',monospace" }}>{l.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
