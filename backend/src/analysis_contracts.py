from __future__ import annotations

import math
from copy import deepcopy
from typing import Any, Dict, Iterable, List, Optional


DEFAULT_RISK_LABEL = "unknown"


def safe_float(
    value: Any,
    default: float = 0.0,
    *,
    minimum: Optional[float] = None,
    maximum: Optional[float] = None,
) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError):
        result = float(default)

    if math.isnan(result) or math.isinf(result):
        result = float(default)

    if minimum is not None:
        result = max(minimum, result)
    if maximum is not None:
        result = min(maximum, result)
    return float(result)


def safe_int(value: Any, default: int = 0, *, minimum: Optional[int] = None, maximum: Optional[int] = None) -> int:
    try:
        result = int(value)
    except (TypeError, ValueError):
        result = int(default)

    if minimum is not None:
        result = max(minimum, result)
    if maximum is not None:
        result = min(maximum, result)
    return int(result)


def safe_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text or default


def clamp(value: Any, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return safe_float(value, minimum, minimum=minimum, maximum=maximum)


def dedupe_preserve_order(values: Iterable[str]) -> List[str]:
    seen = set()
    deduped: List[str] = []
    for value in values:
        item = safe_text(value)
        if not item or item in seen:
            continue
        seen.add(item)
        deduped.append(item)
    return deduped


def empty_feature_map(feature_columns: Iterable[str]) -> Dict[str, float]:
    return {safe_text(column): 0.0 for column in feature_columns if safe_text(column)}


def summarize_features(features: Dict[str, Any]) -> Dict[str, float]:
    return {
        "num_txs_as_sender": safe_float(features.get("num_txs_as_sender", 0.0)),
        "num_txs_as_receiver": safe_float(features.get("num_txs_as_receiver", 0.0)),
        "total_txs": safe_float(features.get("total_txs", 0.0)),
        "btc_transacted_total": safe_float(features.get("btc_transacted_total", 0.0)),
        "btc_sent_total": safe_float(features.get("btc_sent_total", 0.0)),
        "btc_received_total": safe_float(features.get("btc_received_total", 0.0)),
        "fees_total": safe_float(features.get("fees_total", 0.0)),
        "fees_as_share_total": safe_float(features.get("fees_as_share_total", 0.0)),
        "fees_as_share_max": safe_float(features.get("fees_as_share_max", 0.0)),
        "fees_mean": safe_float(features.get("fees_mean", 0.0)),
        "blocks_btwn_txs_total": safe_float(features.get("blocks_btwn_txs_total", 0.0)),
        "blocks_btwn_txs_mean": safe_float(features.get("blocks_btwn_txs_mean", 0.0)),
        "blocks_btwn_input_txs_mean": safe_float(features.get("blocks_btwn_input_txs_mean", 0.0)),
        "blocks_btwn_output_txs_mean": safe_float(features.get("blocks_btwn_output_txs_mean", 0.0)),
        "num_addr_transacted_multiple": safe_float(features.get("num_addr_transacted_multiple", 0.0)),
        "transacted_w_address_total": safe_float(features.get("transacted_w_address_total", 0.0)),
        "transacted_w_address_mean": safe_float(features.get("transacted_w_address_mean", 0.0)),
    }


def normalize_feature_importance(items: Optional[Iterable[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for index, item in enumerate(items or []):
        feature = safe_text((item or {}).get("feature"), f"feature_{index}")
        normalized.append(
            {
                "feature": feature,
                "value": (item or {}).get("value", 0.0),
                "importance": safe_float((item or {}).get("importance", 0.0), 0.0, minimum=0.0),
                "meaning": safe_text((item or {}).get("meaning"), feature),
            }
        )
    return normalized


def build_empty_graph(address: str, *, entity_type: str = "wallet", notes: Optional[Iterable[str]] = None) -> Dict[str, Any]:
    normalized_address = safe_text(address)
    center_node = {
        "id": normalized_address,
        "label": normalized_address,
        "type": safe_text(entity_type, "wallet"),
        "is_center": True,
        "depth": 0,
        "tx_count": 0,
        "volume_btc": 0.0,
        "risk_score": 0.0,
        "risk_label": DEFAULT_RISK_LABEL,
    }

    return {
        "center_wallet": normalized_address,
        "node_count": 1 if normalized_address else 0,
        "edge_count": 0,
        "path_count": 1 if normalized_address else 0,
        "nodes": [center_node] if normalized_address else [],
        "edges": [],
        "paths": [
            {
                "id": f"path:{normalized_address or 'empty'}:self",
                "node_ids": [normalized_address] if normalized_address else [],
                "segments": [],
                "depth": 0,
                "tx_count": 0,
                "btc_total": 0.0,
                "score": 0.0,
                "summary": "No transaction paths available.",
            }
        ] if normalized_address else [],
        "history_context": {
            "sampled_tx_count": 0,
            "lifetime_tx_count": 0,
            "sample_coverage": 0.0,
        },
        "analysis_notes": dedupe_preserve_order(notes or []),
    }


def normalize_graph(graph: Optional[Dict[str, Any]], address: str) -> Dict[str, Any]:
    base = build_empty_graph(address)
    graph = graph or {}

    base["center_wallet"] = safe_text(graph.get("center_wallet"), base["center_wallet"])
    base["history_context"] = {
        "sampled_tx_count": safe_int((graph.get("history_context") or {}).get("sampled_tx_count", 0), minimum=0),
        "lifetime_tx_count": safe_int((graph.get("history_context") or {}).get("lifetime_tx_count", 0), minimum=0),
        "sample_coverage": clamp((graph.get("history_context") or {}).get("sample_coverage", 0.0), 0.0, 1.0),
    }
    base["analysis_notes"] = dedupe_preserve_order(graph.get("analysis_notes") or base["analysis_notes"])

    nodes = graph.get("nodes") if isinstance(graph.get("nodes"), list) else []
    edges = graph.get("edges") if isinstance(graph.get("edges"), list) else []
    paths = graph.get("paths") if isinstance(graph.get("paths"), list) else []

    normalized_nodes: List[Dict[str, Any]] = []
    seen_node_ids = set()
    for raw in nodes:
        node_id = safe_text((raw or {}).get("id"))
        if not node_id or node_id in seen_node_ids:
            continue
        seen_node_ids.add(node_id)
        normalized_nodes.append(
            {
                "id": node_id,
                "label": safe_text((raw or {}).get("label"), node_id),
                "type": safe_text((raw or {}).get("type"), "wallet"),
                "is_center": bool((raw or {}).get("is_center", node_id == base["center_wallet"])),
                "depth": safe_int((raw or {}).get("depth", 0), minimum=0),
                "tx_count": safe_int((raw or {}).get("tx_count", 0), minimum=0),
                "volume_btc": safe_float((raw or {}).get("volume_btc", 0.0), minimum=0.0),
                "risk_score": clamp((raw or {}).get("risk_score", 0.0), 0.0, 1.0),
                "risk_label": safe_text((raw or {}).get("risk_label"), DEFAULT_RISK_LABEL),
            }
        )

    if not normalized_nodes and base["center_wallet"]:
        normalized_nodes = base["nodes"]

    normalized_edges: List[Dict[str, Any]] = []
    for index, raw in enumerate(edges):
        source = safe_text((raw or {}).get("source"), base["center_wallet"])
        target = safe_text((raw or {}).get("target"))
        if not source or not target:
            continue
        normalized_edges.append(
            {
                "id": safe_text((raw or {}).get("id"), f"edge:{index}:{source}:{target}"),
                "source": source,
                "target": target,
                "tx_count": safe_int((raw or {}).get("tx_count", 0), minimum=0),
                "btc_sent": safe_float((raw or {}).get("btc_sent", 0.0), minimum=0.0),
                "btc_received": safe_float((raw or {}).get("btc_received", 0.0), minimum=0.0),
                "btc_total": safe_float((raw or {}).get("btc_total", 0.0), minimum=0.0),
                "direction": safe_text((raw or {}).get("direction"), "mixed"),
                "top_transaction": (raw or {}).get("top_transaction") or None,
                "all_txids": dedupe_preserve_order((raw or {}).get("all_txids") or []),
                "risk_score": clamp((raw or {}).get("risk_score", 0.0), 0.0, 1.0),
                "risk_label": safe_text((raw or {}).get("risk_label"), DEFAULT_RISK_LABEL),
            }
        )

    normalized_paths: List[Dict[str, Any]] = []
    for index, raw in enumerate(paths):
        node_ids = dedupe_preserve_order((raw or {}).get("node_ids") or [])
        if not node_ids and base["center_wallet"]:
            node_ids = [base["center_wallet"]]
        segments = []
        for segment_index, segment in enumerate((raw or {}).get("segments") or []):
            segment_source = safe_text((segment or {}).get("source"))
            segment_target = safe_text((segment or {}).get("target"))
            if not segment_source or not segment_target:
                continue
            segments.append(
                {
                    "id": safe_text((segment or {}).get("id"), f"segment:{index}:{segment_index}:{segment_source}:{segment_target}"),
                    "source": segment_source,
                    "target": segment_target,
                    "btc_total": safe_float((segment or {}).get("btc_total", 0.0), minimum=0.0),
                    "tx_count": safe_int((segment or {}).get("tx_count", 0), minimum=0),
                    "risk_score": clamp((segment or {}).get("risk_score", 0.0), 0.0, 1.0),
                    "risk_label": safe_text((segment or {}).get("risk_label"), DEFAULT_RISK_LABEL),
                }
            )
        normalized_paths.append(
            {
                "id": safe_text((raw or {}).get("id"), f"path:{index}"),
                "node_ids": node_ids,
                "segments": segments,
                "depth": safe_int((raw or {}).get("depth", max(0, len(node_ids) - 1)), minimum=0),
                "tx_count": safe_int((raw or {}).get("tx_count", 0), minimum=0),
                "btc_total": safe_float((raw or {}).get("btc_total", 0.0), minimum=0.0),
                "score": safe_float((raw or {}).get("score", 0.0), minimum=0.0),
                "summary": safe_text((raw or {}).get("summary"), "Path information unavailable."),
            }
        )

    if not normalized_paths:
        normalized_paths = base["paths"]

    base["nodes"] = normalized_nodes
    base["edges"] = normalized_edges
    base["paths"] = normalized_paths
    base["node_count"] = len(normalized_nodes)
    base["edge_count"] = len(normalized_edges)
    base["path_count"] = len(normalized_paths)
    return base


def build_analysis_contract(
    address: str,
    *,
    risk_score: Any = 0.0,
    risk_label: str = DEFAULT_RISK_LABEL,
    prediction: int = 0,
    feature_source: str = "fallback",
    features: Optional[Dict[str, Any]] = None,
    feature_importance: Optional[Iterable[Dict[str, Any]]] = None,
    graph: Optional[Dict[str, Any]] = None,
    history_context: Optional[Dict[str, Any]] = None,
    analysis_notes: Optional[Iterable[str]] = None,
    watchlist_match: Optional[Dict[str, Any]] = None,
    ai_summary: str = "",
    warnings: Optional[Iterable[str]] = None,
    errors: Optional[Iterable[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    normalized_features = {safe_text(k): safe_float(v, 0.0) for k, v in (features or {}).items() if safe_text(k)}
    normalized_feature_importance = normalize_feature_importance(feature_importance)
    normalized_graph = normalize_graph(graph, address)
    normalized_history_context = {
        "sampled_tx_count": safe_int((history_context or {}).get("sampled_tx_count", normalized_graph["history_context"]["sampled_tx_count"]), minimum=0),
        "sampled_btc_total": safe_float((history_context or {}).get("sampled_btc_total", 0.0), minimum=0.0),
        "lifetime_tx_count": safe_int((history_context or {}).get("lifetime_tx_count", normalized_graph["history_context"]["lifetime_tx_count"]), minimum=0),
        "lifetime_btc_total": safe_float((history_context or {}).get("lifetime_btc_total", 0.0), minimum=0.0),
        "sample_coverage": clamp((history_context or {}).get("sample_coverage", normalized_graph["history_context"]["sample_coverage"]), 0.0, 1.0),
    }

    notes = dedupe_preserve_order(
        list(analysis_notes or [])
        + list(normalized_graph.get("analysis_notes") or [])
        + list(warnings or [])
    )

    payload = {
        "wallet_address": safe_text(address),
        "prediction": safe_int(prediction, 0),
        "risk_score": clamp(risk_score, 0.0, 1.0),
        "risk_label": safe_text(risk_label, DEFAULT_RISK_LABEL),
        "feature_source": safe_text(feature_source, "fallback"),
        "features": normalized_features,
        "feature_importance": normalized_feature_importance,
        "top_features": normalized_feature_importance,
        "stats": summarize_features(normalized_features),
        "history_context": normalized_history_context,
        "watchlist_match": watchlist_match,
        "analysis_notes": notes,
        "warnings": dedupe_preserve_order(warnings or []),
        "errors": deepcopy(list(errors or [])),
        "ai_summary": safe_text(ai_summary),
        "graph": normalized_graph,
    }

    payload.update(
        {
            "center_wallet": normalized_graph["center_wallet"],
            "node_count": normalized_graph["node_count"],
            "edge_count": normalized_graph["edge_count"],
            "path_count": normalized_graph["path_count"],
            "nodes": normalized_graph["nodes"],
            "edges": normalized_graph["edges"],
            "paths": normalized_graph["paths"],
        }
    )
    return payload

