import { motion, useTransform, useScroll } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Bitcoin, Flag, PieChart, Activity, Network, Eye } from "lucide-react";

// Per-card theme: icon, accent colour, hover border/glow colour
const CARD_META = {
  1: { Icon: Bitcoin,  accent: "#f97316", hoverBorder: "rgba(249,115,22,0.5)",  hoverGlow: "rgba(249,115,22,0.12)",  hoverGrad: "rgba(249,115,22,0.07)"  },
  2: { Icon: Flag,     accent: "#ef4444", hoverBorder: "rgba(239,68,68,0.5)",   hoverGlow: "rgba(239,68,68,0.12)",   hoverGrad: "rgba(239,68,68,0.07)"   },
  3: { Icon: PieChart, accent: "#a855f7", hoverBorder: "rgba(168,85,247,0.5)",  hoverGlow: "rgba(168,85,247,0.12)",  hoverGrad: "rgba(168,85,247,0.07)"  },
  4: { Icon: Activity, accent: "#06b6d4", hoverBorder: "rgba(6,182,212,0.5)",   hoverGlow: "rgba(6,182,212,0.12)",   hoverGrad: "rgba(6,182,212,0.07)"   },
  5: { Icon: Network,  accent: "#8b5cf6", hoverBorder: "rgba(139,92,246,0.5)",  hoverGlow: "rgba(139,92,246,0.12)",  hoverGrad: "rgba(139,92,246,0.07)"  },
  6: { Icon: Eye,      accent: "#10b981", hoverBorder: "rgba(16,185,129,0.5)",  hoverGlow: "rgba(16,185,129,0.12)",  hoverGrad: "rgba(16,185,129,0.07)"  },
};

// ─── SVG background visuals — low opacity, edge-pushed, never touch text area ─

// 1. Illicit Flow — slow animated network flow lines with curved paths
const BgIllicitFlow = () => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.07, pointerEvents:"none" }}
    viewBox="0 0 480 340" preserveAspectRatio="xMidYMid slice">
    {/* Edge nodes */}
    {[[18,28],[52,290],[460,18],[462,298],[240,8],[240,320]].map(([cx,cy],i) => (
      <circle key={i} cx={cx} cy={cy} r={3} fill="#ef4444" />
    ))}
    {/* Curved flow paths */}
    <path d="M18,28 C80,80 160,60 240,8" fill="none" stroke="#ef4444" strokeWidth="1"
      strokeDasharray="6 6" style={{ animation:"flowDash1 8s linear infinite" }} />
    <path d="M52,290 C120,240 180,260 240,320" fill="none" stroke="#ef4444" strokeWidth="1"
      strokeDasharray="6 6" style={{ animation:"flowDash2 10s linear infinite" }} />
    <path d="M460,18 C400,80 340,60 240,8" fill="none" stroke="#ef4444" strokeWidth="1"
      strokeDasharray="6 6" style={{ animation:"flowDash1 9s linear infinite reverse" }} />
    <path d="M462,298 C400,240 340,260 240,320" fill="none" stroke="#ef4444" strokeWidth="1"
      strokeDasharray="6 6" style={{ animation:"flowDash3 11s linear infinite reverse" }} />
    <path d="M18,28 C60,120 40,200 52,290" fill="none" stroke="#ef4444" strokeWidth="0.8"
      strokeDasharray="4 8" style={{ animation:"flowDash2 13s linear infinite" }} />
    <path d="M460,18 C440,120 460,200 462,298" fill="none" stroke="#ef4444" strokeWidth="0.8"
      strokeDasharray="4 8" style={{ animation:"flowDash1 12s linear infinite reverse" }} />
    {/* Corner edge gradient vignette to keep centre dark */}
    <radialGradient id="vigF" cx="50%" cy="50%" r="55%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#08090e" stopOpacity="1" />
      <stop offset="100%" stopColor="#08090e" stopOpacity="0" />
    </radialGradient>
    <rect width="480" height="340" fill="url(#vigF)" />
  </svg>
);

// 2. Sanctions — one red highlighted cluster at far edge, network dimmed
const BgSanctions = () => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.1, pointerEvents:"none" }}
    viewBox="0 0 480 340" preserveAspectRatio="xMidYMid slice">
    {/* Dimmed outer network */}
    {[[30,40],[85,20],[140,55],[60,120],[110,160]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r={3.5} fill="rgba(255,255,255,0.25)" />
    ))}
    {[[30,40],[85,20]].map(([x,y],i) => (
      <line key={i} x1={x} y1={y} x2={[85,140][i]} y2={[20,55][i]} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    ))}
    <line x1="85" y1="20" x2="140" y2="55" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    <line x1="30" y1="40" x2="60" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    <line x1="85" y1="20" x2="110" y2="160" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    {/* Red sanctioned cluster — bottom right edge */}
    {[[420,280],[455,250],[462,305],[435,240],[470,275]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r={i===0?6:4} fill="#ef4444" opacity={i===0?0.9:0.5} />
    ))}
    <line x1="420" y1="280" x2="455" y2="250" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
    <line x1="420" y1="280" x2="462" y2="305" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
    <line x1="420" y1="280" x2="435" y2="240" stroke="#ef4444" strokeWidth="1.2" opacity="0.5" />
    <line x1="420" y1="280" x2="470" y2="275" stroke="#ef4444" strokeWidth="1.2" opacity="0.5" />
    <radialGradient id="vigS" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#08090e" stopOpacity="1" />
      <stop offset="80%" stopColor="#08090e" stopOpacity="0" />
    </radialGradient>
    <rect width="480" height="340" fill="url(#vigS)" />
  </svg>
);

// 3. Volume (1.2%) — large faint mass, tiny highlighted portion
const BgVolume = () => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.09, pointerEvents:"none" }}
    viewBox="0 0 480 340" preserveAspectRatio="xMidYMid slice">
    {/* Large faint mass — far right edge */}
    <circle cx="430" cy="170" r="130" fill="rgba(255,255,255,0.08)" />
    <circle cx="430" cy="170" r="90" fill="rgba(255,255,255,0.06)" />
    <circle cx="430" cy="170" r="50" fill="rgba(255,255,255,0.09)" />
    {/* Small highlighted 1.2% slice — top-left edge */}
    <circle cx="42" cy="38" r="18" fill="#ef4444" opacity="0.6" />
    <circle cx="42" cy="38" r="10" fill="#ef4444" opacity="0.8" />
    {/* Centre dark vignette */}
    <radialGradient id="vigV" cx="50%" cy="50%" r="55%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#08090e" stopOpacity="1" />
      <stop offset="100%" stopColor="#08090e" stopOpacity="0" />
    </radialGradient>
    <rect width="480" height="340" fill="url(#vigV)" />
  </svg>
);

// 4. Liquidity — emphasized flow paths at edges
const BgLiquidity = () => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.08, pointerEvents:"none" }}
    viewBox="0 0 480 340" preserveAspectRatio="xMidYMid slice">
    {/* Diagonal flow paths along edges */}
    <path d="M0,80 Q60,40 120,90 T240,80 T360,100 T480,70" fill="none" stroke="rgba(6,182,212,0.7)" strokeWidth="1.5"
      strokeDasharray="8 6" style={{ animation:"liqFlow 14s linear infinite" }} />
    <path d="M0,260 Q60,300 120,250 T240,260 T360,240 T480,270" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="1"
      strokeDasharray="6 8" style={{ animation:"liqFlow 18s linear infinite reverse" }} />
    <path d="M40,0 Q20,80 50,160 T30,340" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="1"
      strokeDasharray="5 9" style={{ animation:"liqFlow 16s linear infinite" }} />
    <path d="M440,0 Q460,80 430,160 T450,340" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="1"
      strokeDasharray="5 9" style={{ animation:"liqFlow 20s linear infinite reverse" }} />
    <radialGradient id="vigL" cx="50%" cy="50%" r="52%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#08090e" stopOpacity="1" />
      <stop offset="100%" stopColor="#08090e" stopOpacity="0" />
    </radialGradient>
    <rect width="480" height="340" fill="url(#vigL)" />
  </svg>
);

// 5. Network Complexity — multi-step branching at edges
const BgNetwork = () => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.1, pointerEvents:"none" }}
    viewBox="0 0 480 340" preserveAspectRatio="xMidYMid slice">
    {/* Branching tree — left edge */}
    <line x1="20" y1="170" x2="70" y2="100" stroke="rgba(139,92,246,0.6)" strokeWidth="1" />
    <line x1="20" y1="170" x2="70" y2="240" stroke="rgba(139,92,246,0.6)" strokeWidth="1" />
    <line x1="70" y1="100" x2="120" y2="60" stroke="rgba(139,92,246,0.5)" strokeWidth="1" />
    <line x1="70" y1="100" x2="120" y2="130" stroke="rgba(139,92,246,0.5)" strokeWidth="1" />
    <line x1="70" y1="240" x2="120" y2="210" stroke="rgba(139,92,246,0.5)" strokeWidth="1" />
    <line x1="70" y1="240" x2="120" y2="280" stroke="rgba(139,92,246,0.5)" strokeWidth="1" />
    {[{x:20,y:170},{x:70,y:100},{x:70,y:240},{x:120,y:60},{x:120,y:130},{x:120,y:210},{x:120,y:280}].map((n,i) => (
      <circle key={i} cx={n.x} cy={n.y} r={i===0?4.5:3} fill="rgba(139,92,246,0.8)" />
    ))}
    {/* Mirror — right edge */}
    <line x1="460" y1="170" x2="410" y2="100" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
    <line x1="460" y1="170" x2="410" y2="240" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
    <line x1="410" y1="100" x2="360" y2="60" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
    <line x1="410" y1="100" x2="360" y2="130" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
    <line x1="410" y1="240" x2="360" y2="210" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
    <line x1="410" y1="240" x2="360" y2="280" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
    {[{x:460,y:170},{x:410,y:100},{x:410,y:240},{x:360,y:60},{x:360,y:130},{x:360,y:210},{x:360,y:280}].map((n,i) => (
      <circle key={i} cx={n.x} cy={n.y} r={i===0?4:2.5} fill="rgba(139,92,246,0.6)" />
    ))}
    <radialGradient id="vigN" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#08090e" stopOpacity="1" />
      <stop offset="85%" stopColor="#08090e" stopOpacity="0" />
    </radialGradient>
    <rect width="480" height="340" fill="url(#vigN)" />
  </svg>
);

// 6. Detection Limitation — single node vs full network comparison
const BgDetection = () => (
  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.1, pointerEvents:"none" }}
    viewBox="0 0 480 340" preserveAspectRatio="xMidYMid slice">
    {/* Left — isolated single node */}
    <circle cx="52" cy="170" r="7" fill="rgba(255,255,255,0.4)" />
    <circle cx="52" cy="170" r="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
    {/* Right — full network (dimmed) */}
    {[[400,60],[440,100],[460,160],[440,220],[400,270],[360,300],[320,270],[300,210],[320,150],[360,110]].map(([x,y],i,arr) => {
      const next = arr[(i+1)%arr.length];
      return <line key={i} x1={x} y1={y} x2={next[0]} y2={next[1]} stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />;
    })}
    {/* Cross-connections */}
    <line x1="400" y1="60" x2="460" y2="160" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
    <line x1="440" y1="100" x2="440" y2="220" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
    <line x1="400" y1="270" x2="320" y2="150" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
    {[[400,60],[440,100],[460,160],[440,220],[400,270],[360,300],[320,270],[300,210],[320,150],[360,110]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r={2.8} fill="rgba(255,255,255,0.35)" />
    ))}
    <radialGradient id="vigD" cx="50%" cy="50%" r="52%" gradientUnits="objectBoundingBox">
      <stop offset="0%" stopColor="#08090e" stopOpacity="1" />
      <stop offset="90%" stopColor="#08090e" stopOpacity="0" />
    </radialGradient>
    <rect width="480" height="340" fill="url(#vigD)" />
  </svg>
);

const BG_MAP = { 1: BgIllicitFlow, 2: BgSanctions, 3: BgVolume, 4: BgLiquidity, 5: BgNetwork, 6: BgDetection };

// ─── Carousel ────────────────────────────────────────────────────────────────

const HorizontalScrollCarousel = ({ items, scrollContainer }) => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef, container: scrollContainer });
  const x = useTransform(scrollYProgress, [0, 0.85], ["2%", "-72%"]);

  // Scroll-driven active index (0-based)
  const scrollActiveRaw = useTransform(
    scrollYProgress,
    [0, 0.21, 0.22, 0.47, 0.48, 0.73, 0.74, 1.0],
    [0, 0,    1,    1,    2,    2,    3,    3]
  );
  const [scrollActiveIdx, setScrollActiveIdx] = useState(0);
  useEffect(() => scrollActiveRaw.on("change", v => setScrollActiveIdx(Math.round(v))), [scrollActiveRaw]);

  // Hover overrides scroll-based active
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <section ref={targetRef} style={{ height: "420vh", background: "#08090e", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <div style={{ padding: "0 64px 28px", textAlign: "center" }}>
          <span style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "rgba(139,92,246,0.45)",
          }}>
            Problem Structure
          </span>
        </div>
        <div className="overflow-hidden">
          <motion.div style={{ x }} className="flex gap-10 pl-16">
            {items.map(item => {
              const isScrollActive = scrollActiveIdx === item.id - 1;
              const isHoverActive  = hoveredId === item.id;
              const isActive = isHoverActive || (hoveredId === null && isScrollActive);
              return (
                <ProblemCard
                  key={item.id}
                  item={item}
                  state={isActive ? "active" : "dim"}
                  onHover={() => setHoveredId(item.id)}
                  onLeave={() => setHoveredId(null)}
                />
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// state: "default" | "active" | "dim"
const ProblemCard = ({ item, state, onHover, onLeave }) => {
  const Bg = BG_MAP[item.id];
  const { Icon, accent, hoverBorder, hoverGlow, hoverGrad } = CARD_META[item.id];

  const cardStyle = {
    flexShrink: 0,
    width: "460px",
    position: "relative",
    overflow: "hidden",
    borderRadius: "8px",
    cursor: "default",
    background: "#0b0c13",
    border: state === "active"
      ? `1px solid ${hoverBorder}`
      : "1px solid rgba(255,255,255,0.07)",
    boxShadow: state === "active"
      ? `0 0 0 1px ${hoverGlow}, 0 10px 40px ${hoverGlow}, inset 0 1px 0 rgba(255,255,255,0.03)`
      : "none",
    backgroundImage: state === "active"
      ? `linear-gradient(160deg, ${hoverGrad} 0%, transparent 50%)`
      : "none",
    opacity: state === "dim" ? 0.38 : 1,
    transition: "opacity 200ms ease, border-color 200ms ease, box-shadow 200ms ease, background-image 200ms ease",
  };

  return (
    <div style={cardStyle} onMouseEnter={onHover} onMouseLeave={onLeave}>
      {/* SVG visual — absolute behind all content */}
      {Bg && <Bg />}

      {/* Large icon visual — top area */}
      <div style={{
        position: "relative",
        height: "160px",
        overflow: "hidden",
      }}>
        {/* Giant faint icon — brightens slightly on active */}
        <Icon
          size={140}
          style={{
            color: accent,
            opacity: state === "active" ? 0.16 : 0.09,
            position: "absolute",
            right: "-10px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            transition: "opacity 200ms ease",
          }}
          strokeWidth={1}
        />
        {/* Icon badge removed — large bg icon provides sufficient visual identity */}
        {/* Value */}
        <div style={{
          fontSize: "clamp(2.4rem,4vw,3.8rem)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: state === "active" ? "#ffffff" : "#d4d4d8",
          position: "absolute",
          bottom: "18px",
          left: "36px",
          transition: "color 200ms ease",
        }}>
          {item.value}
        </div>
      </div>

      {/* Divider — accent tinted on active */}
      <div style={{
        height: "1px",
        background: state === "active"
          ? `linear-gradient(to right, ${hoverBorder}, transparent)`
          : `linear-gradient(to right, rgba(255,255,255,0.07), transparent)`,
        margin: "0 36px",
        transition: "background 200ms ease",
      }} />

      {/* Text content */}
      <div style={{ position: "relative", zIndex: 1, padding: "24px 36px 32px" }}>
        {/* Label */}
        <div style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", marginBottom: "6px",
          color: state === "active" ? accent : "rgba(255,255,255,0.3)",
          transition: "color 200ms ease",
        }}>
          {item.title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: "15px", fontWeight: 500,
          color: state === "active" ? "#e5e7eb" : "#9ca3af",
          marginBottom: "20px",
          lineHeight: 1.4,
          transition: "color 200ms ease",
        }}>
          {item.subtitle}
        </div>

        {/* Bullets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {item.bullets.map((b, i) => (
            <p key={i} style={{
              fontSize: "13px", lineHeight: "1.7",
              color: state === "active" ? "#6b7280" : "#4b5563",
              margin: 0,
              transition: "color 200ms ease",
            }}>{b}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HorizontalScrollCarousel;
