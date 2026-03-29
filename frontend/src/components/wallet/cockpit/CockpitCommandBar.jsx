import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCheck, Search, X, ArrowLeft } from 'lucide-react';

const layoutTransition = { type: 'spring', stiffness: 150, damping: 22, mass: 0.8 };

export default function CockpitCommandBar({
  address,
  onBack,
  onAnalyse,
  onClear,
  flaggedReason,
  flaggedSummary,
  centered = false,
}) {
  const [copied, setCopied] = useState(false);
  const [draftAddress, setDraftAddress] = useState(address ?? '');

  useEffect(() => {
    setDraftAddress(address ?? '');
  }, [address]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address ?? '');
    } catch {
      // no-op
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const trimmedDraft = draftAddress.trim();
  const hasActiveAddress = Boolean(address);

  const handleSubmit = (event) => {
    event?.preventDefault();
    if (!trimmedDraft) return;
    onAnalyse?.(trimmedDraft);
  };

  const handleClear = () => {
    setDraftAddress('');
    setCopied(false);
    onClear?.();
  };

  if (centered) {
    return (
      <motion.section
        layout
        transition={layoutTransition}
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-4 text-center"
      >
        <motion.form
          layoutId="wallet-input-shell"
          onSubmit={handleSubmit}
          transition={layoutTransition}
          className="flex w-full max-w-3xl flex-col gap-3 rounded-[30px] border border-white/10 bg-[#0e1018]/86 p-3 shadow-[0_32px_120px_rgba(0,0,0,0.36)] backdrop-blur-[10px] sm:flex-row sm:items-center"
        >
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={draftAddress}
              onChange={(event) => setDraftAddress(event.target.value)}
              placeholder="Paste a Bitcoin address"
              className="w-full rounded-[22px] bg-[#0b0d14] py-5 pl-12 pr-5 text-[16px] text-slate-100 outline-none transition-colors placeholder:text-slate-600"
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            {trimmedDraft && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-[12px] font-medium text-slate-400 transition-colors hover:text-white"
              >
                <X size={12} />
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={!trimmedDraft}
              className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-5 py-3 text-[12px] font-medium text-slate-100 transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Search size={12} />
              Analyse
            </button>
          </div>
        </motion.form>

        <motion.p
          layout
          transition={layoutTransition}
          className="mt-4 text-[14px] text-slate-400"
        >
          Paste a Bitcoin address to start tracing funds.
        </motion.p>
      </motion.section>
    );
  }

  return (
    <motion.header
      layout
      transition={layoutTransition}
      className="flex flex-col gap-3 px-2 py-2 sm:px-3"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white/[0.03] hover:text-slate-200"
            >
              <ArrowLeft size={13} />
              Home
            </button>
          </div>

          <motion.form
            layoutId="wallet-input-shell"
            onSubmit={handleSubmit}
            transition={layoutTransition}
            className="flex w-full flex-col gap-2 rounded-[24px] border border-white/8 bg-[#0f1320]/92 p-2 shadow-[0_16px_48px_rgba(0,0,0,0.20)] xl:max-w-[1120px] xl:flex-row xl:items-center"
          >
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={draftAddress}
                onChange={(event) => setDraftAddress(event.target.value)}
                placeholder="Paste a Bitcoin address"
                className="w-full rounded-[18px] bg-[#0b0d14] py-3 pl-10 pr-4 text-[13px] text-slate-100 outline-none placeholder:text-slate-600"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={!trimmedDraft}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2.5 text-[12px] font-medium text-slate-100 transition-colors hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Search size={12} />
                Analyse
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={!trimmedDraft && !hasActiveAddress}
                className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3.5 py-2.5 text-[12px] font-medium text-slate-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={12} />
                Clear
              </button>

              {hasActiveAddress && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-white/[0.03] px-3.5 py-2.5 text-[12px] font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </motion.form>
        </div>

        {hasActiveAddress && (flaggedReason || flaggedSummary) && (
          <motion.div
            layout
            transition={layoutTransition}
            className="min-w-0 pl-0 xl:pl-[4.5rem]"
          >
            <div className="flex flex-wrap items-center gap-2">
              {flaggedReason && (
                <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-slate-400">
                  Flagged pattern
                </span>
              )}
              <div className="text-[14px] font-medium text-slate-200">
                {flaggedReason ?? 'Wallet investigation'}
              </div>
            </div>

            {flaggedSummary && (
              <p className="mt-1 text-[13px] leading-5 text-slate-400">
                {flaggedSummary}
              </p>
            )}

            <p className="mt-1.5 break-all font-mono text-[12px] leading-5 text-slate-500">
              {address}
            </p>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
