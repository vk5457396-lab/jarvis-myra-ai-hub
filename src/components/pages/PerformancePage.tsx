"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2, RefreshCw, Timer, Wrench, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const TOOLTIP_STYLE = { background: "hsl(222 35% 10%)", border: "1px solid hsl(222 25% 20%)", borderRadius: 12 };

interface ToolStat {
  tool_name: string;
  calls: number;
  failures: number;
  success_rate_pct: number | null;
  avg_duration_ms: number;
  max_duration_ms: number;
}

interface ToolFailure {
  id: string;
  user_email: string | null;
  device_id: string | null;
  tool_name: string | null;
  duration_ms: number;
  error_message: string | null;
  app_version: string | null;
  timestamp: string;
}

interface PerformanceSummary {
  tool_stats_7d: ToolStat[];
  recent_tool_failures: ToolFailure[];
  response_latency: {
    last_24h: { avg_ms: number | null; max_ms: number | null; count: number };
    last_7d: { avg_ms: number | null; max_ms: number | null; count: number };
    daily_trend_14d: { date: string; avg_ms: number; count: number }[];
  };
}

async function api(path: string) {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

const PerformancePage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const summary = await api("/api/admin/myra/performance");
      setData(summary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load performance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (loading || !data) {
    return (
      <div className="license-admin flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const latencyTrend = data.response_latency.daily_trend_14d.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    avg_ms: d.avg_ms,
  }));

  const card = "license-glass p-5";

  return (
    <div className="license-admin min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 15% 10%, hsl(0 85% 55% / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(38 92% 55% / 0.14) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/myra")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Performance</h1>
              <p className="text-sm text-muted-foreground">Voice-response latency and per-tool call volume, speed, and failures.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={async () => { setRefreshing(true); await load(true); setRefreshing(false); }}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {/* Response latency counters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={card}>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Timer className="h-4 w-4" /> Response latency — last 24h</div>
            <p className="text-2xl font-semibold">
              {data.response_latency.last_24h.avg_ms != null ? `${data.response_latency.last_24h.avg_ms} ms avg` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.response_latency.last_24h.max_ms != null ? `${data.response_latency.last_24h.max_ms} ms worst` : "No data"} · {data.response_latency.last_24h.count} turns
            </p>
          </div>
          <div className={card}>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Timer className="h-4 w-4" /> Response latency — last 7d</div>
            <p className="text-2xl font-semibold">
              {data.response_latency.last_7d.avg_ms != null ? `${data.response_latency.last_7d.avg_ms} ms avg` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.response_latency.last_7d.max_ms != null ? `${data.response_latency.last_7d.max_ms} ms worst` : "No data"} · {data.response_latency.last_7d.count} turns
            </p>
          </div>
        </div>

        <div className={`${card} mb-6`}>
          <h3 className="mb-4 text-sm font-semibold">Response Latency — Last 14 Days (how long MYRA takes to start replying)</h3>
          {latencyTrend.every((d) => !d.avg_ms) ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No response-latency data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={latencyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 20%)" />
                <XAxis dataKey="date" stroke="hsl(215 20% 65%)" fontSize={12} />
                <YAxis stroke="hsl(215 20% 65%)" fontSize={12} unit="ms" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="avg_ms" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tool call stats */}
        <div className={`${card} mb-6`}>
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold">Tool Calls — Last 7 Days</h3>
          </div>
          {data.tool_stats_7d.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No tool calls recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="p-2 text-left">Tool</th>
                    <th className="p-2 text-right">Calls</th>
                    <th className="p-2 text-right">Failures</th>
                    <th className="p-2 text-right">Success rate</th>
                    <th className="p-2 text-right">Avg latency</th>
                    <th className="p-2 text-right">Worst latency</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tool_stats_7d.map((t) => (
                    <tr key={t.tool_name} className="border-b border-border/60">
                      <td className="p-2 font-mono text-xs">{t.tool_name}</td>
                      <td className="p-2 text-right">{t.calls}</td>
                      <td className="p-2 text-right text-red-300/90">{t.failures || "—"}</td>
                      <td className="p-2 text-right">
                        <span className={
                          t.success_rate_pct == null ? "text-muted-foreground" :
                          t.success_rate_pct >= 95 ? "text-emerald-400" :
                          t.success_rate_pct >= 80 ? "text-amber-400" : "text-red-400"
                        }>
                          {t.success_rate_pct != null ? `${t.success_rate_pct}%` : "—"}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono text-xs">{t.avg_duration_ms} ms</td>
                      <td className="p-2 text-right font-mono text-xs text-muted-foreground">{t.max_duration_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent tool failures with full error */}
        <div className={card}>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold">Recent Tool Failures (last 7 days, up to 50)</h3>
          </div>
          {data.recent_tool_failures.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No tool failures in the last 7 days. 🎉</p>
          ) : (
            <div className="max-h-[32rem] space-y-2 overflow-auto">
              {data.recent_tool_failures.map((f) => (
                <div key={f.id} className="rounded-lg border border-border/60 p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">{f.tool_name ?? "Unknown"}</span>
                    <span>{new Date(f.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {f.user_email ?? "—"} · {f.device_id ?? "—"} · v{f.app_version ?? "—"} · {f.duration_ms} ms
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm text-red-300/90">{f.error_message ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
