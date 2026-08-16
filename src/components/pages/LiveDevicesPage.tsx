"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Loader2, RefreshCw, Radio, BatteryFull, Wifi, WifiOff } from "lucide-react";

interface LiveDeviceRow {
  device_id: string;
  device_name: string | null;
  user_email: string | null;
  app_version: string | null;
  app_state: string | null;
  battery_percent: number | null;
  network_type: string | null;
  current_task: string | null;
  current_screen_app: string | null;
  gemini_live_connected: boolean | null;
  reconnect_count: number | null;
  last_heartbeat_at: string | null;
  online: boolean;
}

async function api(path: string) {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const STATE_COLOR: Record<string, string> = {
  Listening: "text-emerald-400 bg-emerald-500/15",
  Processing: "text-amber-400 bg-amber-500/15",
  Speaking: "text-sky-400 bg-sky-500/15",
  Idle: "text-muted-foreground bg-white/5",
};

export default function LiveDevicesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [devices, setDevices] = useState<LiveDeviceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api("/api/admin/myra/live-devices");
      setDevices(data.devices);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load live devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    load();
    // Auto-refresh - this is a "what's happening right now" view, a stale table defeats the point.
    const interval = setInterval(() => load(true), 15_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onlineCount = devices.filter((d) => d.online).length;

  return (
    <div
      className="min-h-screen text-foreground"
      style={{
        background:
          "radial-gradient(ellipse at 15% 10%, hsl(0 85% 55% / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(38 92% 55% / 0.14) 0%, transparent 55%)",
      }}
    >
      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/myra")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Live Devices</h1>
              <p className="text-sm text-muted-foreground">
                {onlineCount} online of {devices.length} reporting - refreshes every 15s
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass overflow-x-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              No devices have reported a heartbeat yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Device</th>
                  <th className="p-2 text-left">State</th>
                  <th className="p-2 text-left">Task</th>
                  <th className="p-2 text-left">Screen</th>
                  <th className="p-2 text-left">Battery</th>
                  <th className="p-2 text-left">Network</th>
                  <th className="p-2 text-left">Gemini Live</th>
                  <th className="p-2 text-right">Reconnects</th>
                  <th className="p-2 text-left">Version</th>
                  <th className="p-2 text-left">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.device_id} className="border-b border-border/60 hover:bg-white/5">
                    <td className="p-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${d.online ? "text-emerald-400" : "text-muted-foreground"}`}>
                        <Radio className="h-3 w-3" /> {d.online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">{d.user_email ?? "—"}</td>
                    <td className="p-2 font-mono text-xs">{d.device_name ?? d.device_id.slice(0, 12)}</td>
                    <td className="p-2">
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${STATE_COLOR[d.app_state ?? ""] ?? "bg-white/5 text-muted-foreground"}`}>
                        {d.app_state ?? "—"}
                      </span>
                    </td>
                    <td className="max-w-[160px] truncate p-2 text-muted-foreground" title={d.current_task ?? ""}>
                      {d.current_task ?? "—"}
                    </td>
                    <td className="p-2 text-muted-foreground">{d.current_screen_app ?? "—"}</td>
                    <td className="p-2">
                      <span className="inline-flex items-center gap-1">
                        <BatteryFull className="h-3.5 w-3.5 text-muted-foreground" />
                        {d.battery_percent != null ? `${d.battery_percent}%` : "—"}
                      </span>
                    </td>
                    <td className="p-2 text-muted-foreground">{d.network_type ?? "—"}</td>
                    <td className="p-2">
                      {d.gemini_live_connected == null ? (
                        "—"
                      ) : d.gemini_live_connected ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400"><Wifi className="h-3.5 w-3.5" /> Connected</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400"><WifiOff className="h-3.5 w-3.5" /> Disconnected</span>
                      )}
                    </td>
                    <td className="p-2 text-right">{d.reconnect_count ?? 0}</td>
                    <td className="p-2 font-mono text-xs text-muted-foreground">{d.app_version ?? "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground">{timeAgo(d.last_heartbeat_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  );
}
