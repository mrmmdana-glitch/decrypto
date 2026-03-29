import { useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';

const RECENT_INVESTIGATIONS = [
  { address: '1A1zP1...vfNa', full: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', label: 'Genesis Block', risk: 'low', score: 4 },
  { address: 'bc1qxy...x0wlh', full: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', label: 'Unknown Wallet', risk: 'critical', score: 89 },
  { address: '1P5ZED...fHQ', full: '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ', label: 'High-Risk Service', risk: 'high', score: 74 },
];

const RISK_DOT = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#fbbf24',
  low: '#4ade80',
};

export default function AnalyseScreen({ onAnalyse, onBack }) {
  const [address, setAddress] = useState('');
  const [focused, setFocused] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyse = (target) => {
    const addr = (target || address).trim();
    if (!addr) {
      setError('Enter a wallet address to start an investigation.');
      return;
    }

    setError('');
    setIsAnalysing(true);
    setTimeout(() => {
      setIsAnalysing(false);
      onAnalyse(addr);
    }, 700);
  };

  return (
    <div className="relative h-full overflow-y-auto" style={{ background: '#090a0f' }}>
      <div className="absolute inset-0 bg-dot-grid opacity-15 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 900px 640px at 50% 12%, rgba(139,92,246,0.05) 0%, transparent 62%)' }}
      />

      <div className="relative z-[1] mx-auto min-h-full w-full max-w-[1280px] px-5 pb-20 pt-6">
        <button
          onClick={onBack}
          className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-300"
        >
          Back to home
        </button>

        <div className="mx-auto mt-16 w-full max-w-[980px]">
          <div className="mb-12 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03]">
              <ShieldAlert size={20} className="text-violet-300" />
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-5xl">
              Analyse wallet
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
              Enter a Bitcoin address to generate a risk profile, staged fund-flow graph, and investigation summary.
            </p>
          </div>

          <div className="rounded-[28px] bg-[#0d0f17]/94 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
            <label className="block text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
              Target address
            </label>
            <div
              className="relative mt-4 flex items-center rounded-[20px] bg-[#0a0c14] transition-all"
              style={{
                boxShadow: focused ? '0 0 0 1px rgba(139,92,246,0.24)' : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
              }}
            >
              <Search size={16} className="absolute left-4 text-slate-500" />
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (error) setError('');
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyse()}
                placeholder="Bitcoin address (1..., 3..., or bc1...)"
                className="w-full bg-transparent py-4 pl-12 pr-5 text-[15px] text-slate-100 outline-none placeholder:text-slate-600"
                spellCheck={false}
                autoFocus
              />
            </div>

            {error && (
              <div className="mt-3 text-[12px] text-rose-300">
                {error}
              </div>
            )}

            <button
              onClick={() => handleAnalyse()}
              disabled={isAnalysing || !address.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-violet-400/[0.10] px-5 py-4 text-[11px] font-mono uppercase tracking-[0.2em] text-violet-200 transition-colors hover:bg-violet-400/[0.14] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAnalysing ? (
                <>
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2"
                    style={{ borderColor: 'rgba(196,181,253,0.22)', borderTopColor: '#c4b5fd' }}
                  />
                  Loading investigation
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  Start investigation
                </>
              )}
            </button>
          </div>

          <div className="mt-8">
            <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.22em] text-slate-600">Recent investigations</div>
            <div className="space-y-2">
              {RECENT_INVESTIGATIONS.map((inv) => (
                <button
                  key={inv.address}
                  onClick={() => handleAnalyse(inv.full)}
                  className="flex w-full items-center justify-between rounded-[18px] bg-[#0f1119] px-4 py-3 text-left transition-colors hover:bg-[#121521]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: RISK_DOT[inv.risk] }} />
                    <span className="text-[12px] font-mono text-slate-300">{inv.address}</span>
                    <span className="truncate text-[12px] text-slate-600">{inv.label}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-200">{inv.score}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
