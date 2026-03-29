from __future__ import annotations

from collections import defaultdict
import math
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

from src.address_reputation import lookup_address_reputation
from src.analysis_contracts import build_empty_graph, clamp, normalize_graph, safe_float, safe_int, safe_text
from src.btc_address import validate_bitcoin_address
from src.feature_builder import determine_fetch_plan, get_address_activity_snapshot

GRAPH_LEVEL_LIMITS = (6, 3, 2)


def _risk_label_from_score(score: float) -> str:
    if score >= 0.75:
        return "illicit"
    if score >= 0.45:
        return "review"
    return "licit"


def _tx_party_values(tx: Dict[str, Any]) -> Tuple[Dict[str, int], Dict[str, int]]:
    input_values: Dict[str, int] = defaultdict(int)
    output_values: Dict[str, int] = defaultdict(int)

    for vin in tx.get("vin", []):
        prevout = vin.get("prevout") or {}
        address = safe_text(prevout.get("scriptpubkey_address"))
        if address:
            input_values[address] += safe_int(prevout.get("value", 0), minimum=0)

    for vout in tx.get("vout", []):
        address = safe_text(vout.get("scriptpubkey_address"))
        if address:
            output_values[address] += safe_int(vout.get("value", 0), minimum=0)

    return dict(input_values), dict(output_values)


def _extract_flow_records(address: str, tx: Dict[str, Any]) -> List[Dict[str, Any]]:
    normalized_address = validate_bitcoin_address(address).normalized
    input_values, output_values = _tx_party_values(tx)
    total_inputs = sum(input_values.values())
    address_input_value = input_values.get(normalized_address, 0)
    external_input_values = {key: value for key, value in input_values.items() if key != normalized_address}
    external_output_values = {key: value for key, value in output_values.items() if key != normalized_address}
    total_received_by_address = output_values.get(normalized_address, 0)

    status = tx.get("status") or {}
    txid = safe_text(tx.get("txid"))
    timestamp = status.get("block_time")
    block_height = status.get("block_height")

    records: List[Dict[str, Any]] = []

    if address_input_value > 0 and external_output_values:
        share = (address_input_value / total_inputs) if total_inputs > 0 else 1.0
        for counterparty, value in external_output_values.items():
            btc_total = safe_float((value * share) / 1e8, minimum=0.0)
            if btc_total <= 0:
                continue
            records.append(
                {
                    "source": normalized_address,
                    "target": counterparty,
                    "direction": "outgoing",
                    "btc_total": btc_total,
                    "txid": txid,
                    "timestamp": timestamp,
                    "block_height": block_height,
                }
            )

    if total_received_by_address > 0 and external_input_values:
        total_external_input = sum(external_input_values.values())
        for counterparty, value in external_input_values.items():
            if total_external_input <= 0:
                btc_total = safe_float(total_received_by_address / max(1, len(external_input_values)) / 1e8, minimum=0.0)
            else:
                btc_total = safe_float((total_received_by_address * (value / total_external_input)) / 1e8, minimum=0.0)
            if btc_total <= 0:
                continue
            records.append(
                {
                    "source": counterparty,
                    "target": normalized_address,
                    "direction": "incoming",
                    "btc_total": btc_total,
                    "txid": txid,
                    "timestamp": timestamp,
                    "block_height": block_height,
                }
            )

    return records


def _aggregate_relationships(address: str, txs: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    normalized_address = validate_bitcoin_address(address).normalized
    relationships: Dict[str, Dict[str, Any]] = {}

    for tx in txs:
        per_counterparty: Dict[str, Dict[str, Any]] = defaultdict(lambda: {"btc_sent": 0.0, "btc_received": 0.0, "transactions": []})
        for record in _extract_flow_records(normalized_address, tx):
            if record["source"] == normalized_address:
                counterparty = record["target"]
                per_counterparty[counterparty]["btc_sent"] += record["btc_total"]
            else:
                counterparty = record["source"]
                per_counterparty[counterparty]["btc_received"] += record["btc_total"]
            per_counterparty[counterparty]["transactions"].append(record)

        for counterparty, values in per_counterparty.items():
            relation = relationships.setdefault(
                counterparty,
                {
                    "counterparty": counterparty,
                    "btc_sent": 0.0,
                    "btc_received": 0.0,
                    "tx_count": 0,
                    "transactions": [],
                },
            )
            relation["btc_sent"] += safe_float(values["btc_sent"], minimum=0.0)
            relation["btc_received"] += safe_float(values["btc_received"], minimum=0.0)
            relation["tx_count"] += 1
            relation["transactions"].extend(values["transactions"])

    for counterparty, relation in relationships.items():
        relation["counterparty"] = counterparty
        relation["btc_total"] = safe_float(relation["btc_sent"] + relation["btc_received"], minimum=0.0)
    return relationships


def _segment_priority(segment: Dict[str, Any]) -> float:
    risk_score = safe_float(segment.get("risk_score", 0.0), minimum=0.0, maximum=1.0)
    btc_total = safe_float(segment.get("btc_total", 0.0), minimum=0.0)
    tx_count = safe_float(segment.get("tx_count", 0), minimum=0.0)
    return (risk_score * 3.0) + math.log10(btc_total + 1.0) + min(1.5, tx_count / 4.0)


def _relationship_summary(
    address: str,
    *,
    max_pages: Optional[int] = None,
    max_txs: Optional[int] = None,
) -> Tuple[Dict[str, int], Dict[str, Dict[str, Any]], List[str]]:
    snapshot = get_address_activity_snapshot(address, max_pages=max_pages, max_txs=max_txs)
    relationships = _aggregate_relationships(snapshot.address, snapshot.txs)
    return snapshot.summary, relationships, list(snapshot.warnings)


def _node_risk_score(
    node_id: str,
    *,
    volume_btc: float,
    tx_count: int,
    depth: int,
    center_address: str,
    wallet_context: Optional[Dict[str, Any]] = None,
) -> float:
    if node_id == center_address and wallet_context:
        return clamp(wallet_context.get("risk_score", 0.0), 0.0, 1.0)

    watchlist_match = lookup_address_reputation(node_id)
    if watchlist_match:
        return clamp(watchlist_match.get("risk_score", 0.95), 0.0, 1.0)

    score = 0.05
    score += min(0.25, math.log10(volume_btc + 1.0) / 10.0)
    score += min(0.20, tx_count / 20.0)
    score += min(0.12, max(0, 3 - depth) * 0.03)
    return clamp(score, 0.0, 0.85)


def _build_segment(source: str, target: str, relation: Dict[str, Any], *, center_address: str) -> Dict[str, Any]:
    if source == center_address:
        btc_total = safe_float(relation.get("btc_sent", 0.0), minimum=0.0)
    elif target == center_address:
        btc_total = safe_float(relation.get("btc_received", 0.0), minimum=0.0)
    else:
        btc_total = safe_float(relation.get("btc_total", 0.0), minimum=0.0)

    risk_score = clamp(min(0.99, 0.04 + math.log10(btc_total + 1.0) / 8.0 + (safe_int(relation.get("tx_count", 0), minimum=0) / 25.0)), 0.0, 1.0)
    return {
        "id": f"segment:{source}:{target}",
        "source": source,
        "target": target,
        "btc_total": btc_total,
        "tx_count": safe_int(relation.get("tx_count", 0), minimum=0),
        "risk_score": risk_score,
        "risk_label": _risk_label_from_score(risk_score),
    }


def _expand_forward(
    address: str,
    *,
    center_address: str,
    depth: int,
    visited: Set[str],
    level_limits: Tuple[int, ...],
) -> Tuple[List[Dict[str, Any]], List[str]]:
    if depth <= 0:
        return [{"node_ids": [address], "segments": []}], []

    summary, relationships, warnings = _relationship_summary(address)
    outgoing_segments = []
    for counterparty, relation in relationships.items():
        if counterparty in visited:
            continue
        btc_sent = safe_float(relation.get("btc_sent", 0.0), minimum=0.0)
        if btc_sent <= 0:
            continue
        segment = _build_segment(address, counterparty, relation, center_address=center_address)
        segment["priority"] = _segment_priority(segment)
        outgoing_segments.append(segment)

    outgoing_segments.sort(key=lambda item: item["priority"], reverse=True)
    outgoing_segments = outgoing_segments[: level_limits[min(len(level_limits) - 1, 3 - depth)]]

    if not outgoing_segments:
        return [{"node_ids": [address], "segments": []}], warnings

    paths: List[Dict[str, Any]] = []
    for segment in outgoing_segments:
        child_paths, child_warnings = _expand_forward(
            segment["target"],
            center_address=center_address,
            depth=depth - 1,
            visited=visited | {segment["target"]},
            level_limits=level_limits,
        )
        warnings.extend(child_warnings)
        for child_path in child_paths:
            if child_path["node_ids"] == [segment["target"]]:
                paths.append({"node_ids": [address, segment["target"]], "segments": [segment]})
            else:
                paths.append({"node_ids": [address, *child_path["node_ids"]], "segments": [segment, *child_path["segments"]]})

    return paths, warnings


def _expand_backward(
    address: str,
    *,
    center_address: str,
    depth: int,
    visited: Set[str],
    level_limits: Tuple[int, ...],
) -> Tuple[List[Dict[str, Any]], List[str]]:
    if depth <= 0:
        return [{"node_ids": [address], "segments": []}], []

    summary, relationships, warnings = _relationship_summary(address)
    incoming_segments = []
    for counterparty, relation in relationships.items():
        if counterparty in visited:
            continue
        btc_received = safe_float(relation.get("btc_received", 0.0), minimum=0.0)
        if btc_received <= 0:
            continue
        segment = _build_segment(counterparty, address, relation, center_address=center_address)
        segment["priority"] = _segment_priority(segment)
        incoming_segments.append(segment)

    incoming_segments.sort(key=lambda item: item["priority"], reverse=True)
    incoming_segments = incoming_segments[: level_limits[min(len(level_limits) - 1, 3 - depth)]]

    if not incoming_segments:
        return [{"node_ids": [address], "segments": []}], warnings

    paths: List[Dict[str, Any]] = []
    for segment in incoming_segments:
        parent_paths, parent_warnings = _expand_backward(
            segment["source"],
            center_address=center_address,
            depth=depth - 1,
            visited=visited | {segment["source"]},
            level_limits=level_limits,
        )
        warnings.extend(parent_warnings)
        for parent_path in parent_paths:
            if parent_path["node_ids"] == [segment["source"]]:
                paths.append({"node_ids": [segment["source"], address], "segments": [segment]})
            else:
                paths.append({"node_ids": [*parent_path["node_ids"], address], "segments": [*parent_path["segments"], segment]})

    return paths, warnings


def _path_score(path: Dict[str, Any], node_map: Dict[str, Dict[str, Any]]) -> float:
    segments = path.get("segments") or []
    node_ids = path.get("node_ids") or []
    total_volume = sum(safe_float(segment.get("btc_total", 0.0), minimum=0.0) for segment in segments)
    segment_risk = sum(safe_float(segment.get("risk_score", 0.0), minimum=0.0, maximum=1.0) for segment in segments)
    node_risk = sum(safe_float((node_map.get(node_id) or {}).get("risk_score", 0.0), minimum=0.0, maximum=1.0) for node_id in node_ids)
    score = (segment_risk * 40.0) + (node_risk * 18.0) + (math.log10(total_volume + 1.0) * 12.0) + (len(segments) * 4.5)
    return safe_float(score, 0.0, minimum=0.0)


def _path_summary(path: Dict[str, Any]) -> str:
    node_ids = path.get("node_ids") or []
    segments = path.get("segments") or []
    if len(node_ids) <= 1:
        return "No multi-hop path could be established for this wallet."
    total_volume = sum(safe_float(segment.get("btc_total", 0.0), minimum=0.0) for segment in segments)
    return f"{len(segments)} hop path covering {len(node_ids)} nodes and {total_volume:.6f} BTC."


def build_wallet_graph(
    address: str,
    *,
    wallet_context: Optional[Dict[str, Any]] = None,
    max_depth: int = 3,
    level_limits: Tuple[int, ...] = GRAPH_LEVEL_LIMITS,
) -> Dict[str, Any]:
    normalized_address = validate_bitcoin_address(address).normalized
    watchlist_match = lookup_address_reputation(normalized_address)
    notes: List[str] = []

    try:
        summary, relationships, warnings = _relationship_summary(normalized_address)
        notes.extend(warnings)
    except Exception as exc:
        notes.append(f"Live graph data fallback used: {exc}")
        return normalize_graph(
            build_empty_graph(
                normalized_address,
                entity_type=safe_text((watchlist_match or {}).get("entity_type"), "wallet"),
                notes=notes or ["Live graph data is unavailable."],
            ),
            normalized_address,
        )

    center_risk_score = clamp((wallet_context or {}).get("risk_score", (watchlist_match or {}).get("risk_score", 0.0)), 0.0, 1.0)
    node_map: Dict[str, Dict[str, Any]] = {
        normalized_address: {
            "id": normalized_address,
            "label": normalized_address,
            "type": safe_text((watchlist_match or {}).get("entity_type"), "wallet"),
            "is_center": True,
            "depth": 0,
            "tx_count": safe_int(summary.get("tx_count", 0), minimum=0),
            "volume_btc": safe_float(
                (summary.get("funded_txo_sum", 0) + summary.get("spent_txo_sum", 0)) / 1e8,
                minimum=0.0,
            ),
            "risk_score": center_risk_score,
            "risk_label": safe_text((wallet_context or {}).get("risk_label"), _risk_label_from_score(center_risk_score)),
        }
    }

    star_edges: List[Dict[str, Any]] = []
    ranked_counterparties = sorted(
        relationships.values(),
        key=lambda relation: (safe_float(relation.get("btc_total", 0.0), minimum=0.0), safe_int(relation.get("tx_count", 0), minimum=0)),
        reverse=True,
    )

    for relation in ranked_counterparties[: level_limits[0]]:
        counterparty = relation["counterparty"]
        watchlist_counterparty = lookup_address_reputation(counterparty)
        node_risk = _node_risk_score(
            counterparty,
            volume_btc=safe_float(relation.get("btc_total", 0.0), minimum=0.0),
            tx_count=safe_int(relation.get("tx_count", 0), minimum=0),
            depth=1,
            center_address=normalized_address,
            wallet_context=wallet_context,
        )
        node_map[counterparty] = {
            "id": counterparty,
            "label": counterparty,
            "type": safe_text((watchlist_counterparty or {}).get("entity_type"), "wallet"),
            "is_center": False,
            "depth": 1,
            "tx_count": safe_int(relation.get("tx_count", 0), minimum=0),
            "volume_btc": safe_float(relation.get("btc_total", 0.0), minimum=0.0),
            "risk_score": node_risk,
            "risk_label": safe_text((watchlist_counterparty or {}).get("risk_label"), _risk_label_from_score(node_risk)),
        }

        outgoing_txids = [safe_text(item.get("txid")) for item in relation.get("transactions", []) if item.get("direction") == "outgoing"]
        incoming_txids = [safe_text(item.get("txid")) for item in relation.get("transactions", []) if item.get("direction") == "incoming"]
        direction = "mixed"
        if safe_float(relation.get("btc_sent", 0.0), minimum=0.0) > 0 and safe_float(relation.get("btc_received", 0.0), minimum=0.0) == 0:
            direction = "outgoing"
        elif safe_float(relation.get("btc_received", 0.0), minimum=0.0) > 0 and safe_float(relation.get("btc_sent", 0.0), minimum=0.0) == 0:
            direction = "incoming"

        risk_score = clamp(node_risk * 0.7 + min(0.25, math.log10(safe_float(relation.get("btc_total", 0.0), minimum=0.0) + 1.0) / 10.0), 0.0, 1.0)
        star_edges.append(
            {
                "id": f"edge:{normalized_address}:{counterparty}",
                "source": normalized_address,
                "target": counterparty,
                "tx_count": safe_int(relation.get("tx_count", 0), minimum=0),
                "btc_sent": safe_float(relation.get("btc_sent", 0.0), minimum=0.0),
                "btc_received": safe_float(relation.get("btc_received", 0.0), minimum=0.0),
                "btc_total": safe_float(relation.get("btc_total", 0.0), minimum=0.0),
                "direction": direction,
                "top_transaction": relation.get("transactions", [None])[0] if relation.get("transactions") else None,
                "all_txids": sorted({*incoming_txids, *outgoing_txids}),
                "risk_score": risk_score,
                "risk_label": _risk_label_from_score(risk_score),
            }
        )

    outgoing_paths, outgoing_warnings = _expand_forward(
        normalized_address,
        center_address=normalized_address,
        depth=max(1, min(max_depth - 1, 2)),
        visited={normalized_address},
        level_limits=level_limits,
    )
    incoming_paths, incoming_warnings = _expand_backward(
        normalized_address,
        center_address=normalized_address,
        depth=max(1, min(max_depth - 1, 2)),
        visited={normalized_address},
        level_limits=level_limits,
    )
    notes.extend(outgoing_warnings)
    notes.extend(incoming_warnings)

    candidate_paths: List[Dict[str, Any]] = []
    for path in outgoing_paths + incoming_paths:
        if len(path.get("node_ids") or []) > 1:
            candidate_paths.append(path)

    incoming_real = [path for path in incoming_paths if len(path.get("node_ids") or []) > 1]
    outgoing_real = [path for path in outgoing_paths if len(path.get("node_ids") or []) > 1]
    for incoming_path in incoming_real[: level_limits[1]]:
        for outgoing_path in outgoing_real[: level_limits[1]]:
            if incoming_path["node_ids"][0] == outgoing_path["node_ids"][-1]:
                continue
            candidate_paths.append(
                {
                    "node_ids": [*incoming_path["node_ids"], *outgoing_path["node_ids"][1:]],
                    "segments": [*incoming_path["segments"], *outgoing_path["segments"]],
                }
            )

    if not candidate_paths:
        candidate_paths = build_empty_graph(normalized_address)["paths"]

    for path in candidate_paths:
        for depth, node_id in enumerate(path.get("node_ids") or []):
            if node_id not in node_map:
                watchlist_node = lookup_address_reputation(node_id)
                derived_volume = sum(
                    safe_float(segment.get("btc_total", 0.0), minimum=0.0)
                    for segment in path.get("segments") or []
                    if segment.get("source") == node_id or segment.get("target") == node_id
                )
                derived_tx_count = sum(
                    safe_int(segment.get("tx_count", 0), minimum=0)
                    for segment in path.get("segments") or []
                    if segment.get("source") == node_id or segment.get("target") == node_id
                )
                node_risk = _node_risk_score(
                    node_id,
                    volume_btc=derived_volume,
                    tx_count=derived_tx_count,
                    depth=depth,
                    center_address=normalized_address,
                    wallet_context=wallet_context,
                )
                node_map[node_id] = {
                    "id": node_id,
                    "label": node_id,
                    "type": safe_text((watchlist_node or {}).get("entity_type"), "wallet"),
                    "is_center": node_id == normalized_address,
                    "depth": depth,
                    "tx_count": derived_tx_count,
                    "volume_btc": derived_volume,
                    "risk_score": node_risk,
                    "risk_label": safe_text((watchlist_node or {}).get("risk_label"), _risk_label_from_score(node_risk)),
                }
            else:
                node_map[node_id]["depth"] = min(node_map[node_id]["depth"], depth)

    normalized_paths: List[Dict[str, Any]] = []
    for index, path in enumerate(candidate_paths):
        score = _path_score(path, node_map)
        normalized_paths.append(
            {
                "id": f"path:{index}:{normalized_address}",
                "node_ids": path.get("node_ids") or [normalized_address],
                "segments": path.get("segments") or [],
                "depth": max(0, len(path.get("segments") or [])),
                "tx_count": sum(safe_int(segment.get("tx_count", 0), minimum=0) for segment in path.get("segments") or []),
                "btc_total": sum(safe_float(segment.get("btc_total", 0.0), minimum=0.0) for segment in path.get("segments") or []),
                "score": score,
                "summary": _path_summary(path),
            }
        )

    normalized_paths.sort(key=lambda item: item["score"], reverse=True)
    normalized_paths = normalized_paths[:10]

    lifetime_tx_count = safe_int(summary.get("tx_count", 0), minimum=0)
    sampled_tx_count = min(lifetime_tx_count, level_limits[0] * max(1, level_limits[1]))
    sample_coverage = 1.0 if lifetime_tx_count == 0 else min(1.0, sampled_tx_count / lifetime_tx_count)

    if lifetime_tx_count == 0:
        notes.append("No on-chain activity was found for this wallet.")
    elif lifetime_tx_count > sampled_tx_count and sample_coverage < 0.9:
        notes.append(
            f"Graph expansion sampled representative neighborhoods from approximately {sampled_tx_count} of {lifetime_tx_count} wallet transactions."
        )
    if watchlist_match:
        notes.append(safe_text(watchlist_match.get("reason"), "Matched local analyst watchlist."))

    graph = {
        "center_wallet": normalized_address,
        "node_count": len(node_map),
        "edge_count": len(star_edges),
        "path_count": len(normalized_paths),
        "nodes": list(node_map.values()),
        "edges": star_edges,
        "paths": normalized_paths,
        "history_context": {
            "sampled_tx_count": sampled_tx_count,
            "lifetime_tx_count": lifetime_tx_count,
            "sample_coverage": sample_coverage,
        },
        "analysis_notes": list(dict.fromkeys([note for note in notes if safe_text(note)])),
    }
    return normalize_graph(graph, normalized_address)


if __name__ == "__main__":
    wallet_address = input("Enter BTC address: ").strip()
    print(build_wallet_graph(wallet_address))
