"""Pydantic schemas for Log operations."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.log import LogSeverity


class LogBase(BaseModel):
    """Base schema for log data."""
    message: str = Field(..., min_length=1, max_length=10000)
    severity: LogSeverity = LogSeverity.INFO
    source: str = Field(..., min_length=1, max_length=255)
    metadata_json: Optional[str] = None


class LogCreate(LogBase):
    """Schema for creating a new log entry."""
    timestamp: Optional[datetime] = None  # If not provided, uses server time


class LogUpdate(BaseModel):
    """Schema for updating an existing log entry."""
    message: Optional[str] = Field(None, min_length=1, max_length=10000)
    severity: Optional[LogSeverity] = None
    source: Optional[str] = Field(None, min_length=1, max_length=255)
    metadata_json: Optional[str] = None


class LogResponse(LogBase):
    """Schema for log response."""
    id: int
    timestamp: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LogListResponse(BaseModel):
    """Schema for paginated log list response."""
    items: list[LogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class LogFilter(BaseModel):
    """Schema for log filtering parameters."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    severity: Optional[LogSeverity] = None
    source: Optional[str] = None
    search: Optional[str] = None


class LogAggregation(BaseModel):
    """Schema for aggregated log counts."""
    label: str
    count: int


class LogTrend(BaseModel):
    """Schema for log trend data (time series)."""
    date: str  # ISO date string
    count: int
    severity: Optional[str] = None


class LogStats(BaseModel):
    """Schema for overall log statistics."""
    total_logs: int
    severity_breakdown: list[LogAggregation]
    source_breakdown: list[LogAggregation]
    trend_data: list[LogTrend]
    date_range: dict[str, Optional[str]]

