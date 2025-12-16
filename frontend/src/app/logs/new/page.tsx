"use client";

/**
 * Create Log Page
 * 
 * React/Three.js Bridge:
 * Like adding a new mesh to the scene. We gather all the properties
 * (geometry type, material, position) through form inputs, then
 * "add" it to the scene (database) with a single action.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLog, getSources, LogSeverity } from "@/lib/api";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";

const SEVERITIES: LogSeverity[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

export default function CreateLogPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [useCustomSource, setUseCustomSource] = useState(false);
  
  const [form, setForm] = useState({
    message: "",
    severity: "INFO" as LogSeverity,
    source: "",
    customSource: "",
  });

  // Fetch existing sources for dropdown
  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const source = useCustomSource ? form.customSource : form.source;
    
    if (!form.message.trim()) {
      setError("Message is required");
      return;
    }
    
    if (!source.trim()) {
      setError("Source is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await createLog({
        message: form.message,
        severity: form.severity,
        source: source.trim(),
      });
      
      router.push("/logs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create log");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/logs")}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Create New Log</h1>
          <p className="text-[var(--muted)]">Add a new log entry to the system</p>
        </div>
      </div>

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="space-y-6">
          {/* Severity */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Severity Level
            </label>
            <div className="flex gap-2 flex-wrap">
              {SEVERITIES.map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, severity: sev }))}
                  className={`
                    px-4 py-2 rounded-lg border transition-all
                    ${form.severity === sev
                      ? `severity-${sev} border-current`
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                    }
                  `}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Source
            </label>
            
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!useCustomSource}
                  onChange={() => setUseCustomSource(false)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-sm">Select existing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={useCustomSource}
                  onChange={() => setUseCustomSource(true)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-sm">Enter new source</span>
              </label>
            </div>

            {useCustomSource ? (
              <input
                type="text"
                value={form.customSource}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  customSource: e.target.value 
                }))}
                placeholder="e.g., api-gateway, auth-service"
                className="input"
              />
            ) : (
              <select
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                className="select"
              >
                <option value="">Select a source...</option>
                {sources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Log Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter the log message..."
              rows={6}
              className="input font-mono text-sm"
              required
            />
            <p className="text-xs text-[var(--muted)] mt-1">
              {form.message.length} / 10,000 characters
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => router.push("/logs")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Log
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

