"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Bell, Send, Loader2, RefreshCw, Trash2, RotateCcw, Users, Crown, Gift,
  Smartphone, User as UserIcon, Image as ImageIcon, Link2,
} from "lucide-react";

type Target = "all" | "premium" | "free" | "lifetime" | "device" | "user";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  deep_link: string | null;
  action: string | null;
  custom_url: string | null;
  notification_type: string;
  priority: string;
  target: string;
  target_value: string | null;
  scheduled_at: string | null;
  status: string;
  success_count: number;
  failure_count: number;
  error_message: string | null;
  created_at: string;
}

const TARGETS: { value: Target; label: string; icon: typeof Users }[] = [
  { value: "all", label: "All Users", icon: Users },
  { value: "premium", label: "Premium Users", icon: Crown },
  { value: "free", label: "Free Users", icon: Gift },
  { value: "lifetime", label: "Lifetime Users", icon: Crown },
  { value: "device", label: "One Device", icon: Smartphone },
  { value: "user", label: "One User", icon: UserIcon },
];

const emptyForm = {
  title: "",
  body: "",
  image_url: "",
  deep_link: "",
  action: "",
  custom_url: "",
  notification_type: "general",
  priority: "high",
  target: "all" as Target,
  device_id: "",
  user_id: "",
  scheduled_at: "",
};

const statusStyles: Record<string, string> = {
  sent: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  partial: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  failed: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  scheduled: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  sending: "text-muted-foreground border-white/15 bg-white/5",
  pending: "text-muted-foreground border-white/15 bg-white/5",
};

const NotificationCenter = () => {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notification/history?limit=50");
    const json = await res.json();
    if (!json.success) toast.error("Could not load notification history");
    setHistory((json.data?.notifications as NotificationRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const postNotification = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/notification/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* non JSON response */ }
    if (!json) throw new Error("The notification server returned an invalid response.");
    if (!res.ok || !json.success) throw new Error(json.message || "Failed to send notification.");
    return json.data;
  };

  const buildPayload = (source: typeof emptyForm) => {
    const payload: Record<string, unknown> = {
      title: source.title.trim(),
      body: source.body.trim(),
      notification_type: source.notification_type,
      priority: source.priority,
      target: source.target,
    };
    if (source.image_url.trim()) payload.image_url = source.image_url.trim();
    if (source.deep_link.trim()) payload.deep_link = source.deep_link.trim();
    if (source.action.trim()) payload.action = source.action.trim();
    if (source.custom_url.trim()) payload.custom_url = source.custom_url.trim();
    if (source.scheduled_at) payload.scheduled_at = new Date(source.scheduled_at).toISOString();
    if (source.target === "device") payload.device_id = source.device_id.trim();
    if (source.target === "user") payload.user_id = source.user_id.trim();
    return payload;
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (form.target === "device" && !form.device_id.trim()) {
      toast.error("Device ID is required");
      return;
    }
    if (form.target === "user" && !form.user_id.trim()) {
      toast.error("User ID is required");
      return;
    }

    setSending(true);
    try {
      const data = await postNotification(buildPayload(form));
      toast.success(
        data?.scheduled
          ? "Notification scheduled"
          : `Delivered to ${data?.success_count ?? 0} device(s)`
      );
      setForm(emptyForm);
      loadHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (row: NotificationRow) => {
    try {
      const data = await postNotification(
        buildPayload({
          ...emptyForm,
          title: row.title,
          body: row.body,
          image_url: row.image_url ?? "",
          deep_link: row.deep_link ?? "",
          action: row.action ?? "",
          custom_url: row.custom_url ?? "",
          notification_type: row.notification_type,
          priority: row.priority,
          target: row.target as Target,
          device_id: row.target === "device" ? row.target_value ?? "" : "",
          user_id: row.target === "user" ? row.target_value ?? "" : "",
        })
      );
      toast.success(`Retried — delivered to ${data?.success_count ?? 0} device(s)`);
      loadHistory();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Retry failed");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notification/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Could not delete this entry"); return; }
    setHistory((h) => h.filter((n) => n.id !== id));
    toast.success("History entry deleted");
  };

  const stats = useMemo(() => ({
    total: history.length,
    delivered: history.reduce((s, n) => s + n.success_count, 0),
    failed: history.reduce((s, n) => s + n.failure_count, 0),
  }), [history]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Campaigns", value: stats.total, color: "hsla(188,100%,50%,0.25)" },
          { label: "Delivered", value: stats.delivered, color: "hsla(150,80%,45%,0.25)" },
          { label: "Failed", value: stats.failed, color: "hsla(350,85%,60%,0.25)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
            style={{ background: `linear-gradient(165deg, ${s.color} 0%, hsla(220,20%,6%,0.9) 100%)` }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Composer */}
        <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-3"><Bell className="h-5 w-5 text-primary" /></div>
            <div>
              <h2 className="font-display text-lg font-bold">Notification Center</h2>
              <p className="text-sm text-muted-foreground">Push messages straight to MYRA Android users.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TARGETS.map((t) => {
                  const Icon = t.icon;
                  const active = form.target === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("target", t.value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                        active
                          ? "border-primary/50 bg-primary/15 text-foreground"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon size={14} /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {form.target === "device" && (
              <div className="space-y-2">
                <Label htmlFor="device_id">Device ID</Label>
                <Input id="device_id" value={form.device_id} onChange={(e) => set("device_id", e.target.value)} placeholder="android-device-id" />
              </div>
            )}
            {form.target === "user" && (
              <div className="space-y-2">
                <Label htmlFor="user_id">User ID</Label>
                <Input id="user_id" value={form.user_id} onChange={(e) => set("user_id", e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" maxLength={120} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="MYRA 2.0 is here" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" rows={3} maxLength={1000} value={form.body} onChange={(e) => set("body", e.target.value)} placeholder="Tap to see what's new in this update." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="image_url"><ImageIcon size={12} className="mr-1 inline" />Image URL</Label>
                <Input id="image_url" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deep_link"><Link2 size={12} className="mr-1 inline" />Deep Link</Label>
                <Input id="deep_link" value={form.deep_link} onChange={(e) => set("deep_link", e.target.value)} placeholder="myra://home" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Input id="action" value={form.action} onChange={(e) => set("action", e.target.value)} placeholder="open_update" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_url">Custom URL</Label>
                <Input id="custom_url" value={form.custom_url} onChange={(e) => set("custom_url", e.target.value)} placeholder="https://codeninjavik.in" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.notification_type} onValueChange={(v) => set("notification_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["general", "update", "promo", "alert", "license"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Schedule (optional)</Label>
              <Input id="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={(e) => set("scheduled_at", e.target.value)} />
            </div>

            <Button onClick={handleSend} disabled={sending} className="w-full font-display font-bold">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {form.scheduled_at ? "Schedule Notification" : "Send Notification"}
            </Button>
          </div>
        </div>

        {/* Preview + history */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-xl">
            <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Live Preview</p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/20 p-2"><Bell className="h-4 w-4 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{form.title || "Notification title"}</p>
                  <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">{form.body || "Your message preview appears here."}</p>
                  {form.image_url && (
                    <img src={form.image_url} alt="Notification preview" className="mt-3 max-h-32 w-full rounded-lg object-cover" loading="lazy" />
                  )}
                  <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">MYRA AI • now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-background/50 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">History</p>
              <Button variant="ghost" size="sm" onClick={loadHistory} disabled={loading}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : history.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No notifications sent yet.</p>
            ) : (
              <ul className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {history.map((n) => (
                  <li key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusStyles[n.status] ?? statusStyles.pending}`}>
                        {n.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{n.target}</span>
                      <span className="text-emerald-400">✓ {n.success_count}</span>
                      <span className="text-rose-400">✕ {n.failure_count}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      <div className="ml-auto flex gap-1">
                        {(n.status === "failed" || n.failure_count > 0) && (
                          <button onClick={() => handleRetry(n)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground" aria-label="Retry notification">
                            <RotateCcw size={13} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(n.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400" aria-label="Delete history entry">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationCenter;