import { RISK_COLORS } from '../../../constants';

export default function CockpitMetrics({
  riskScore,
  riskLabel,
  riskLevel,
  primaryExplanation,
  alertCount,
  totalTxs,
  counterparties,
  totalVolume,
}) {
  const score = Number.isFinite(Number(riskScore)) ? Number(riskScore) : null;
  const color = RISK_COLORS[riskLevel] ?? RISK_COLORS.unknown;

  const statParts = [
    totalTxs != null ? `${totalTxs} txs` : null,
    counterparties != null ? `${counterparties} counterparties` : null,
    totalVolume ?? null,
    alertCount != null ? `${alertCount} ${alertCount === 1 ? 'alert' : 'alerts'}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-[24px] border border-white/5 bg-[#0d0f17] px-6 py-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex-shrink-0">
          <div
            className="text-[68px] font-semibold leading-none tracking-[-0.04em]"
            style={{ color }}
          >
            {score ?? '—'}
          </div>
          <div
            className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color }}
          >
            {riskLabel ?? 'Pending'}
          </div>
        </div>

        {primaryExplanation && (
          <div className="flex min-w-0 flex-1 flex-col justify-center self-stretch border-l border-white/5 pl-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-600">
              Primary signal
            </div>
            <p className="mt-2 max-w-2xl text-[15px] leading-6 text-slate-200">
              {primaryExplanation}
            </p>
          </div>
        )}
      </div>

      {statParts.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-1 text-[13px] text-slate-400">
          {statParts.map((part, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && <span className="mx-2 text-slate-700">·</span>}
              {part}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
