from __future__ import annotations

from typing import Any, Dict, List

from src.feature_builder import _request_json
from src.llm_summarizer import summarize_transaction


def get_transaction(txid: str) -> Dict[str, Any]:
    return _request_json(f"/tx/{txid}")


def _normalize_amount(amount_btc: float) -> float:
    if amount_btc <= 0:
        return 0.0
    return min(amount_btc / 1.0, 1.0)


def _normalize_fee_ratio(fee_btc: float, amount_btc: float) -> float:
    if amount_btc <= 0:
        return 0.0
    ratio = fee_btc / amount_btc
    return min(ratio / 0.01, 1.0)


def _normalize_complexity(tx: Dict[str, Any]) -> float:
    num_inputs = len(tx.get("vin", []))
    num_outputs = len(tx.get("vout", []))
    complexity = num_inputs + num_outputs
    return min(complexity / 10.0, 1.0)


def score_transaction(txid: str) -> Dict[str, Any]:
    tx = get_transaction(txid)

    total_output_sats = sum(int(vout.get("value", 0)) for vout in tx.get("vout", []))
    fee_sats = int(tx.get("fee", 0))

    amount_btc = total_output_sats / 1e8
    fee_btc = fee_sats / 1e8

    amount_score = _normalize_amount(amount_btc)
    fee_score = _normalize_fee_ratio(fee_btc, amount_btc)
    complexity_score = _normalize_complexity(tx)

    transaction_risk = (
        0.50 * amount_score +
        0.25 * fee_score +
        0.25 * complexity_score
    )
    transaction_risk = max(0.0, min(float(transaction_risk), 1.0))

    reasons: List[str] = []
    if amount_score > 0.7:
        reasons.append("Large transaction amount")
    if fee_score > 0.7:
        reasons.append("Unusual fee ratio")
    if complexity_score > 0.7:
        reasons.append("Complex transaction structure")
    if not reasons:
        reasons.append("No strong anomaly detected")

    result = {
        "txid": txid,
        "transaction_risk": round(transaction_risk, 6),
        "risk_label": (
            "high_risk" if transaction_risk >= 0.75
            else "medium_risk" if transaction_risk >= 0.4
            else "low_risk"
        ),
        "heuristics": {
            "amount_anomaly": round(amount_score, 6),
            "fee_anomaly": round(fee_score, 6),
            "structural_complexity": round(complexity_score, 6),
        },
        "transaction_summary": {
            "amount_btc": round(amount_btc, 8),
            "fee_btc": round(fee_btc, 8),
            "num_inputs": len(tx.get("vin", [])),
            "num_outputs": len(tx.get("vout", [])),
            "confirmed": bool(tx.get("status", {}).get("confirmed")),
            "block_height": tx.get("status", {}).get("block_height"),
        },
        "reasons": reasons,
    }

    result["ai_summary"] = summarize_transaction(result)
    return result


if __name__ == "__main__":
    txid = input("Enter transaction txid: ").strip()
    print(score_transaction(txid))