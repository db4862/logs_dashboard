"""Log API endpoints for CRUD operations, filtering, and aggregation."""
from datetime import datetime, timedelta
from typing import Optional
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc, cast, Date
from sqlalchemy.sql import extract

from app.database import get_db
from app.models.log import Log, LogSeverity
from app.schemas.log import (
    LogCreate,
    LogUpdate,
    LogResponse,
    LogListResponse,
    LogAggregation,
    LogTrend,
    LogStats
)
from app.config import settings

router = APIRouter(prefix="/logs", tags=["Logs"])


# --- CRUD Operations ---

@router.post("", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
async def create_log(
    log_data: LogCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new log entry.
    
    - **message**: Log message content
    - **severity**: DEBUG, INFO, WARNING, ERROR, or CRITICAL
    - **source**: Source system/application name
    - **timestamp**: Optional custom timestamp (defaults to now)
    """
    log = Log(
        message=log_data.message,
        severity=log_data.severity,
        source=log_data.source,
        metadata_json=log_data.metadata_json,
        timestamp=log_data.timestamp or datetime.utcnow()
    )
    db.add(log)
    await db.flush()
    await db.refresh(log)
    return log


@router.get("", response_model=LogListResponse)
async def list_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    severity: Optional[LogSeverity] = Query(None, description="Filter by severity"),
    source: Optional[str] = Query(None, description="Filter by source"),
    search: Optional[str] = Query(None, description="Search in message"),
    sort_by: str = Query("timestamp", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: AsyncSession = Depends(get_db)
):
    """
    List logs with filtering, sorting, and pagination.
    
    Supports filtering by date range, severity, source, and text search.
    """
    # Build base query
    query = select(Log)
    count_query = select(func.count(Log.id))
    
    # Apply filters
    conditions = []
    
    if start_date:
        conditions.append(Log.timestamp >= start_date)
    if end_date:
        conditions.append(Log.timestamp <= end_date)
    if severity:
        conditions.append(Log.severity == severity)
    if source:
        conditions.append(Log.source.ilike(f"%{source}%"))
    if search:
        conditions.append(Log.message.ilike(f"%{search}%"))
    
    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply sorting
    sort_column = getattr(Log, sort_by, Log.timestamp)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size
    
    return LogListResponse(
        items=logs,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/sources", response_model=list[str])
async def get_sources(db: AsyncSession = Depends(get_db)):
    """Get list of unique log sources."""
    result = await db.execute(
        select(Log.source).distinct().order_by(Log.source)
    )
    return [row[0] for row in result.fetchall()]


@router.get("/stats", response_model=LogStats)
async def get_log_stats(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    source: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated log statistics.
    
    Returns:
    - Total log count
    - Breakdown by severity
    - Breakdown by source
    - Trend data over time
    """
    # Build conditions
    conditions = []
    if start_date:
        conditions.append(Log.timestamp >= start_date)
    if end_date:
        conditions.append(Log.timestamp <= end_date)
    if source:
        conditions.append(Log.source == source)
    
    # Total count
    total_query = select(func.count(Log.id))
    if conditions:
        total_query = total_query.where(and_(*conditions))
    total_result = await db.execute(total_query)
    total_logs = total_result.scalar() or 0
    
    # Severity breakdown
    severity_query = (
        select(Log.severity, func.count(Log.id).label("count"))
        .group_by(Log.severity)
        .order_by(desc("count"))
    )
    if conditions:
        severity_query = severity_query.where(and_(*conditions))
    severity_result = await db.execute(severity_query)
    severity_breakdown = [
        LogAggregation(label=row[0].value, count=row[1])
        for row in severity_result.fetchall()
    ]
    
    # Source breakdown (top 10)
    source_query = (
        select(Log.source, func.count(Log.id).label("count"))
        .group_by(Log.source)
        .order_by(desc("count"))
        .limit(10)
    )
    if conditions:
        source_query = source_query.where(and_(*conditions))
    source_result = await db.execute(source_query)
    source_breakdown = [
        LogAggregation(label=row[0], count=row[1])
        for row in source_result.fetchall()
    ]
    
    # Trend data (daily counts for last 30 days or date range)
    trend_query = (
        select(
            cast(Log.timestamp, Date).label("date"),
            func.count(Log.id).label("count")
        )
        .group_by(cast(Log.timestamp, Date))
        .order_by("date")
    )
    if conditions:
        trend_query = trend_query.where(and_(*conditions))
    else:
        # Default to last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        trend_query = trend_query.where(Log.timestamp >= thirty_days_ago)
    
    trend_result = await db.execute(trend_query)
    trend_data = [
        LogTrend(date=str(row[0]), count=row[1])
        for row in trend_result.fetchall()
    ]
    
    return LogStats(
        total_logs=total_logs,
        severity_breakdown=severity_breakdown,
        source_breakdown=source_breakdown,
        trend_data=trend_data,
        date_range={
            "start": str(start_date) if start_date else None,
            "end": str(end_date) if end_date else None
        }
    )


@router.get("/trend", response_model=list[LogTrend])
async def get_log_trend(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    severity: Optional[LogSeverity] = Query(None),
    source: Optional[str] = Query(None),
    group_by_severity: bool = Query(False, description="Group trend by severity"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get log count trend over time.
    
    Returns daily counts for the selected filters.
    Optionally groups by severity for stacked charts.
    """
    conditions = []
    if start_date:
        conditions.append(Log.timestamp >= start_date)
    if end_date:
        conditions.append(Log.timestamp <= end_date)
    if severity:
        conditions.append(Log.severity == severity)
    if source:
        conditions.append(Log.source == source)
    
    if not start_date and not end_date:
        # Default to last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        conditions.append(Log.timestamp >= thirty_days_ago)
    
    if group_by_severity:
        query = (
            select(
                cast(Log.timestamp, Date).label("date"),
                Log.severity,
                func.count(Log.id).label("count")
            )
            .where(and_(*conditions) if conditions else True)
            .group_by(cast(Log.timestamp, Date), Log.severity)
            .order_by("date")
        )
        result = await db.execute(query)
        return [
            LogTrend(date=str(row[0]), count=row[2], severity=row[1].value)
            for row in result.fetchall()
        ]
    else:
        query = (
            select(
                cast(Log.timestamp, Date).label("date"),
                func.count(Log.id).label("count")
            )
            .where(and_(*conditions) if conditions else True)
            .group_by(cast(Log.timestamp, Date))
            .order_by("date")
        )
        result = await db.execute(query)
        return [
            LogTrend(date=str(row[0]), count=row[1])
            for row in result.fetchall()
        ]


@router.get("/export")
async def export_logs_csv(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    severity: Optional[LogSeverity] = Query(None),
    source: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Export filtered logs as CSV file.
    
    Bonus feature: Downloads logs matching the filter criteria.
    """
    # Build query
    query = select(Log)
    conditions = []
    
    if start_date:
        conditions.append(Log.timestamp >= start_date)
    if end_date:
        conditions.append(Log.timestamp <= end_date)
    if severity:
        conditions.append(Log.severity == severity)
    if source:
        conditions.append(Log.source == source)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(desc(Log.timestamp))
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Timestamp", "Severity", "Source", "Message"])
    
    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp.isoformat(),
            log.severity.value,
            log.source,
            log.message
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=logs_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@router.get("/{log_id}", response_model=LogResponse)
async def get_log(
    log_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific log entry by ID."""
    result = await db.execute(select(Log).where(Log.id == log_id))
    log = result.scalars().first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Log with id {log_id} not found"
        )
    
    return log


@router.put("/{log_id}", response_model=LogResponse)
async def update_log(
    log_id: int,
    log_data: LogUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing log entry."""
    result = await db.execute(select(Log).where(Log.id == log_id))
    log = result.scalars().first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Log with id {log_id} not found"
        )
    
    # Update only provided fields
    update_data = log_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)
    
    await db.flush()
    await db.refresh(log)
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
    log_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a log entry."""
    result = await db.execute(select(Log).where(Log.id == log_id))
    log = result.scalars().first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Log with id {log_id} not found"
        )
    
    await db.delete(log)
    return None

