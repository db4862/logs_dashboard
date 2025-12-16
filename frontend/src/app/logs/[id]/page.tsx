"use client";

/**
 * Log Detail Page
 * 
 * React/Three.js Bridge:
 * Like inspecting a single mesh in detail. We can view its properties
 * (geometry, material) and modify them. The useParams hook is similar
 * to raycasting - it identifies which object we clicked on.
 */

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getLog, updateLog, deleteLog, Log, LogSeverity } from "@/lib/api";
import SeverityBadge from "@/components/SeverityBadge";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2, 
  Edit, 
  X,
  Clock,
  Server,
  AlertTriangle
} from "lucide-react";

const SEVERITIES: LogSeverity[] = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];

export default function LogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [log, setLog] = useState<Log | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    message: "",
    severity: "INFO" as LogSeverity,
    source: "",
  });

  // Fetch log on mount
  useEffect(() => {
    async function fetchLog() {
      try {
        const data = await getLog(id);
        setLog(data);
        setEditForm({
          message: data.message,
          severity: data.severity,
          source: data.source,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch log");
      } finally {
        setLoading(false);
      }
    }

    fetchLog();
  }, [id]);

  // Handle save
  const handleSave = async () => {
    if (!log) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updated = await updateLog(id, editForm);
      setLog(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update log");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    
    try {
      await deleteLog(id);
      router.push("/logs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete log");
      setDeleting(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (log) {
      setEditForm({
        message: log.message,
        severity: log.severity,
        source: log.source,
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="card text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Log Not Found</h2>
        <p className="text-[var(--muted)] mb-4">
          {error || "The requested log entry does not exist."}
        </p>
        <button onClick={() => router.push("/logs")} className="btn btn-primary">
          Back to Logs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/logs")}
          className="flex items-center gap-2 text-[var(--muted)] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Logs
        </button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="btn btn-secondary">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-danger"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="card bg-red-900/20 border-red-800 text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Log Details Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <span className="text-[var(--muted)]">Log #{log.id}</span>
            {isEditing ? (
              <select
                value={editForm.severity}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  severity: e.target.value as LogSeverity 
                }))}
                className="select w-auto"
              >
                {SEVERITIES.map(sev => (
                  <option key={sev} value={sev}>{sev}</option>
                ))}
              </select>
            ) : (
              <SeverityBadge severity={log.severity} size="lg" />
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Timestamp */}
          <div className="flex items-start gap-4">
            <Clock className="w-5 h-5 text-[var(--muted)] mt-0.5" />
            <div>
              <h3 className="text-sm text-[var(--muted)] mb-1">Timestamp</h3>
              <p className="font-mono">
                {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS")}
              </p>
            </div>
          </div>

          {/* Source */}
          <div className="flex items-start gap-4">
            <Server className="w-5 h-5 text-[var(--muted)] mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm text-[var(--muted)] mb-1">Source</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.source}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    source: e.target.value 
                  }))}
                  className="input"
                />
              ) : (
                <p>{log.source}</p>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="text-sm text-[var(--muted)] mb-2">Message</h3>
            {isEditing ? (
              <textarea
                value={editForm.message}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  message: e.target.value 
                }))}
                rows={6}
                className="input font-mono text-sm"
              />
            ) : (
              <div className="bg-[var(--background)] rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                {log.message}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-6 border-t border-[var(--border)] text-sm text-[var(--muted)]">
            <div className="flex gap-8">
              <div>
                <span>Created: </span>
                <span className="text-white">
                  {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                </span>
              </div>
              <div>
                <span>Updated: </span>
                <span className="text-white">
                  {format(new Date(log.updated_at), "yyyy-MM-dd HH:mm:ss")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Log?</h2>
            <p className="text-[var(--muted)] mb-6">
              Are you sure you want to delete this log entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn btn-danger"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

