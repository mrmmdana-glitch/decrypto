from pathlib import Path
import os
from typing import Dict, Any, List

import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

REQUEST_TIMEOUT = 8


def _format_top_features(top_features: List[Dict[str, Any]]) -> str:
    if not top_features:
        return "No feature details available."

    lines = []
    for item in top_features:
        feature = item.get("feature", "unknown_feature")
        value = item.get("value", "unknown")
        meaning = item.get("meaning", feature)
        lines.append(f"- {feature}: {meaning}. Observed value: {value}")
    return "\n".join(lines)


def build_wallet_summary_prompt(data: Dict[str, Any]) -> str:
    top_features_text = _format_top_features(data.get("top_features", []))

    return f"""
You are an AML analyst assistant.

Write a complete explanation in 4 to 6 sentences.
Use only the supplied structured inputs.
Do not invent evidence.
Do not repeat raw feature names without explaining what they mean in transaction behaviour terms.
Translate the feature signals into real-world wallet activity patterns.
If the score is low, explain why the wallet appears low risk in practical terms.
Avoid sounding robotic or overly technical.
Frame the result as an analyst interpretation, not proof of wrongdoing.
End with one short analyst recommendation.
Return plain text only. No JSON. No markdown. No bullet points.

Wallet address: {data.get("wallet_address")}
Risk score: {data.get("risk_score")}
Risk label: {data.get("risk_label")}
Feature source: {data.get("feature_source")}

Top contributing features:
{top_features_text}
""".strip()


def build_transaction_summary_prompt(data: Dict[str, Any]) -> str:
    heuristics = data.get("heuristics", {})
    reasons = data.get("reasons", [])
    tx_summary = data.get("transaction_summary", {})

    return f"""
You are an AML analyst assistant.

Write a complete explanation in 4 to 6 sentences.
Use only the supplied structured inputs.
Do not invent evidence.
Explain the transaction score in practical transaction-monitoring terms.
State clearly whether the score is mainly driven by transaction size, fee behaviour, or structural complexity.
Frame the result as a risk assessment, not proof of wrongdoing.
End with one short analyst recommendation.
Return plain text only. No JSON. No markdown. No bullet points.

Transaction ID: {data.get("txid")}
Transaction risk score: {data.get("transaction_risk")}
Risk label: {data.get("risk_label")}

Heuristics:
- amount_anomaly: {heuristics.get("amount_anomaly")}
- fee_anomaly: {heuristics.get("fee_anomaly")}
- structural_complexity: {heuristics.get("structural_complexity")}

Reasons:
{reasons}

Transaction summary:
- amount_btc: {tx_summary.get("amount_btc")}
- fee_btc: {tx_summary.get("fee_btc")}
- num_inputs: {tx_summary.get("num_inputs")}
- num_outputs: {tx_summary.get("num_outputs")}
- confirmed: {tx_summary.get("confirmed")}
- block_height: {tx_summary.get("block_height")}
""".strip()


def fallback_wallet_summary(data: Dict[str, Any]) -> str:
    score = data.get("risk_score")
    label = data.get("risk_label")
    features = data.get("top_features", [])

    if not features:
        return (
            f"This wallet received a {label} assessment with a risk score of {score}. "
            f"Based on the available signals, the wallet does not currently appear to show strong indicators of elevated risk. "
            f"This should still be treated as a model-based screening result rather than proof of benign or illicit behaviour. "
            f"An analyst should review the wallet’s counterparties and transaction history before drawing any conclusion."
        )

    feature_sentences = []
    for f in features[:3]:
        meaning = f.get("meaning", f.get("feature", "unknown signal"))
        value = f.get("value")
        feature_sentences.append(f"{meaning} (observed value: {value})")

    joined = "; ".join(feature_sentences)

    return (
        f"This wallet received a {label} assessment with a risk score of {score}. "
        f"The model’s view appears to be influenced mainly by signals related to {joined}. "
        f"In practical terms, these features describe how active the wallet is, how broadly it interacts with other addresses, and how its transaction behaviour is distributed over time. "
        f"Based on the available evidence, this does not by itself indicate illicit activity, but it provides a structured risk estimate that should be interpreted alongside transaction context and counterparty exposure."
    )


def fallback_transaction_summary(data: Dict[str, Any]) -> str:
    score = data.get("transaction_risk")
    label = data.get("risk_label")
    heuristics = data.get("heuristics", {})

    return (
        f"This transaction received a {label} assessment with a risk score of {score}. "
        f"The result appears to be driven mainly by transaction size ({heuristics.get('amount_anomaly')}), "
        f"fee behaviour ({heuristics.get('fee_anomaly')}), and structural complexity ({heuristics.get('structural_complexity')}). "
        f"In practical terms, the score reflects how large, unusual, or structurally complex the transfer appears based on the available transaction data. "
        f"An analyst should review the transaction context before drawing any conclusion."
    )


def call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        return ""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

    headers = {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
    }

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 500
        }
    }

    response = requests.post(url, headers=headers, json=payload, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    data = response.json()

    candidates = data.get("candidates", [])
    if not candidates:
        return ""

    parts = candidates[0].get("content", {}).get("parts", [])
    text_parts = [p.get("text", "") for p in parts if "text" in p]
    raw_text = "\n".join(t for t in text_parts if t).strip()

    return raw_text


def summarize_wallet(data: Dict[str, Any]) -> str:
    try:
        summary = call_gemini(build_wallet_summary_prompt(data))
        if summary and len(summary.strip()) >= 80:
            return summary.strip()
    except Exception:
        pass
    return fallback_wallet_summary(data)


def summarize_transaction(data: Dict[str, Any]) -> str:
    try:
        summary = call_gemini(build_transaction_summary_prompt(data))
        if summary and len(summary.strip()) >= 80:
            return summary.strip()
    except Exception:
        pass
    return fallback_transaction_summary(data)
