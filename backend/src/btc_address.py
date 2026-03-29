from __future__ import annotations

from dataclasses import dataclass
import hashlib
from typing import Dict, List

from src.analysis_errors import WalletAnalysisError

BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
BASE58_INDEX: Dict[str, int] = {char: index for index, char in enumerate(BASE58_ALPHABET)}

BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
BECH32_INDEX: Dict[str, int] = {char: index for index, char in enumerate(BECH32_CHARSET)}
BECH32_CONST = 1
BECH32M_CONST = 0x2BC830A3


@dataclass(frozen=True)
class AddressValidationResult:
    normalized: str
    address_format: str
    network: str
    script_type: str
    witness_version: int | None = None


def _sha256(payload: bytes) -> bytes:
    return hashlib.sha256(payload).digest()


def _decode_base58(address: str) -> bytes:
    num = 0
    for char in address:
        if char not in BASE58_INDEX:
            raise WalletAnalysisError(
                message=f"Invalid Base58 character '{char}' in Bitcoin address.",
                status_code=400,
                code="invalid_address",
                details={"address_format": "base58"},
            )
        num = (num * 58) + BASE58_INDEX[char]

    payload = num.to_bytes((num.bit_length() + 7) // 8, byteorder="big") if num > 0 else b""
    leading_zeros = len(address) - len(address.lstrip("1"))
    return (b"\x00" * leading_zeros) + payload


def _bech32_hrp_expand(hrp: str) -> List[int]:
    return [ord(char) >> 5 for char in hrp] + [0] + [ord(char) & 31 for char in hrp]


def _bech32_polymod(values: List[int]) -> int:
    generator = [0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3]
    checksum = 1
    for value in values:
        top = checksum >> 25
        checksum = ((checksum & 0x1FFFFFF) << 5) ^ value
        for index in range(5):
            if (top >> index) & 1:
                checksum ^= generator[index]
    return checksum


def _convert_bits(data: List[int], from_bits: int, to_bits: int, *, pad: bool) -> List[int]:
    accumulator = 0
    bits = 0
    output: List[int] = []
    max_value = (1 << to_bits) - 1
    max_accumulator = (1 << (from_bits + to_bits - 1)) - 1

    for value in data:
        if value < 0 or value >> from_bits:
            raise WalletAnalysisError(
                message="Bitcoin address contained out-of-range Bech32 data.",
                status_code=400,
                code="invalid_address",
                details={"address_format": "bech32"},
            )
        accumulator = ((accumulator << from_bits) | value) & max_accumulator
        bits += from_bits
        while bits >= to_bits:
            bits -= to_bits
            output.append((accumulator >> bits) & max_value)

    if pad:
        if bits:
            output.append((accumulator << (to_bits - bits)) & max_value)
    elif bits >= from_bits or ((accumulator << (to_bits - bits)) & max_value):
        raise WalletAnalysisError(
            message="Bitcoin address contained invalid Bech32 padding.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "bech32"},
        )

    return output


def _decode_bech32(address: str) -> AddressValidationResult:
    if address.lower() != address and address.upper() != address:
        raise WalletAnalysisError(
            message="Bech32 Bitcoin addresses cannot mix upper and lower case characters.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "bech32"},
        )

    normalized = address.lower()
    separator_index = normalized.rfind("1")
    if separator_index < 1 or separator_index + 7 > len(normalized):
        raise WalletAnalysisError(
            message="Invalid Bech32 Bitcoin address structure.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "bech32"},
        )

    hrp = normalized[:separator_index]
    if hrp != "bc":
        raise WalletAnalysisError(
            message="Only mainnet Bitcoin addresses are supported.",
            status_code=400,
            code="invalid_address",
            details={"network": hrp},
        )

    data = []
    for char in normalized[separator_index + 1 :]:
        if char not in BECH32_INDEX:
            raise WalletAnalysisError(
                message=f"Invalid Bech32 character '{char}' in Bitcoin address.",
                status_code=400,
                code="invalid_address",
                details={"address_format": "bech32"},
            )
        data.append(BECH32_INDEX[char])

    checksum = _bech32_polymod(_bech32_hrp_expand(hrp) + data)
    if checksum == BECH32_CONST:
        encoding = "bech32"
    elif checksum == BECH32M_CONST:
        encoding = "bech32m"
    else:
        raise WalletAnalysisError(
            message="Bitcoin address checksum did not validate.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "bech32"},
        )

    payload = data[:-6]
    if not payload:
        raise WalletAnalysisError(
            message="Bitcoin address payload was empty.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "bech32"},
        )

    witness_version = payload[0]
    if witness_version > 16:
        raise WalletAnalysisError(
            message="Bitcoin witness version is not supported.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "bech32"},
        )

    witness_program = _convert_bits(payload[1:], 5, 8, pad=False)
    if not 2 <= len(witness_program) <= 40:
        raise WalletAnalysisError(
            message="Bitcoin witness program length is invalid.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "bech32"},
        )

    if witness_version == 0:
        if encoding != "bech32":
            raise WalletAnalysisError(
                message="Witness version 0 Bitcoin addresses must use Bech32 encoding.",
                status_code=400,
                code="invalid_address",
                details={"address_format": "bech32"},
            )
        if len(witness_program) not in (20, 32):
            raise WalletAnalysisError(
                message="Witness version 0 Bitcoin addresses must carry 20-byte or 32-byte programs.",
                status_code=400,
                code="invalid_address",
                details={"address_format": "bech32"},
            )
        script_type = "bech32"
    else:
        if encoding != "bech32m":
            raise WalletAnalysisError(
                message="Witness version 1+ Bitcoin addresses must use Bech32m encoding.",
                status_code=400,
                code="invalid_address",
                details={"address_format": "bech32"},
            )
        script_type = "taproot" if witness_version == 1 else f"witness_v{witness_version}"

    return AddressValidationResult(
        normalized=normalized,
        address_format="bech32",
        network="bitcoin",
        script_type=script_type,
        witness_version=witness_version,
    )


def _decode_base58_address(address: str) -> AddressValidationResult:
    raw = _decode_base58(address)
    if len(raw) < 5:
        raise WalletAnalysisError(
            message="Bitcoin address payload is too short.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "base58"},
        )

    payload = raw[:-4]
    checksum = raw[-4:]
    expected_checksum = _sha256(_sha256(payload))[:4]
    if checksum != expected_checksum:
        raise WalletAnalysisError(
            message="Bitcoin address checksum did not validate.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "base58"},
        )

    version = payload[0]
    body = payload[1:]
    if len(body) != 20:
        raise WalletAnalysisError(
            message="Base58 Bitcoin addresses must carry a 20-byte payload.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "base58"},
        )

    if version == 0x00:
        script_type = "p2pkh"
    elif version == 0x05:
        script_type = "p2sh"
    else:
        raise WalletAnalysisError(
            message="Only mainnet Bitcoin P2PKH and P2SH addresses are supported.",
            status_code=400,
            code="invalid_address",
            details={"address_format": "base58", "version": version},
        )

    return AddressValidationResult(
        normalized=address,
        address_format="base58",
        network="bitcoin",
        script_type=script_type,
    )


def validate_bitcoin_address(address: str) -> AddressValidationResult:
    candidate = (address or "").strip()
    if not candidate:
        raise WalletAnalysisError(
            message="Bitcoin address is required.",
            status_code=400,
            code="invalid_address",
            address=candidate,
        )

    try:
        if candidate.lower().startswith("bc1"):
            return _decode_bech32(candidate)
        return _decode_base58_address(candidate)
    except WalletAnalysisError as exc:
        if exc.address is None:
            exc.address = candidate
        raise
