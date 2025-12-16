"use client";

/**
 * Dashboard Page
 * 
 * React/Three.js Bridge:
 * Like a "scene overview" - you see multiple visualizations at once.
 * Each chart is like a different camera angle or render pass showing
 * the same data from different perspectives.
 * 
 * The useEffect hooks are like the animation loop (requestAnimationFrame)
 * - they run when data changes to update the visualizations.
 */

import { useState, useEffect, useCallback } from "react";
import { getLogStats, getSources, LogStats, LogSeverity } from "@/lib/api";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { 
  Activity, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Bug,
  Zap,
  Loader2,
  TrendingUp,
  Server,
  Calendar
} from "lucide-react";

// Severity colors matching CSS variables
const SEVERITY_COLORS: Record<LogSeverity, string> = {
  DEBUG: "#6b7280",
  INFO: "#3b82f6",
  WARNING: "#f59e0b",
  ERROR: "#ef4444",
  CRITICAL: "#dc2626",
};

const SEVERITY_ICONS: Record<LogSeverity, React.ReactNode> = {
  DEBUG: <Bug className="w-5 h-5" />,
  INFO: <Info className="w-5 h-5" />,
  WARNING: <AlertTriangle className="w-5 h-5" />,
  ERROR: <AlertCircle className="w-5 h-5" />,
  CRITICAL: <Zap className="w-5 h-5" />,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  
  // Filter state
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [selectedSource, setSelectedSource] = useState<string>("");

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getLogStats({
        start_date: dateRange.start ? `${dateRange.start}T00:00:00` : undefined,
        end_date: dateRange.end ? `${dateRange.end}T23:59:59` : undefined,
        source: selectedSource || undefined,
      });
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedSource]);

  // Fetch sources for filter
  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(console.error);
  }, []);

  // Fetch stats when filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Prepare pie chart data
  const pieData = stats?.severity_breakdown.map(item => ({
    name: item.label,
    value: item.count,
    color: SEVERITY_COLORS[item.label as LogSeverity] || "#666",
  })) || [];

  // Prepare trend chart data
  const trendData = stats?.trend_data.map(item => ({
    date: format(new Date(item.date), "MMM dd"),
    count: item.count,
  })) || [];

  // Prepare source chart data
  const sourceData = stats?.source_breakdown || [];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-[var(--accent)]" />
            Analytics Dashboard
          </h1>
          <p className="text-[var(--muted)]">
            Log metrics and trends overview
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--muted)]" />
            <span className="text-sm text-[var(--muted)]">Date Range:</span>
          </div>
          
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="input w-auto"
          />
          <span className="text-[var(--muted)]">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="input w-auto"
          />

          <div className="flex items-center gap-2 ml-6">
            <Server className="w-5 h-5 text-[var(--muted)]" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="select w-auto"
            >
              <option value="">All Sources</option>
              {sources.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--muted)] text-sm">Total Logs</p>
                  <p className="text-3xl font-bold">{stats.total_logs.toLocaleString()}</p>
                </div>
                <Activity className="w-10 h-10 text-[var(--accent)] opacity-50" />
              </div>
            </div>
            
            {stats.severity_breakdown.slice(0, 4).map((item) => (
              <div key={item.label} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--muted)] text-sm">{item.label}</p>
                    <p className="text-2xl font-bold">{item.count.toLocaleString()}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {((item.count / stats.total_logs) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div style={{ color: SEVERITY_COLORS[item.label as LogSeverity] }}>
                    {SEVERITY_ICONS[item.label as LogSeverity]}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Trend Chart */}
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                Log Trend Over Time
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1a1a1a", 
                        border: "1px solid #2a2a2a",
                        borderRadius: "8px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Distribution Pie Chart */}
            <div className="card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[var(--accent)]" />
                Severity Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: "#666" }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1a1a1a", 
                        border: "1px solid #2a2a2a",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-[var(--accent)]" />
              Top Sources by Log Count
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis type="number" stroke="#666" fontSize={12} />
                  <YAxis 
                    dataKey="label" 
                    type="category" 
                    stroke="#666" 
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1a1a1a", 
                      border: "1px solid #2a2a2a",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

