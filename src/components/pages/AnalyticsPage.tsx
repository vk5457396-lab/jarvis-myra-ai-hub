"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, RefreshCw, Users, Smartphone, Radio, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const COLORS = ["#8b5cf6", "#06b6d4", "#a78bfa", "#ef4444", "#f59e0b", "#22d3ee"];
const TOOLTIP_STYLE = { background: "hsl(222 35% 10%)", border: "1px solid hsl(222 25% 20%)", borderRadius: 12 };

interface AnalyticsSummary {
  users: { total: number };
  devices: { total: number; online_now: number; gemini_live_connected_now: number };
  automation: {
    errors_24h: number;
    errors_7d: number;
    by_type_7d: { failure_type: string; count: number }[];
    daily_trend_14d: { date: string; count: number }[];
    top_affected_users_7d: { user_email: string | null; count: number }[];
  };
  plans: { plan: string; count: number }[];
}

async function api(path: string) {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

const AnalyticsPage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const summary = await api("/api/admin/myra/analytics");
      setData(summary);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load analytics");
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

  const dailyTrend = data.automation.daily_trend_14d.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    count: d.count,
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
              <h1 className="text-2xl font-semibold">Analytics</h1>
              <p className="text-sm text-muted-foreground">Users, devices, plan mix, and automation health.</p>
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

        {/* Top-line counters */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className={card}>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4" /> Total users</div>
            <p className="text-2xl font-semibold">{data.users.total}</p>
          </div>
          <div className={card}>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Smartphone className="h-4 w-4" /> Devices ever seen</div>
            <p className="text-2xl font-semibold">{data.devices.total}</p>
          </div>
          <div className={card}>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Radio className="h-4 w-4 text-emerald-400" /> Online now</div>
            <p className="text-2xl font-semibold">{data.devices.online_now}</p>
            <p className="text-xs text-muted-foreground">{data.devices.gemini_live_connected_now} with Gemini Live connected</p>
          </div>
          <div className={card}>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 text-amber-400" /> Failures 24h / 7d</div>
            <p className="text-2xl font-semibold">{data.automation.errors_24h} <span className="text-sm text-muted-foreground">/ {data.automation.errors_7d}</span></p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className={card}>
            <h3 className="mb-4 text-sm font-semibold">Plan Distribution</h3>
            {data.plans.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No profiles yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.plans.map((p) => ({ name: p.plan, value: p.count }))} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={4}>
                    {data.plans.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={card}>
            <h3 className="mb-4 text-sm font-semibold">Failure Types (last 7 days)</h3>
            {data.automation.by_type_7d.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No automation failures in the last 7 days. 🎉</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.automation.by_type_7d.map((t) => ({ name: t.failure_type, count: t.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(215 20% 65%)" fontSize={11} />
                  <YAxis stroke="hsl(215 20% 65%)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`${card} lg:col-span-2`}>
            <h3 className="mb-4 text-sm font-semibold">Automation Failures — Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 20%)" />
                <XAxis dataKey="date" stroke="hsl(215 20% 65%)" fontSize={12} />
                <YAxis stroke="hsl(215 20% 65%)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <h3 className="mb-4 text-sm font-semibold">Most Affected Users (last 7 days)</h3>
            {data.automation.top_affected_users_7d.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No one has hit a failure in the last 7 days.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                      <th className="p-2 text-left">User</th>
                      <th className="p-2 text-right">Failures (7d)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.automation.top_affected_users_7d.map((u, i) => (
                      <tr key={i} className="border-b border-border/60">
                        <td className="p-2">{u.user_email ?? "—"}</td>
                        <td className="p-2 text-right font-mono">{u.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
