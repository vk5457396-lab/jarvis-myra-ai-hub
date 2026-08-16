"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Copy, ClipboardCopy } from "lucide-react";

interface AutomationErrorRow {
  id: string;
  user_email: string | null;
  device_id: string | null;
  failure_type: string;
  task_description: string | null;
  tool_name: string | null;
  error_message: string | null;
  app_version: string | null;
  context: unknown;
  timestamp: string;
}

async function api(path: string) {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

const FAILURE_TYPE_COLOR: Record<string, string> = {
  fake_success: "bg-red-500/15 text-red-400",
  max_steps_reached: "bg-amber-500/15 text-amber-400",
  tool_error: "bg-orange-500/15 text-orange-400",
  llm_failure: "bg-fuchsia-500/15 text-fuchsia-400",
  reconnect: "bg-sky-500/15 text-sky-400",
  crash: "bg-red-600/20 text-red-300",
};

/** Plain-text block for one failure - readable enough to paste straight into a bug report or a
 *  chat message, rather than raw JSON. */
function formatErrorRow(e: AutomationErrorRow): string {
  const lines = [
    `[${new Date(e.timestamp).toLocaleString()}] ${e.failure_type}`,
    `User: ${e.user_email ?? "—"}`,
    `Device: ${e.device_id ?? "—"}`,
    `App version: ${e.app_version ?? "—"}`,
    `Tool: ${e.tool_name ?? "—"}`,
    `Task: ${e.task_description ?? "—"}`,
    `Error: ${e.error_message ?? "—"}`,
  ];
  if (e.context != null) {
    lines.push(`Context: ${JSON.stringify(e.context)}`);
  }
  return lines.join("\n");
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Could not copy - clipboard access was blocked.");
  }
}

export default function DiagnosticsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [errors, setErrors] = useState<AutomationErrorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const qs = filter.trim() ? `?failure_type=${encodeURIComponent(filter.trim())}` : "";
      const data = await api(`/api/admin/myra/diagnostics${qs}`);
      setErrors(data.errors);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load diagnostics");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Client-side, on top of the already-loaded (server-side failure_type-filtered) list - lets
  // "copy just this one user's errors" work without a round trip, since the list is small enough
  // to already be in memory.
  const visibleErrors = userFilter.trim()
    ? errors.filter((e) => e.user_email?.toLowerCase().includes(userFilter.trim().toLowerCase()))
    : errors;

  const copyAllVisible = () => {
    if (visibleErrors.length === 0) {
      toast.error("Nothing to copy.");
      return;
    }
    const text = visibleErrors.map(formatErrorRow).join("\n\n---\n\n");
    copyToClipboard(
      text,
      `Copied ${visibleErrors.length} failure${visibleErrors.length === 1 ? "" : "s"}${userFilter.trim() ? ` for ${userFilter.trim()}` : ""}.`
    );
  };

  return (
    <div
      className="min-h-screen text-foreground"
      style={{
        background:
          "radial-gradient(ellipse at 15% 10%, hsl(0 85% 55% / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(38 92% 55% / 0.14) 0%, transparent 55%)",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/myra")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Diagnostics</h1>
              <p className="text-sm text-muted-foreground">
                Automation failures - max steps reached, tool errors, and false "it worked" claims.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Filter by failure_type (e.g. fake_success)"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") load(); }}
              className="w-56"
            />
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              Filter
            </Button>
            <Input
              placeholder="Filter by user email"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-56"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button onClick={copyAllVisible} disabled={visibleErrors.length === 0}>
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy {userFilter.trim() ? "user's" : "all"} logs ({visibleErrors.length})
            </Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass overflow-x-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : visibleErrors.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {errors.length === 0 ? "No automation failures reported yet." : "No failures match this user filter."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="p-2 text-left">When</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Tool</th>
                  <th className="p-2 text-left">Task</th>
                  <th className="p-2 text-left">Error</th>
                  <th className="p-2 text-left">Version</th>
                  <th className="p-2" />
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {visibleErrors.map((e) => (
                  <Fragment key={e.id}>
                    <tr className="border-b border-border/60 hover:bg-white/5">
                      <td className="whitespace-nowrap p-2 text-xs text-muted-foreground">
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium ${FAILURE_TYPE_COLOR[e.failure_type] ?? "bg-white/5 text-muted-foreground"}`}>
                          <AlertTriangle className="h-3 w-3" /> {e.failure_type}
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground">{e.user_email ?? "—"}</td>
                      <td className="p-2 font-mono text-xs">{e.tool_name ?? "—"}</td>
                      <td className="max-w-[200px] truncate p-2 text-muted-foreground" title={e.task_description ?? ""}>
                        {e.task_description ?? "—"}
                      </td>
                      <td className="max-w-[240px] truncate p-2 text-red-300/90" title={e.error_message ?? ""}>
                        {e.error_message ?? "—"}
                      </td>
                      <td className="p-2 font-mono text-xs text-muted-foreground">{e.app_version ?? "—"}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => copyToClipboard(formatErrorRow(e), "Copied 1 failure.")}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy this failure"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="p-2 text-right">
                        {e.context != null && (
                          <button
                            onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expandedId === e.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === e.id && e.context != null && (
                      <tr className="border-b border-border/60 bg-black/20">
                        <td colSpan={9} className="p-3">
                          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/30 p-3 text-xs text-muted-foreground">
                            {JSON.stringify(e.context, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  );
}
