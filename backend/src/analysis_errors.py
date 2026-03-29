from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class WalletAnalysisError(Exception):
    message: str
    status_code: int = 400
    code: str = "wallet_analysis_error"
    address: Optional[str] = None
    details: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        super().__init__(self.message)

