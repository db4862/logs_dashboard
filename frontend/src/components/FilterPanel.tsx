"use client";

/**
 * Filter Panel Component
 * 
 * React/Three.js Bridge:
 * Like "uniforms" in a shader - these are parameters that configure
 * how the data (geometry) is displayed. Changing filters re-renders
 * the log list with new parameters.
 */

import { useState, useEffect } from "react";
import { getSources, LogSeverity } from "@/lib/api";
import { Search, Filter, X, Download } from "lucide-react";

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  onExport?: () => void;
  showExport?: boolean;
}

export interface FilterState {
  search: string;
  severity: LogSeverity | "";
  source: string;
  startDate: string;
  endDate: string;
}

const SEVERITIES: LogSeverity[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

export default function FilterPanel({ 
  onFilterChange, 
  onExport,
  showExport = true 
}: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    severity: "",
    source: "",
    startDate: "",
    endDate: "",
  });
  
  const [sources, setSources] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch available sources on mount
  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(console.error);
  }, []);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      severity: "",
      source: "",
      startDate: "",
      endDate: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  return (
    <div className="card mb-6">
      {/* Search and Toggle Row */}
      <div className="flex gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`btn ${hasActiveFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              Active
            </span>
          )}
        </button>

        {/* Export Button */}
        {showExport && onExport && (
          <button onClick={onExport} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <div className="grid grid-cols-4 gap-4">
            {/* Severity Filter */}
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) => updateFilter("severity", e.target.value)}
                className="select"
              >
                <option value="">All Severities</option>
                {SEVERITIES.map(sev => (
                  <option key={sev} value={sev}>{sev}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => updateFilter("source", e.target.value)}
                className="select"
              >
                <option value="">All Sources</option>
                {sources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                Start Date
              </label>
              <input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => updateFilter("startDate", e.target.value)}
                className="input"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                End Date
              </label>
              <input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => updateFilter("endDate", e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-[var(--muted)] hover:text-white flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

