"""Log model for storing application logs."""
import enum
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Enum, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class LogSeverity(str, enum.Enum):
    """Log severity levels following standard conventions."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class Log(Base):
    """
    Log entry model.
    
    Stores application logs with timestamp, message, severity level,
    and source information for filtering and analysis.
    """
    __tablename__ = "logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )
    
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    severity: Mapped[LogSeverity] = mapped_column(
        Enum(LogSeverity),
        default=LogSeverity.INFO,
        index=True
    )
    
    source: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )
    
    # Optional metadata fields
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<Log(id={self.id}, severity={self.severity}, source='{self.source}')>"

