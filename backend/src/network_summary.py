from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import time
from typing import Any, Dict, List, Set

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

FEATURES_PATH = DATA_DIR / "wallets_features.csv"
CLASSES_PATH = DATA_DIR / "wallets_classes.csv"
EDGE_PATH = DATA_DIR / "AddrAddr_edgelist.csv"

RAW_FEATURE_COLUMNS = [
    "address",
    "total_txs",
    "btc_transacted_total",
    "transacted_w_address_total",
    "fees_as_share_max",
    "num_addr_transacted_multiple",
]

CLASS_LABELS = {1: "illicit", 2: "licit"}


def _clean_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = df.columns.str.strip().str.replace(" ", "_")
    return df


def _required_files_present() -> bool:
    return FEATURES_PATH.exists() and CLASSES_PATH.exists() and EDGE_PATH.exists()


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _class_label(value: Any) -> str:
    try:
        return CLASS_LABELS.get(int(value), "unknown")
    except (TypeError, ValueError):
        return "unknown"


def _risk_score_for_row(row: pd.Series) -> float:
    label = row["class_label"]
    base = 0.92 if label == "illicit" else 0.18 if label == "licit" else 0.45

    tx_signal = _clamp(float(row.get("total_txs", 0.0)) / 150.0, 0.0, 1.0)
    volume_signal = _clamp(float(row.get("btc_transacted_total", 0.0)) / 25.0, 0.0, 1.0)
    exposure_signal = _clamp(float(row.get("transacted_w_address_total", 0.0)) / 20.0, 0.0, 1.0)
    repeat_signal = _clamp(float(row.get("num_addr_transacted_multiple", 0.0)) / 8.0, 0.0, 1.0)
    fee_signal = _clamp(float(row.get("fees_as_share_max", 0.0)) / 0.01, 0.0, 1.0)

    if label == "illicit":
        score = base + 0.03 * tx_signal + 0.02 * volume_signal + 0.03 * repeat_signal
    elif label == "unknown":
        score = base + 0.12 * exposure_signal + 0.10 * repeat_signal + 0.08 * fee_signal
    else:
        score = base + 0.05 * tx_signal + 0.03 * exposure_signal - 0.05 * fee_signal

    return round(_clamp(score, 0.05, 0.99), 4)


def _primary_flag(row: pd.Series) -> str:
    if row["class_label"] == "illicit":
        if float(row.get("num_addr_transacted_multiple", 0.0)) >= 4:
            return "Repeated routing"
        if float(row.get("fees_as_share_max", 0.0)) >= 0.003:
            return "Fee anomalies"
        return "Known illicit class"

    if row["class_label"] == "unknown":
        if float(row.get("transacted_w_address_total", 0.0)) >= 15:
            return "Broad counterparty exposure"
        if float(row.get("btc_transacted_total", 0.0)) >= 10:
            return "High throughput wallet"
        return "Unlabelled high-activity wallet"

    return "Low observed risk"


@lru_cache(maxsize=1)
def load_network_dataset() -> pd.DataFrame:
    features = pd.read_csv(FEATURES_PATH, usecols=RAW_FEATURE_COLUMNS)
    features = _clean_columns(features)

    classes = pd.read_csv(CLASSES_PATH)
    classes = _clean_columns(classes)

    df = features.merge(classes, on="address", how="left")
    df["class_label"] = df["class"].map(_class_label)
    df["risk_score"] = df.apply(_risk_score_for_row, axis=1)
    df["primary_flag"] = df.apply(_primary_flag, axis=1)
    return df


def _format_btc(amount: float) -> str:
    return f"{float(amount or 0.0):.4f} BTC"


def _risk_level(score: float) -> str:
    if score >= 0.75:
        return "critical"
    if score >= 0.5:
        return "high"
    if score >= 0.25:
        return "medium"
    return "low"


def _build_ranked_entities(df: pd.DataFrame, limit: int = 12) -> List[Dict[str, Any]]:
    ranked = (
        df.sort_values(["risk_score", "btc_transacted_total", "total_txs"], ascending=False)
        .head(limit)
    )

    entities: List[Dict[str, Any]] = []
    for _, row in ranked.iterrows():
        entities.append(
            {
                "address": row["address"],
                "risk_score": float(row["risk_score"]),
                "risk_label": row["class_label"],
                "entity_type": "wallet",
                "primary_flag": row["primary_flag"],
                "volume_btc": float(row.get("btc_transacted_total", 0.0) or 0.0),
                "tx_count": int(row.get("total_txs", 0) or 0),
            }
        )
    return entities


def _build_graph(
    df: pd.DataFrame,
    ranked_entities: List[Dict[str, Any]],
    max_edges: int = 36,
) -> Dict[str, Any]:
    ranked_map = {entity["address"]: entity for entity in ranked_entities}
    seed_addresses = list(ranked_map.keys()[:8])
    seed_set: Set[str] = set(seed_addresses)

    if not seed_set:
        return {"nodes": [], "edges": []}

    nodes_by_address = df.set_index("address")
    edges: List[Dict[str, Any]] = []
    seen_edges: Set[tuple[str, str]] = set()
    neighbor_counts: Dict[str, int] = {address: 0 for address in seed_set}

    for chunk in pd.read_csv(EDGE_PATH, chunksize=50_000):
        chunk = _clean_columns(chunk)
        relevant = chunk[
            chunk["input_address"].isin(seed_set) | chunk["output_address"].isin(seed_set)
        ]

        for _, row in relevant.iterrows():
            src = row["input_address"]
            dst = row["output_address"]
            if not src or not dst:
                continue
            key = (src, dst)
            if key in seen_edges:
                continue

            seed = src if src in seed_set else dst
            if src == dst:
                continue
            if neighbor_counts.get(seed, 0) >= 4 and dst not in seed_set and src not in seed_set:
                continue

            seen_edges.add(key)
            neighbor_counts[seed] = neighbor_counts.get(seed, 0) + 1

            src_score = float(
                ranked_map.get(src, {}).get(
                    "risk_score",
                    nodes_by_address["risk_score"].get(src, 0.2) if src in nodes_by_address.index else 0.2,
                )
            )
            dst_score = float(
                ranked_map.get(dst, {}).get(
                    "risk_score",
                    nodes_by_address["risk_score"].get(dst, 0.2) if dst in nodes_by_address.index else 0.2,
                )
            )
            src_volume = float(
                ranked_map.get(src, {}).get(
                    "volume_btc",
                    nodes_by_address["btc_transacted_total"].get(src, 0.0) if src in nodes_by_address.index else 0.0,
                )
            )
            dst_volume = float(
                ranked_map.get(dst, {}).get(
                    "volume_btc",
                    nodes_by_address["btc_transacted_total"].get(dst, 0.0) if dst in nodes_by_address.index else 0.0,
                )
            )

            edges.append(
                {
                    "source": src,
                    "target": dst,
                    "tx_count": 1,
                    "risk": _risk_level(max(src_score, dst_score)),
                    "value": round(max(src_volume, dst_volume), 6),
                }
            )

            if len(edges) >= max_edges:
                break

        if len(edges) >= max_edges:
            break

    node_ids = seed_set | {edge["source"] for edge in edges} | {edge["target"] for edge in edges}
    nodes: List[Dict[str, Any]] = []
    for address in node_ids:
        row = ranked_map.get(address)
        if row is None and address in nodes_by_address.index:
            data = nodes_by_address.loc[address]
            if isinstance(data, pd.DataFrame):
                data = data.iloc[0]
            row = {
                "risk_score": float(data.get("risk_score", 0.2)),
                "volume_btc": float(data.get("btc_transacted_total", 0.0) or 0.0),
                "primary_flag": data.get("primary_flag", "Connected wallet"),
            }
        row = row or {"risk_score": 0.2, "volume_btc": 0.0, "primary_flag": "Connected wallet"}

        nodes.append(
            {
                "id": address,
                "label": address,
                "type": "wallet",
                "risk_score": float(row["risk_score"]),
                "volume_btc": float(row["volume_btc"]),
                "primary_flag": row["primary_flag"],
                "is_hub": address in seed_set,
            }
        )

    return {"nodes": nodes, "edges": edges}


@lru_cache(maxsize=1)
def _build_network_summary_cached() -> Dict[str, Any]:
    if not _required_files_present():
        return {
            "wallets_scanned": 0,
            "flagged_wallets": 0,
            "flagged_pct": 0.0,
            "licit_wallets": 0,
            "unknown_wallets": 0,
            "network_risk_index": 0.0,
            "suspicious_tx_count": 0,
            "counterparty_exposure": 0,
            "repeat_counterparty_wallets": 0,
            "median_flagged_volume_btc": 0.0,
            "ranked_entities": [],
            "graph": {"nodes": [], "edges": []},
            "scan_timestamp": int(time.time()),
            "data_source": "unavailable",
            "message": "Place the Elliptic dataset CSV files in backend/data/ to enable network scanning.",
        }

    df = load_network_dataset()

    wallets_scanned = int(len(df))
    flagged_mask = df["class_label"] == "illicit"
    flagged_wallets = int(flagged_mask.sum())
    licit_wallets = int((df["class_label"] == "licit").sum())
    unknown_wallets = int((df["class_label"] == "unknown").sum())
    flagged_pct = round((flagged_wallets / wallets_scanned) * 100, 2) if wallets_scanned else 0.0
    flagged_risk_mean = float(df.loc[flagged_mask, "risk_score"].mean()) if flagged_wallets else 0.0
    network_risk_index = round(
        _clamp((flagged_pct / 100.0) * 0.55 + flagged_risk_mean * 0.45, 0.0, 0.99),
        4,
    )

    ranked_entities = _build_ranked_entities(df)
    graph = _build_graph(df, ranked_entities)

    suspicious_tx_count = int(df.loc[flagged_mask, "total_txs"].sum()) if flagged_wallets else 0
    counterparty_exposure = int(
        df.loc[flagged_mask, "transacted_w_address_total"].sum()
    ) if flagged_wallets else 0
    repeat_counterparty_wallets = int(
        ((df["num_addr_transacted_multiple"] > 0) & flagged_mask).sum()
    )
    median_flagged_volume_btc = float(
        df.loc[flagged_mask, "btc_transacted_total"].median()
    ) if flagged_wallets else 0.0

    return {
        "wallets_scanned": wallets_scanned,
        "flagged_wallets": flagged_wallets,
        "flagged_pct": flagged_pct,
        "licit_wallets": licit_wallets,
        "unknown_wallets": unknown_wallets,
        "network_risk_index": network_risk_index,
        "suspicious_tx_count": suspicious_tx_count,
        "counterparty_exposure": counterparty_exposure,
        "repeat_counterparty_wallets": repeat_counterparty_wallets,
        "median_flagged_volume_btc": round(median_flagged_volume_btc, 6),
        "ranked_entities": ranked_entities,
        "graph": graph,
        "scan_timestamp": int(time.time()),
        "data_source": "local_dataset",
        "message": (
            f"Scanned {wallets_scanned:,} labelled wallets from the Elliptic dataset. "
            f"Top entities are ranked by dataset label plus behavioural intensity."
        ),
        "summary_cards": [
            {
                "label": "Flagged wallets",
                "value": flagged_wallets,
                "detail": f"{flagged_pct:.2f}% of labelled wallets",
            },
            {
                "label": "Median flagged volume",
                "value": _format_btc(median_flagged_volume_btc),
                "detail": "Across illicit-labelled wallets",
            },
        ],
    }


def build_network_summary() -> Dict[str, Any]:
    summary = dict(_build_network_summary_cached())
    summary["scan_timestamp"] = int(time.time())
    return summary
