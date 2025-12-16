"""
Logs Dashboard API - Main Application Entry Point.

A FastAPI application for managing and analyzing application logs.
Features:
- CRUD operations for log entries
- Filtering by date range, severity, and source
- Aggregated statistics and trend analysis
- CSV export functionality
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, engine
from app.routers import logs


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    
    On startup: Initialize database tables
    On shutdown: Clean up resources
    """
    await init_db()
    yield
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for managing and analyzing application logs",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://frontend:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(logs.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """API root endpoint with basic info."""
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration."""
    return {"status": "healthy"}

