import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, Network, ArrowRight, ChevronDown, Home, LayoutDashboard,
} from "lucide-react";
import LetterGlitch from "./LetterGlitch";
import HorizontalScrollCarousel from "./ui/horizontal-scroll-carousel";
import { GraphDemo, ClusteringDemo, RiskScoreDemo, SanctionsDemo, CrossChainDemo, AuditDemo } from "./ui/capability-demos";

const PROBLEMS = [
  {
    id: 1,
    title: "Scale of Illicit Flow",
    value: "$158B",
    subtitle: "Estimated illicit crypto activity",
    bullets: [
      "The highest recorded level, driven by growth in large, coordinated networks.",
      "Activity is concentrated, persistent, and increasingly structured.",
    ],
  },
  {
    id: 2,
    title: "Sanctions Dominance",
    value: "$93B",
    subtitle: "Linked to sanctioned entities",
    bullets: [
      "A significant share of illicit activity flows through sanctioned services and state-aligned infrastructure.",
      "These networks operate with scale and continuity.",
    ],
  },
  {
    id: 3,
    title: "Misleading Share",
    value: "1.2%",
    subtitle: "Of total transaction volume",
    bullets: [
      "The proportion appears small relative to overall market size.",
      "Risk concentrates within specific flows, not evenly across activity.",
    ],
  },
  {
    id: 4,
    title: "Liquidity Impact",
    value: "2.7%",
    subtitle: "Of available liquidity",
    bullets: [
      "Represents capital actively moving through illicit pathways.",
      "Exposure sits within usable market flows, not at the margins.",
    ],
  },
  {
    id: 5,
    title: "Network Complexity",
    value: "Multi-step",
    subtitle: "Routing across wallets and services",
    bullets: [
      "Funds move through chains of transactions, often split, rerouted, and recombined.",
      "Behaviour emerges across sequences, not from individual transfers.",
    ],
  },
  {
    id: 6,
    title: "Detection Limitation",
    value: "Incomplete",
    subtitle: "Transaction-level analysis falls short",
    bullets: [
      "Single transfers provide limited context on their own.",
      "Meaning emerges from relationships, timing, and structure.",
    ],
  },
];

const FEATURES = [
  {
    Demo: GraphDemo,
    label: "Graph Intelligence",
    desc: "Visualise multi-hop transaction flows as interactive force graphs. Follow the money across hundreds of hops in seconds.",
  },
  {
    Demo: ClusteringDemo,
    label: "Entity Clustering",
    desc: "Auto-cluster exchanges, mixers, bridges, and dark-net actors from on-chain heuristics. No manual labelling required.",
  },
  {
    Demo: RiskScoreDemo,
    label: "Real-Time Risk Scoring",
    desc: "AML risk scores derived from 22 behavioural and network signals, updated every block as new transactions arrive.",
  },
  {
    Demo: SanctionsDemo,
    label: "Sanctions Screening",
    desc: "Continuously synced OFAC, EU, and UN sanctions lists. Instant match alerts for any flagged counterparty.",
  },
  {
    Demo: CrossChainDemo,
    label: "Cross-Chain Coverage",
    desc: "Ethereum, Polygon, Arbitrum, Optimism, and Base. All in a unified investigation workspace.",
  },
  {
    Demo: AuditDemo,
    label: "Audit Reporting",
    desc: "Export investigation timelines, risk summaries, and graph snapshots as structured PDF or JSON reports.",
  },
];

const STEPS = [
  { n: "01", title: "Enter an Address", desc: "Paste any wallet address, ENS name, or known entity label to begin an investigation." },
  { n: "02", title: "Explore the Graph", desc: "Interact with the live transaction graph. Expand hops, filter by risk, highlight clusters." },
  { n: "03", title: "Assess & Act", desc: "Review the risk score, match against sanctions, and export a full audit trail." },
];

/* ─── Step 1: Wallet Input Visual ──────────────────────────────────────────── */
function Step1Visual() {
  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "14px", padding: "16px 20px",
    }}>
      {/* URL / chain bar */}
      <div style={{
        width: "100%", maxWidth: "300px",
        display: "flex", alignItems: "center", gap: "7px",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "6px", padding: "6px 10px",
      }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", fontFamily: "monospace", letterSpacing: "0.03em" }}>
          ethereum mainnet
        </span>
      </div>

      {/* Main input field */}
      <div style={{
        width: "100%", maxWidth: "300px",
        background: "rgba(139,92,246,0.05)",
        border: "1px solid rgba(139,92,246,0.3)",
        borderRadius: "8px", padding: "10px 14px",
        boxShadow: "0 0 16px rgba(139,92,246,0.08)",
      }}>
        <div style={{ fontSize: "9px", color: "rgba(139,92,246,0.55)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
          Wallet Address
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <span style={{ fontSize: "11px", color: "#c4b5fd", fontFamily: "monospace", letterSpacing: "0.02em" }}>
            0x3f5CE5FBFe3E9af3971dD8
          </span>
          <span style={{
            display: "inline-block", width: "1px", height: "13px",
            background: "#a78bfa",
            animation: "decryptoBlink 1.1s step-end infinite",
          }} />
        </div>
      </div>

      {/* ENS + button row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", maxWidth: "300px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)",
          borderRadius: "20px", padding: "3px 9px",
        }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: "10px", color: "#4ade80", fontFamily: "monospace" }}>vitalik.eth</span>
        </div>
        <div style={{
          marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px",
          background: "linear-gradient(135deg, rgba(139,92,246,0.55), rgba(99,102,241,0.45))",
          border: "1px solid rgba(139,92,246,0.4)", borderRadius: "6px",
          padding: "5px 12px", cursor: "pointer",
        }}>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#f1f0f4" }}>Analyse</span>
          <span style={{ fontSize: "10px", color: "#c4b5fd" }}>→</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Graph Exploration Visual ─────────────────────────────────────── */
function Step2Visual() {
  // Static node layout: [cx, cy, isSuspect, radius]
  const nodes = [
    [100, 110, false, 4.5],
    [60,  70,  false, 3.5],
    [160, 60,  true,  5],
    [220, 90,  true,  5.5],
    [260, 50,  true,  4],
    [190, 150, false, 3.5],
    [120, 170, false, 4],
    [50,  150, false, 3],
    [290, 130, true,  4.5],
    [240, 170, false, 3.5],
  ];
  const edges = [
    [0,1,false],[0,2,false],[2,3,true],[3,4,true],[3,8,true],
    [0,6,false],[1,7,false],[3,9,false],[0,5,false],[2,5,false],
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 340 220" style={{ overflow: "visible" }}>
      {/* Dim overlay for non-suspect nodes */}
      <defs>
        <radialGradient id="suspectGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </radialGradient>
        <filter id="gf" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        {/* Animated dash for suspect edges */}
        <style>{`
          @keyframes dashMove { to { stroke-dashoffset: -16; } }
          @keyframes pulseSuspect { 0%,100% { opacity:0.65; } 50% { opacity:1; } }
          @keyframes decryptoBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        `}</style>
      </defs>

      {/* Edges */}
      {edges.map(([a, b, isSuspect], i) => {
        const [x1,y1] = nodes[a];
        const [x2,y2] = nodes[b];
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isSuspect ? "#ef4444" : "rgba(255,255,255,0.1)"}
            strokeWidth={isSuspect ? 1.5 : 1}
            strokeDasharray={isSuspect ? "5,3" : undefined}
            style={isSuspect ? { animation: "dashMove 0.7s linear infinite" } : undefined}
            opacity={isSuspect ? 0.85 : 0.4}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(([cx, cy, isSuspect, r], i) => (
        <g key={i}>
          {isSuspect && (
            <circle cx={cx} cy={cy} r={r + 6} fill="url(#suspectGlow)" filter="url(#gf)" />
          )}
          <circle cx={cx} cy={cy} r={r}
            fill={isSuspect ? "#ef4444" : "#2a1f3d"}
            stroke={isSuspect ? "#f87171" : "rgba(139,92,246,0.3)"}
            strokeWidth={isSuspect ? 1.5 : 1}
            opacity={isSuspect ? 1 : 0.5}
            style={isSuspect ? { animation: "pulseSuspect 1.8s ease-in-out infinite", animationDelay: `${i*0.2}s` } : undefined}
          />
        </g>
      ))}

      {/* "Suspicious path" label */}
      <rect x="148" y="4" width="104" height="16" rx="4"
        fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeWidth="1" />
      <text x="200" y="15" textAnchor="middle"
        style={{ fontSize: "8px", fill: "#f87171", fontFamily: "monospace", letterSpacing: "0.08em" }}>
        SUSPICIOUS PATH
      </text>
    </svg>
  );
}

/* ─── Step 3: Risk / Report Visual ─────────────────────────────────────────── */
function Step3Visual() {
  const score = 73;
  const r = 32, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "stretch",
      gap: "10px", padding: "14px 16px",
    }}>
      {/* Left: risk meter */}
      <div style={{
        flex: "0 0 auto", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
        borderRadius: "8px", padding: "14px 18px",
      }}>
        <div style={{ position: "relative", width: "84px", height: "84px" }}>
          <svg width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="42" cy="42" r={r} fill="none"
              stroke="#ef4444" strokeWidth="5"
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px rgba(239,68,68,0.6))" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "22px", fontWeight: 800, color: "#f87171", lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: "8px", color: "rgba(239,68,68,0.6)", letterSpacing: "0.1em", marginTop: "2px" }}>RISK</span>
          </div>
        </div>
      </div>

      {/* Right: findings list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
        {[
          { dot: "#ef4444", label: "Sanctions Match", value: "OFAC SDN", valueColor: "#f87171" },
          { dot: "#f97316", label: "Flagged Path", value: "3 hops", valueColor: "#fb923c" },
          { dot: "#a78bfa", label: "Mixer Exposure", value: "18.4%", valueColor: "#c4b5fd" },
        ].map(({ dot, label, value, valueColor }, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "6px", padding: "6px 10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: dot }} />
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, color: valueColor, fontFamily: "monospace" }}>{value}</span>
          </div>
        ))}

        {/* Export button */}
        <div style={{
          display: "flex", alignItems: "center", gap: "5px", justifyContent: "center",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px", padding: "6px 0", cursor: "pointer",
        }}>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>Export Report</span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>↓</span>
        </div>
      </div>
    </div>
  );
}

export default function EntryScreen({ onAnalyseWallet, onScanNetwork }) {
  const scrollRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#08090e" }}>

      {/* ── Scrollable content layer ── */}
      <div
        ref={scrollRef}
        className="relative z-[1] w-full h-full overflow-y-auto overflow-x-hidden"
        style={{ background: "#08090e" }}
      >
      {/* ─────────────────────────────────────────────
          FIXED NAV — visible always, glass on scroll
      ───────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-8 py-4 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(9,10,15,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(139,92,246,0.1)" : "1px solid transparent",
        }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} style={{ color: "#6b7280" }} />
            <span className="text-base font-semibold" style={{ color: "#ffffff", letterSpacing: "-0.01em" }}>
              Decrypto
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.1)", fontSize: "12px" }}>|</span>
          {/* Nav links */}
          <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
            style={{ color: "#94a3b8", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Home size={13} />
            Home
          </button>
          <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "12px", padding: "0 2px" }}>|</span>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150"
            style={{ color: "#94a3b8", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "transparent"; }}
            onClick={onAnalyseWallet}
          >
            <LayoutDashboard size={13} />
            Dashboard
          </button>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────
          HERO — full viewport
      ───────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden" style={{ height: "100vh" }}>

        {/* LetterGlitch — scoped to hero only */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <LetterGlitch
            glitchColors={['#140a2e', '#3b1f6e', '#5b2d9e']}
            glitchSpeed={60}
            centerVignette={true}
            outerVignette={true}
            smooth={true}
          />
          {/* dim overlay so glitch reads as texture, not foreground */}
          <div className="absolute inset-0" style={{ background: 'rgba(8,9,14,0.72)' }} />
        </div>

        {/* Top/bottom fade only */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(8,9,14,0.6) 0%, transparent 20%, transparent 70%, rgba(8,9,14,1) 100%)",
          }}
        />

        {/* Hero content — minimal, let the terminal breathe */}
        <div className="relative z-[2] flex flex-col h-full items-center justify-center px-6 text-center">

          {/* Headline */}
          <h1
            className="decrypto-gradient font-black leading-none mb-6"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 8rem)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            DECRYPTO
          </h1>

          <p
            className="text-base leading-relaxed mb-10"
            style={{ color: "#64748b", maxWidth: "420px", fontWeight: 400 }}
          >
            Trace blockchain transactions, identify risk, and investigate wallet activity across multiple chains.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4">
            <button
              onClick={onAnalyseWallet}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.35)",
                color: "#c4b5fd",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}
            >
              <ShieldAlert size={14} />
              Analyse Wallet
              <ArrowRight size={13} />
            </button>

            <button
              onClick={onScanNetwork}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#64748b",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
            >
              <Network size={14} />
              Scan Network
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-0 right-0 z-[2] flex flex-col items-center gap-1 pointer-events-none">
          <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "#1e293b" }}>
            Scroll
          </span>
          <ChevronDown size={13} style={{ color: "#1e293b" }} className="animate-bounce" />
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          STATS — horizontal scroll carousel
      ───────────────────────────────────────────── */}
      <HorizontalScrollCarousel items={PROBLEMS} scrollContainer={scrollRef} />

      {/* ─────────────────────────────────────────────
          FEATURES GRID
      ───────────────────────────────────────────── */}
      <section
        className="w-full py-24 px-8"
        style={{ background: "#08090e", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <h2 className="text-2xl font-semibold" style={{ color: "#f1f0f4", letterSpacing: "-0.02em" }}>
              Capabilities
            </h2>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {FEATURES.map(({ Demo, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                  background: "#0b0c14",
                }}
              >
                <div style={{ height: "180px", background: "#0d0e17", position: "relative", overflow: "hidden" }}>
                  <Demo />
                </div>
                <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[13px] font-medium" style={{ color: "#e5e7eb", marginBottom: "6px" }}>{label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "#4b5563" }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────── */}
      <section
        className="w-full py-24 px-8"
        style={{ background: "#08090e", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: "64px" }}
          >
            <h2 className="text-2xl font-semibold" style={{ color: "#f1f0f4", letterSpacing: "-0.02em" }}>
              How it works
            </h2>
          </motion.div>

          {/* Step cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", position: "relative" }}>
            {/* Connector line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute", top: "46px",
                left: "calc(50% - 33%)", width: "66%", height: "1px",
                background: "linear-gradient(to right, rgba(139,92,246,0.08), rgba(139,92,246,0.35), rgba(139,92,246,0.08))",
                transformOrigin: "left center", pointerEvents: "none",
              }}
            />

            {STEPS.map(({ n, title, desc }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: i * 0.17, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "relative",
                  borderRadius: "10px",
                  background: "#0b0c13",
                  border: "1px solid rgba(255,255,255,0.07)",
                  overflow: "hidden",
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                  background: [
                    "linear-gradient(to right, rgba(139,92,246,0.9), rgba(99,102,241,0.4), transparent)",
                    "linear-gradient(to right, transparent, rgba(139,92,246,0.9), transparent)",
                    "linear-gradient(to right, transparent, rgba(99,102,241,0.4), rgba(139,92,246,0.9))",
                  ][i],
                }} />

                {/* Product visual area */}
                <div style={{ height: "220px", position: "relative", overflow: "hidden", background: "#0d0e17" }}>
                  {i === 0 && <Step1Visual />}
                  {i === 1 && <Step2Visual />}
                  {i === 2 && <Step3Visual />}
                </div>

                {/* Text area */}
                <div style={{ padding: "22px 24px 28px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{
                    fontSize: "9px", fontWeight: 700, letterSpacing: "0.16em",
                    color: "rgba(139,92,246,0.6)", textTransform: "uppercase", marginBottom: "8px",
                  }}>{n}</div>
                  <div style={{
                    fontSize: "15px", fontWeight: 600, color: "#f1f0f4",
                    marginBottom: "8px", letterSpacing: "-0.01em",
                  }}>{title}</div>
                  <div style={{ fontSize: "13px", lineHeight: 1.75, color: "#6b7280" }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FINAL CTA
      ───────────────────────────────────────────── */}
      <section
        className="w-full py-28 px-8"
        style={{ background: "#08090e", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-xl mx-auto">
          <h2
            className="text-3xl font-semibold mb-4"
            style={{ color: "#f1f0f4", letterSpacing: "-0.02em" }}
          >
            Start an investigation
          </h2>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "#4b5563" }}
          >
            Paste a wallet address and get a full risk profile, transaction graph
            and sanctions check. No account required.
          </p>
          <button
            onClick={onAnalyseWallet}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors duration-150"
            style={{
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              color: "#c4b5fd",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,92,246,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}
          >
            <ShieldAlert size={14} />
            Analyse a Wallet
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────── */}
      <footer
        className="w-full py-6 px-8 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-xs font-medium" style={{ color: "#374151" }}>Decrypto</span>
        <span className="text-xs" style={{ color: "#374151" }}>Mock data only. Not financial or legal advice.</span>
      </footer>
      </div>
    </div>
  );
}
