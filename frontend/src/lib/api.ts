/**
 * API client for communicating with the FastAPI backend.
 * 
 * React/Three.js Bridge:
 * Think of this like a "loader" in Three.js - it fetches external resources
 * (data instead of textures/models) for your scene (components) to use.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

export type LogSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface Log {
  id: number;
  timestamp: string;
  message: string;
  severity: LogSeverity;
  source: string;
  metadata_json?: string;
  created_at: string;
  updated_at: string;
}

export interface LogListResponse {
  items: Log[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LogAggregation {
  label: string;
  count: number;
}

export interface LogTrend {
  date: string;
  count: number;
  severity?: string;
}

export interface LogStats {
  total_logs: number;
  severity_breakdown: LogAggregation[];
  source_breakdown: LogAggregation[];
  trend_data: LogTrend[];
  date_range: {
    start?: string;
    end?: string;
  };
}

export interface LogFilter {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  severity?: LogSeverity;
  source?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateLogData {
  message: string;
  severity: LogSeverity;
  source: string;
  timestamp?: string;
  metadata_json?: string;
}

export interface UpdateLogData {
  message?: string;
  severity?: LogSeverity;
  source?: string;
  metadata_json?: string;
}

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${API_PREFIX}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Build query string from filter object.
 */
function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// --- Log CRUD Operations ---

export async function getLogs(filters: LogFilter = {}): Promise<LogListResponse> {
  const query = buildQueryString(filters as Record<string, string | number | undefined>);
  return fetchAPI<LogListResponse>(`/logs${query}`);
}

export async function getLog(id: number): Promise<Log> {
  return fetchAPI<Log>(`/logs/${id}`);
}

export async function createLog(data: CreateLogData): Promise<Log> {
  return fetchAPI<Log>('/logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLog(id: number, data: UpdateLogData): Promise<Log> {
  return fetchAPI<Log>(`/logs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteLog(id: number): Promise<void> {
  await fetchAPI<void>(`/logs/${id}`, {
    method: 'DELETE',
  });
}

// --- Aggregation & Stats ---

export async function getLogStats(filters: {
  start_date?: string;
  end_date?: string;
  source?: string;
} = {}): Promise<LogStats> {
  const query = buildQueryString(filters);
  return fetchAPI<LogStats>(`/logs/stats${query}`);
}

export async function getLogTrend(filters: {
  start_date?: string;
  end_date?: string;
  severity?: LogSeverity;
  source?: string;
  group_by_severity?: boolean;
} = {}): Promise<LogTrend[]> {
  const query = buildQueryString(filters as Record<string, string | number | undefined>);
  return fetchAPI<LogTrend[]>(`/logs/trend${query}`);
}

export async function getSources(): Promise<string[]> {
  return fetchAPI<string[]>('/logs/sources');
}

// --- Export ---

export function getExportUrl(filters: {
  start_date?: string;
  end_date?: string;
  severity?: LogSeverity;
  source?: string;
} = {}): string {
  const query = buildQueryString(filters);
  return `${API_URL}${API_PREFIX}/logs/export${query}`;
}

