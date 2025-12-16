#!/usr/bin/env python3
"""
Seed script to populate the database with sample log data.

Usage:
    uv run python scripts/seed_data.py
"""
import asyncio
import random
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, Base, AsyncSessionFactory
from app.models.log import Log, LogSeverity


# Sample data for realistic logs
SOURCES = [
    "api-gateway",
    "auth-service", 
    "user-service",
    "order-service",
    "payment-service",
    "notification-service",
    "database-service",
    "cache-service",
    "scheduler",
    "worker"
]

LOG_MESSAGES = {
    LogSeverity.DEBUG: [
        "Processing request with params: {}",
        "Cache lookup for key: session_{}",
        "Database query executed in {}ms",
        "Validating input data",
        "Starting background task: {}",
    ],
    LogSeverity.INFO: [
        "User {} logged in successfully",
        "Order {} created for user {}",
        "Payment processed: ${}",
        "Email notification sent to {}",
        "Service started on port {}",
        "Health check passed",
        "Configuration loaded from environment",
        "Database connection established",
    ],
    LogSeverity.WARNING: [
        "Slow query detected: {}ms",
        "Rate limit approaching for user {}",
        "Deprecated API endpoint called: {}",
        "Memory usage at {}%",
        "Retry attempt {} for operation",
        "Connection pool running low",
    ],
    LogSeverity.ERROR: [
        "Failed to process payment for order {}",
        "Database connection timeout after {}ms",
        "Authentication failed for user {}",
        "Invalid request format: {}",
        "Service unavailable: {}",
        "File not found: {}",
    ],
    LogSeverity.CRITICAL: [
        "Database cluster failover initiated",
        "Out of memory - service restarting",
        "Security breach detected from IP {}",
        "Data corruption detected in table {}",
        "Service crash - unhandled exception",
    ]
}

# Severity weights for realistic distribution
SEVERITY_WEIGHTS = {
    LogSeverity.DEBUG: 15,
    LogSeverity.INFO: 50,
    LogSeverity.WARNING: 20,
    LogSeverity.ERROR: 12,
    LogSeverity.CRITICAL: 3
}


def generate_message(severity: LogSeverity) -> str:
    """Generate a random log message for the given severity."""
    template = random.choice(LOG_MESSAGES[severity])
    
    # Fill in placeholders with random values
    placeholders = template.count("{}")
    values = []
    for _ in range(placeholders):
        values.append(random.choice([
            str(random.randint(1, 10000)),
            f"user_{random.randint(1, 1000)}",
            random.choice(["order", "payment", "session"]) + f"_{random.randint(1, 9999)}",
            f"{random.randint(10, 500)}",
            random.choice(["8080", "3000", "5432", "6379"]),
            f"operation_{random.choice(['create', 'update', 'delete', 'read'])}",
        ]))
    
    return template.format(*values) if values else template


def random_severity() -> LogSeverity:
    """Get a random severity based on realistic weights."""
    severities = list(SEVERITY_WEIGHTS.keys())
    weights = list(SEVERITY_WEIGHTS.values())
    return random.choices(severities, weights=weights)[0]


async def seed_logs(num_logs: int = 500, days_back: int = 30):
    """Create sample log entries."""
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionFactory() as session:
        print(f"Creating {num_logs} sample log entries...")
        
        logs = []
        now = datetime.utcnow()
        
        for i in range(num_logs):
            # Random timestamp within the date range
            random_days = random.uniform(0, days_back)
            random_hours = random.uniform(0, 24)
            timestamp = now - timedelta(days=random_days, hours=random_hours)
            
            severity = random_severity()
            source = random.choice(SOURCES)
            message = generate_message(severity)
            
            log = Log(
                timestamp=timestamp,
                message=message,
                severity=severity,
                source=source
            )
            logs.append(log)
            
            if (i + 1) % 100 == 0:
                print(f"  Created {i + 1}/{num_logs} logs...")
        
        session.add_all(logs)
        await session.commit()
        
        print(f"\n✅ Successfully created {num_logs} log entries!")
        print(f"   Date range: {(now - timedelta(days=days_back)).date()} to {now.date()}")
        print(f"   Sources: {len(SOURCES)}")
        print("\nSeverity distribution:")
        
        # Count by severity
        severity_counts = {}
        for log in logs:
            severity_counts[log.severity] = severity_counts.get(log.severity, 0) + 1
        
        for sev, count in sorted(severity_counts.items(), key=lambda x: x[1], reverse=True):
            pct = (count / num_logs) * 100
            print(f"   {sev.value}: {count} ({pct:.1f}%)")


async def main():
    print()
    print("=" * 50)
    print("Logs Dashboard - Sample Data Generator")
    print("=" * 50)
    print()
    
    await seed_logs(num_logs=500, days_back=30)
    
    print()
    print("=" * 50)
    print()


if __name__ == "__main__":
    asyncio.run(main())

