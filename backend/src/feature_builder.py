from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from statistics import mean, median
from typing import Any, Dict, List, Optional, Set

import time
import pandas as pd
import requests
from requests.adapters import HTTPAdapter

from src.analysis_contracts import empty_feature_map, safe_float, safe_int, safe_text
from src.analysis_errors import WalletAnalysisError
from src.btc_address import validate_bitcoin_address

try:
    from urllib3.util.retry import Retry
except Exception:  # pragma: no cover
    Retry = None

API_BASE = "https://mempool.space/api"
REQUEST_TIMEOUT = (4, 8)
REQUEST_CACHE_TTL_SECONDS = 120
ADDRESS_TX_CACHE_TTL_SECONDS = 180

DEFAULT_MAX_PAGES = 2
DEFAULT_MAX_TX_FETCH = 60
MAX_TX_FETCH_HARD_CAP = 160
PAGE_SLEEP_SECONDS = 0.1

SESSION = requests.Session()
if Retry is not None:
    retry = Retry(
        total=2,
        backoff_factor=0.25,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    SESSION.mount("https://", adapter)
    SESSION.mount("http://", adapter)

LIVE_FEATURE_COLUMNS = [
    "num_txs_as_sender",
    "num_txs_as_receiver",
    "total_txs",
    "btc_transacted_total",
    "btc_transacted_min",
    "btc_transacted_max",
    "btc_transacted_mean",
    "btc_transacted_median",
    "btc_sent_total",
    "btc_sent_min",
    "btc_sent_max",
    "btc_sent_mean",
    "btc_sent_median",
    "btc_received_total",
    "btc_received_min",
    "btc_received_max",
    "btc_received_mean",
    "btc_received_median",
    "fees_total",
    "fees_min",
    "fees_max",
    "fees_mean",
    "fees_median",
    "fees_as_share_total",
    "fees_as_share_min",
    "fees_as_share_max",
    "fees_as_share_mean",
    "fees_as_share_median",
    "blocks_btwn_txs_total",
    "blocks_btwn_txs_min",
    "blocks_btwn_txs_max",
    "blocks_btwn_txs_mean",
    "blocks_btwn_txs_median",
    "blocks_btwn_input_txs_total",
    "blocks_btwn_input_txs_min",
    "blocks_btwn_input_txs_max",
    "blocks_btwn_input_txs_mean",
    "blocks_btwn_input_txs_median",
    "blocks_btwn_output_txs_total",
    "blocks_btwn_output_txs_min",
    "blocks_btwn_output_txs_max",
    "blocks_btwn_output_txs_mean",
    "blocks_btwn_output_txs_median",
    "num_addr_transacted_multiple",
    "transacted_w_address_total",
    "transacted_w_address_min",
    "transacted_w_address_max",
    "transacted_w_address_mean",
    "transacted_w_address_median",
]


@dataclass
class TxObservation:
    txid: str
    block_height: Optional[int]
    sent_sats: int
    received_sats: int
    fee_sats: int
    counterparties: Set[str]


@dataclass(frozen=True)
class FetchPlan:
    max_pages: int
    max_txs: int


@dataclass
class AddressActivitySnapshot:
    address: str
    summary: Dict[str, int]
    txs: List[Dict[str, Any]]
    warnings: List[str] = field(default_factory=list)

    @property
    def lifetime_tx_count(self) -> int:
        return safe_int(self.summary.get("tx_count", 0), minimum=0)


def _safe_mean(values: List[float]) -> float:
    return float(mean(values)) if values else 0.0


def _safe_median(values: List[float]) -> float:
    return float(median(values)) if values else 0.0


def _safe_min(values: List[float]) -> float:
    return float(min(values)) if values else 0.0


def _safe_max(values: List[float]) -> float:
    return float(max(values)) if values else 0.0


def _safe_sum(values: List[float]) -> float:
    return float(sum(values)) if values else 0.0


def _blocks_between(heights: List[int]) -> List[int]:
    valid_heights = sorted(h for h in heights if h is not None)
    if len(valid_heights) < 2:
        return []
    return [valid_heights[i] - valid_heights[i - 1] for i in range(1, len(valid_heights))]


def _cache_bucket(ttl_seconds: int) -> int:
    return int(time.time() // ttl_seconds)


def _default_summary() -> Dict[str, int]:
    return {
        "tx_count": 0,
        "funded_txo_count": 0,
        "funded_txo_sum": 0,
        "spent_txo_count": 0,
        "spent_txo_sum": 0,
    }


def _normalize_summary(summary: Optional[Dict[str, Any]]) -> Dict[str, int]:
    summary = summary or {}
    return {
        "tx_count": safe_int(summary.get("tx_count", 0), minimum=0),
        "funded_txo_count": safe_int(summary.get("funded_txo_count", 0), minimum=0),
        "funded_txo_sum": safe_int(summary.get("funded_txo_sum", 0), minimum=0),
        "spent_txo_count": safe_int(summary.get("spent_txo_count", 0), minimum=0),
        "spent_txo_sum": safe_int(summary.get("spent_txo_sum", 0), minimum=0),
    }


def _request_json_uncached(path: str) -> Any:
    url = f"{API_BASE}{path}"
    try:
        response = SESSION.get(url, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        raise RuntimeError(f"Unable to reach blockchain data provider for '{path}'.") from exc

    if response.status_code == 429:
        raise RuntimeError("Rate limit reached on mempool.space API. Try again shortly.")

    if response.status_code == 404:
        raise requests.HTTPError("404 Not Found", response=response)

    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        raise RuntimeError(f"Blockchain data provider returned HTTP {response.status_code}.") from exc

    try:
        return response.json()
    except ValueError as exc:
        raise RuntimeError("Blockchain data provider returned invalid JSON.") from exc


@lru_cache(maxsize=512)
def _request_json_cached(path: str, bucket: int) -> Any:
    del bucket
    return _request_json_uncached(path)


def _request_json(path: str, *, use_cache: bool = True, ttl_seconds: int = REQUEST_CACHE_TTL_SECONDS) -> Any:
    if use_cache:
        return _request_json_cached(path, _cache_bucket(ttl_seconds))
    return _request_json_uncached(path)


def get_address_summary(address: str) -> Dict[str, Any]:
    normalized_address = validate_bitcoin_address(address).normalized
    try:
        return _request_json(f"/address/{normalized_address}")
    except requests.HTTPError as exc:
        if getattr(exc, "response", None) is not None and exc.response.status_code == 404:
            return {"chain_stats": _default_summary(), "mempool_stats": _default_summary()}
        raise


def get_merged_address_stats(address: str) -> Dict[str, int]:
    summary = get_address_summary(address)
    chain_stats = _normalize_summary(summary.get("chain_stats"))
    mempool_stats = _normalize_summary(summary.get("mempool_stats"))
    return {
        key: chain_stats[key] + mempool_stats[key]
        for key in _default_summary().keys()
    }


def determine_fetch_plan(lifetime_tx_count: int) -> FetchPlan:
    total = safe_int(lifetime_tx_count, minimum=0)
    if total <= 2:
        return FetchPlan(max_pages=1, max_txs=12)
    if total <= 25:
        return FetchPlan(max_pages=2, max_txs=36)
    if total <= 250:
        return FetchPlan(max_pages=3, max_txs=80)
    if total <= 2_000:
        return FetchPlan(max_pages=2, max_txs=64)
    return FetchPlan(max_pages=1, max_txs=40)


def _get_all_address_txs_uncached(
    address: str,
    max_pages: int = DEFAULT_MAX_PAGES,
    max_txs: int = DEFAULT_MAX_TX_FETCH,
) -> List[Dict[str, Any]]:
    normalized_address = validate_bitcoin_address(address).normalized
    capped_max_pages = max(1, safe_int(max_pages, DEFAULT_MAX_PAGES, minimum=1, maximum=6))
    capped_max_txs = max(1, safe_int(max_txs, DEFAULT_MAX_TX_FETCH, minimum=1, maximum=MAX_TX_FETCH_HARD_CAP))

    try:
        first_batch = _request_json(f"/address/{normalized_address}/txs", ttl_seconds=ADDRESS_TX_CACHE_TTL_SECONDS)
    except requests.HTTPError as exc:
        if getattr(exc, "response", None) is not None and exc.response.status_code == 404:
            return []
        raise

    if not isinstance(first_batch, list):
        raise RuntimeError("Unexpected API response for address transaction history.")

    all_txs = list(first_batch[:capped_max_txs])
    if len(all_txs) >= capped_max_txs:
        return all_txs[:capped_max_txs]

    confirmed = [tx for tx in first_batch if isinstance(tx, dict) and (tx.get("status") or {}).get("confirmed")]
    if len(confirmed) < 25:
        return all_txs[:capped_max_txs]

    last_seen_txid = safe_text(confirmed[-1].get("txid"))
    pages_fetched = 0
    while pages_fetched < capped_max_pages and last_seen_txid:
        time.sleep(PAGE_SLEEP_SECONDS)
        next_batch = _request_json(
            f"/address/{normalized_address}/txs/chain/{last_seen_txid}",
            ttl_seconds=ADDRESS_TX_CACHE_TTL_SECONDS,
        )
        if not isinstance(next_batch, list) or not next_batch:
            break

        remaining = capped_max_txs - len(all_txs)
        if remaining <= 0:
            break

        all_txs.extend(next_batch[:remaining])
        last_seen_txid = safe_text(next_batch[-1].get("txid"))
        pages_fetched += 1

        if len(all_txs) >= capped_max_txs or len(next_batch) < 25:
            break

    seen = set()
    deduped: List[Dict[str, Any]] = []
    for tx in all_txs:
        txid = safe_text((tx or {}).get("txid"))
        if not txid or txid in seen:
            continue
        seen.add(txid)
        deduped.append(tx)

    return deduped[:capped_max_txs]


@lru_cache(maxsize=256)
def _get_all_address_txs_cached(address: str, max_pages: int, max_txs: int, bucket: int) -> List[Dict[str, Any]]:
    del bucket
    return _get_all_address_txs_uncached(address, max_pages=max_pages, max_txs=max_txs)


def get_all_address_txs(
    address: str,
    max_pages: int = DEFAULT_MAX_PAGES,
    max_txs: int = DEFAULT_MAX_TX_FETCH,
) -> List[Dict[str, Any]]:
    normalized_address = validate_bitcoin_address(address).normalized
    return _get_all_address_txs_cached(
        normalized_address,
        max_pages,
        max_txs,
        _cache_bucket(ADDRESS_TX_CACHE_TTL_SECONDS),
    )


def get_address_activity_snapshot(
    address: str,
    *,
    max_pages: Optional[int] = None,
    max_txs: Optional[int] = None,
) -> AddressActivitySnapshot:
    normalized_address = validate_bitcoin_address(address).normalized
    warnings: List[str] = []

    try:
        summary = get_merged_address_stats(normalized_address)
    except Exception as exc:
        summary = _default_summary()
        warnings.append(f"Address summary fallback used: {exc}")

    plan = determine_fetch_plan(summary.get("tx_count", 0))
    chosen_max_pages = max_pages if max_pages is not None else plan.max_pages
    chosen_max_txs = max_txs if max_txs is not None else plan.max_txs

    try:
        txs = get_all_address_txs(normalized_address, max_pages=chosen_max_pages, max_txs=chosen_max_txs)
    except Exception as exc:
        txs = []
        warnings.append(f"Transaction history fallback used: {exc}")

    return AddressActivitySnapshot(
        address=normalized_address,
        summary=_normalize_summary(summary),
        txs=txs,
        warnings=warnings,
    )


def _extract_counterparties(address: str, tx: Dict[str, Any]) -> Set[str]:
    counterparties: Set[str] = set()
    for vin in tx.get("vin", []):
        prevout = vin.get("prevout") or {}
        addr = safe_text(prevout.get("scriptpubkey_address"))
        if addr and addr != address:
            counterparties.add(addr)
    for vout in tx.get("vout", []):
        addr = safe_text(vout.get("scriptpubkey_address"))
        if addr and addr != address:
            counterparties.add(addr)
    return counterparties


def _tx_observation_for_address(address: str, tx: Dict[str, Any], index: int = 0) -> TxObservation:
    normalized_address = validate_bitcoin_address(address).normalized
    sent_sats = 0
    received_sats = 0

    for vin in tx.get("vin", []):
        prevout = vin.get("prevout") or {}
        if safe_text(prevout.get("scriptpubkey_address")) == normalized_address:
            sent_sats += safe_int(prevout.get("value", 0), minimum=0)

    for vout in tx.get("vout", []):
        if safe_text(vout.get("scriptpubkey_address")) == normalized_address:
            received_sats += safe_int(vout.get("value", 0), minimum=0)

    fee_sats = safe_int(tx.get("fee", 0), minimum=0)
    status = tx.get("status", {}) or {}
    block_height = safe_int(status.get("block_height"), default=0, minimum=0) if status.get("confirmed") else None

    return TxObservation(
        txid=safe_text(tx.get("txid"), f"tx-{index}"),
        block_height=block_height,
        sent_sats=sent_sats,
        received_sats=received_sats,
        fee_sats=fee_sats,
        counterparties=_extract_counterparties(normalized_address, tx),
    )


def build_live_features(
    address: str,
    max_pages: int = DEFAULT_MAX_PAGES,
    max_txs: int = DEFAULT_MAX_TX_FETCH,
) -> pd.DataFrame:
    snapshot = get_address_activity_snapshot(address, max_pages=max_pages, max_txs=max_txs)
    observations = [_tx_observation_for_address(snapshot.address, tx, index=i) for i, tx in enumerate(snapshot.txs)]

    sender_obs = [obs for obs in observations if obs.sent_sats > 0]
    receiver_obs = [obs for obs in observations if obs.received_sats > 0]

    sent_btc = [obs.sent_sats / 1e8 for obs in sender_obs]
    recv_btc = [obs.received_sats / 1e8 for obs in receiver_obs]
    transacted_btc = [(obs.sent_sats + obs.received_sats) / 1e8 for obs in observations]
    fees_btc = [obs.fee_sats / 1e8 for obs in sender_obs]
    fees_as_share = [
        (obs.fee_sats / obs.sent_sats) if obs.sent_sats > 0 else 0.0
        for obs in sender_obs
    ]

    all_heights = [obs.block_height for obs in observations if obs.block_height is not None]
    send_heights = [obs.block_height for obs in sender_obs if obs.block_height is not None]
    recv_heights = [obs.block_height for obs in receiver_obs if obs.block_height is not None]

    btwn_all = _blocks_between(all_heights)
    btwn_send = _blocks_between(send_heights)
    btwn_recv = _blocks_between(recv_heights)

    counterparties_per_tx = [len(obs.counterparties) for obs in observations]
    counterparty_frequency: Dict[str, int] = {}
    for obs in observations:
        for counterparty in obs.counterparties:
            counterparty_frequency[counterparty] = counterparty_frequency.get(counterparty, 0) + 1

    num_addr_transacted_multiple = int(sum(1 for count in counterparty_frequency.values() if count > 1))
    lifetime_tx_count = safe_int(snapshot.summary.get("tx_count", 0), minimum=0)
    lifetime_btc_total = safe_float(
        (snapshot.summary.get("funded_txo_sum", 0) + snapshot.summary.get("spent_txo_sum", 0)) / 1e8,
        minimum=0.0,
    )

    feature_dict = empty_feature_map(LIVE_FEATURE_COLUMNS)
    feature_dict.update(
        {
            "num_txs_as_sender": safe_float(len(sender_obs), minimum=0.0),
            "num_txs_as_receiver": safe_float(len(receiver_obs), minimum=0.0),
            "total_txs": safe_float(lifetime_tx_count or len(observations), minimum=0.0),
            "btc_transacted_total": lifetime_btc_total or _safe_sum(transacted_btc),
            "btc_transacted_min": _safe_min(transacted_btc),
            "btc_transacted_max": _safe_max(transacted_btc),
            "btc_transacted_mean": _safe_mean(transacted_btc),
            "btc_transacted_median": _safe_median(transacted_btc),
            "btc_sent_total": safe_float(snapshot.summary.get("spent_txo_sum", 0) / 1e8, minimum=0.0) or _safe_sum(sent_btc),
            "btc_sent_min": _safe_min(sent_btc),
            "btc_sent_max": _safe_max(sent_btc),
            "btc_sent_mean": _safe_mean(sent_btc),
            "btc_sent_median": _safe_median(sent_btc),
            "btc_received_total": safe_float(snapshot.summary.get("funded_txo_sum", 0) / 1e8, minimum=0.0) or _safe_sum(recv_btc),
            "btc_received_min": _safe_min(recv_btc),
            "btc_received_max": _safe_max(recv_btc),
            "btc_received_mean": _safe_mean(recv_btc),
            "btc_received_median": _safe_median(recv_btc),
            "fees_total": _safe_sum(fees_btc),
            "fees_min": _safe_min(fees_btc),
            "fees_max": _safe_max(fees_btc),
            "fees_mean": _safe_mean(fees_btc),
            "fees_median": _safe_median(fees_btc),
            "fees_as_share_total": _safe_sum(fees_as_share),
            "fees_as_share_min": _safe_min(fees_as_share),
            "fees_as_share_max": _safe_max(fees_as_share),
            "fees_as_share_mean": _safe_mean(fees_as_share),
            "fees_as_share_median": _safe_median(fees_as_share),
            "blocks_btwn_txs_total": _safe_sum(btwn_all),
            "blocks_btwn_txs_min": _safe_min(btwn_all),
            "blocks_btwn_txs_max": _safe_max(btwn_all),
            "blocks_btwn_txs_mean": _safe_mean(btwn_all),
            "blocks_btwn_txs_median": _safe_median(btwn_all),
            "blocks_btwn_input_txs_total": _safe_sum(btwn_send),
            "blocks_btwn_input_txs_min": _safe_min(btwn_send),
            "blocks_btwn_input_txs_max": _safe_max(btwn_send),
            "blocks_btwn_input_txs_mean": _safe_mean(btwn_send),
            "blocks_btwn_input_txs_median": _safe_median(btwn_send),
            "blocks_btwn_output_txs_total": _safe_sum(btwn_recv),
            "blocks_btwn_output_txs_min": _safe_min(btwn_recv),
            "blocks_btwn_output_txs_max": _safe_max(btwn_recv),
            "blocks_btwn_output_txs_mean": _safe_mean(btwn_recv),
            "blocks_btwn_output_txs_median": _safe_median(btwn_recv),
            "num_addr_transacted_multiple": safe_float(num_addr_transacted_multiple, minimum=0.0),
            "transacted_w_address_total": _safe_sum([float(v) for v in counterparties_per_tx]),
            "transacted_w_address_min": _safe_min([float(v) for v in counterparties_per_tx]),
            "transacted_w_address_max": _safe_max([float(v) for v in counterparties_per_tx]),
            "transacted_w_address_mean": _safe_mean([float(v) for v in counterparties_per_tx]),
            "transacted_w_address_median": _safe_median([float(v) for v in counterparties_per_tx]),
        }
    )

    row = {column: safe_float(feature_dict.get(column, 0.0), minimum=0.0) for column in LIVE_FEATURE_COLUMNS}
    df = pd.DataFrame([row])
    df.attrs["normalized_address"] = snapshot.address
    df.attrs["sampled_tx_count"] = safe_int(len(observations), minimum=0)
    df.attrs["sampled_btc_total"] = safe_float(_safe_sum(transacted_btc), minimum=0.0)
    df.attrs["lifetime_tx_count"] = lifetime_tx_count or len(observations)
    df.attrs["lifetime_btc_total"] = lifetime_btc_total
    df.attrs["warnings"] = list(snapshot.warnings)
    return df


if __name__ == "__main__":
    sample_address = input("Enter BTC address: ").strip()
    feature_df = build_live_features(sample_address)
    print(feature_df.T)
