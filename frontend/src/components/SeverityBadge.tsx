"use client";

import { LogSeverity } from "@/lib/api";

interface SeverityBadgeProps {
  severity: LogSeverity;
  size?: "sm" | "md" | "lg";
}

export default function SeverityBadge({ severity, size = "md" }: SeverityBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  return (
    <span className={`severity-badge severity-${severity} ${sizeClasses[size]}`}>
      {severity}
    </span>
  );
}

