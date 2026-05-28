from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class HealthServiceStatus(BaseModel):
    name: str
    status: Literal["ok", "ready", "degraded"]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    environment: str
    timestamp: datetime
    dependencies: list[HealthServiceStatus]
