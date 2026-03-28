import { useState } from 'react';
import { Search, ShieldAlert, ArrowRight, ArrowLeft, Activity } from 'lucide-react';

const PLACEHOLDER_ADDRESSES = [
  '0x8f3Cfa8491c4D7876fA5D87CC8E5e2c4d1bA43f2',
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
];

const RECENT_INVESTIGATIONS = [
  { address: '0x8f3C...43f2', full: '0x8f3Cfa8491c4D7876fA5D87CC8E5e2c4d1bA43f2', label: 'Unknown Wallet',    risk: 'critical', score: 87 },
  { address: '0xd8dA...6045', full: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Exchange Deposit',  risk: 'low',      score: 14 },
  { address: '0x9522...fe5',  full: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5', label: 'High-Risk Service', risk: 'high',     score: 76 },
];

const RISK_DOT = {
  critical: '#f87171',
  high:     '#fb923c',
  medium:   '#fbbf24',
  low:      '#4ade80',
};

export default function AnalyseScreen({ onAnalyse, onBack }) {
  const [address,     setAddress]     = useState('');
  const [focused,     setFocused]     = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);

  const handleAnalyse = (target) => {
    const addr = target || address.trim() || PLACEHOLDER_ADDRESSES[0];
    setIsAnalysing(true);
    setTimeout(() => {
      setIsAnalysing(false);
      onAnalyse(addr);
    }, 1100);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#090a0f' }}>

      {/* Subtle dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />

      {/* Purple radial glow centred behind the card */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 700px 600px at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 70%)',
      }} />

      {/* Back button — top left */}
      <button
        onClick={onBack}
        className="absolute top-5 left-6 z-10 flex items-center gap-1.5 text-[11px] font-mono transition-colors"
        style={{ color: '#475569' }}
        onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
      >
        <ArrowLeft size={13} />
        Back
      </button>

      {/* Status — top right */}
      <div className="absolute top-5 right-6 z-10 flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#334155' }}>
        <Activity size={9} className="text-green-500 animate-pulse" />
        Live · Ethereum Mainnet
      </div>

      {/* Main card */}
      <div className="relative z-[1] w-full max-w-[500px] px-5 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.08) 100%)',
                border: '1px solid rgba(139,92,246,0.4)',
              }}>
              <ShieldAlert size={22} style={{ color: '#a78bfa' }} />
            </div>
            <div className="absolute -inset-2 rounded-3xl blur-2xl opacity-35 pointer-events-none"
              style={{ background: '#7c3aed' }} />
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-widest text-glow-purple mb-1.5"
            style={{ color: '#f1f0f4' }}>
            Analyse Wallet
          </h2>
          <p className="text-[11px] font-mono tracking-wider text-center" style={{ color: '#475569' }}>
            Enter an Ethereum address, ENS name, or known entity label
          </p>
        </div>

        {/* Glass input card */}
        <div className="glass-panel px-6 py-6 mb-3">

          {/* Input */}
          <label className="block text-[10px] font-mono uppercase tracking-widest mb-1.5"
            style={{ color: '#475569' }}>
            Target Address
          </label>
          <div
            className="relative flex items-center rounded-lg mb-4 transition-all duration-200"
            style={{
              background: 'rgba(9,10,15,0.75)',
              border: `1px solid ${focused ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
              boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
            }}
          >
            <Search size={14} className="absolute left-3.5 transition-colors"
              style={{ color: focused ? '#a78bfa' : '#475569' }} />
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyse()}
              placeholder="0x… address, ENS name, or entity label"
              className="w-full bg-transparent pl-10 pr-10 py-3 text-sm font-mono placeholder-slate-700 outline-none"
              style={{ color: '#f1f0f4' }}
              spellCheck={false}
              autoFocus
            />
            {address && (
              <button onClick={() => setAddress('')}
                className="absolute right-3.5 text-[11px] transition-colors"
                style={{ color: '#475569' }}
                onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                ✕
              </button>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => handleAnalyse()}
            disabled={isAnalysing}
            className="w-full py-3 rounded-lg text-sm font-semibold font-mono tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-200 group"
            style={{
              background: isAnalysing
                ? 'rgba(139,92,246,0.08)'
                : 'linear-gradient(135deg, rgba(139,92,246,0.24) 0%, rgba(124,58,237,0.16) 100%)',
              border: '1px solid rgba(139,92,246,0.45)',
              color: '#a78bfa',
            }}
            onMouseEnter={e => {
              if (!isAnalysing) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.36) 0%, rgba(124,58,237,0.26) 100%)';
                e.currentTarget.style.color = '#c4b5fd';
              }
            }}
            onMouseLeave={e => {
              if (!isAnalysing) {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.24) 0%, rgba(124,58,237,0.16) 100%)';
                e.currentTarget.style.color = '#a78bfa';
              }
            }}
          >
            {isAnalysing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(139,92,246,0.25)', borderTopColor: '#a78bfa' }} />
                Scanning address…
              </>
            ) : (
              <>
                <ShieldAlert size={14} />
                Start Investigation
                <ArrowRight size={13} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Recent investigations */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest mb-2 px-1"
            style={{ color: '#1e293b' }}>
            Recent Investigations
          </div>
          <div className="flex flex-col gap-1">
            {RECENT_INVESTIGATIONS.map(inv => (
              <button
                key={inv.address}
                onClick={() => handleAnalyse(inv.full)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg group transition-all duration-150"
                style={{
                  background: 'rgba(13,14,21,0.55)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(139,92,246,0.18)'}
                onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.04)'}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_DOT[inv.risk] }} />
                  <span className="text-[11px] font-mono group-hover:text-slate-300 transition-colors"
                    style={{ color: '#94a3b8' }}>{inv.address}</span>
                  <span className="text-[11px]" style={{ color: '#334155' }}>{inv.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-semibold risk-${inv.risk}`}>{inv.score}</span>
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform"
                    style={{ color: '#1e293b' }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
