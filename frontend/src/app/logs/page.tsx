"use client";

/**
 * Log List Page
 * 
 * React/Three.js Bridge:
 * This is like the main "scene" - it contains multiple meshes (log entries)
 * arranged in a list. The filter panel acts like shader parameters that
 * affect how we query and display the data.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getLogs, getExportUrl, Log, LogListResponse, LogSeverity } from "@/lib/api";
import FilterPanel, { FilterState } from "@/components/FilterPanel";
import SeverityBadge from "@/components/SeverityBadge";
import Pagination from "@/components/Pagination";
import { format } from "date-fns";
import { Eye, Loader2 } from "lucide-react";

export default function LogsListPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    severity: "",
    source: "",
    startDate: "",
    endDate: "",
  });

  // Fetch logs when filters or page changes
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getLogs({
        page,
        page_size: 20,
        search: filters.search || undefined,
        severity: filters.severity as LogSeverity || undefined,
        source: filters.source || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        sort_by: "timestamp",
        sort_order: "desc",
      });
      
      setLogs(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  // Handle CSV export
  const handleExport = () => {
    const url = getExportUrl({
      severity: filters.severity as LogSeverity || undefined,
      source: filters.source || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
    });
    window.open(url, "_blank");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Log Entries</h1>
          <p className="text-[var(--muted)]">
            {loading ? "Loading..." : `${total.toLocaleString()} total logs`}
          </p>
        </div>
        <Link href="/logs/new" className="btn btn-primary">
          + Create Log
        </Link>
      </div>

      <FilterPanel 
        onFilterChange={handleFilterChange} 
        onExport={handleExport}
      />

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--muted)]">No logs found matching your criteria</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <table className="table">
              <thead>
                <tr className="bg-[var(--card)]">
                  <th>Timestamp</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Message</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="group">
                    <td className="font-mono text-sm whitespace-nowrap">
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </td>
                    <td>
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="text-[var(--muted)]">{log.source}</td>
                    <td className="max-w-md truncate" title={log.message}>
                      {log.message}
                    </td>
                    <td>
                      <Link
                        href={`/logs/${log.id}`}
                        className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

