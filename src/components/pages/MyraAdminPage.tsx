"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Search, Sparkles, Coins, KeyRound, Copy, Ban, RefreshCw, BadgeCheck, Smartphone, ShieldOff,
  Percent, UserCog,
} from "lucide-react";

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "elite", label: "Elite" },
  { value: "elite_pro", label: "Elite Pro" },
  { value: "membership", label: "Membership" },
];

const BADGE_OPTIONS = [
  { value: "clear", label: "Automatic (no override)" },
  { value: "red", label: "Red tick (admin)" },
  { value: "blue", label: "Blue tick (membership)" },
  { value: "yellow", label: "Yellow tick (premium)" },
  { value: "none", label: "No badge (force-hide)" },
];

interface MyraUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  myra_username: string | null;
  credits: number | null;
  subscription_type: string | null;
  subscription_status: string | null;
  subscription_expiry: string | null;
  badge_override: string | null;
  is_admin: boolean;
  plan: string | null;
  plan_status: string | null;
  credits_used: number | null;
  discount_percent: number | null;
  custom_name_enabled: boolean;
  custom_assistant_name: string | null;
}

interface MyraDeviceRow {
  device_id: string;
  device_name: string | null;
  manufacturer: string | null;
  model: string | null;
  android_version: string | null;
  app_version: string | null;
  last_login: string | null;
  is_blocked: boolean;
}

interface AccessKeyRow {
  id: string;
  key: string;
  plan: string;
  credits: number | null;
  duration_days: number | null;
  status: string;
  redeemed_by: string | null;
  redeemed_at: string | null;
  assigned_email: string | null;
  note: string | null;
  created_at: string;
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

const MyraAdminPage = () => {
  const router = useRouter();
  const { status } = useSession();

  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<MyraUserRow[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState(50);
  const [creditMode, setCreditMode] = useState<"add" | "set">("add");
  const [planValue, setPlanValue] = useState("premium");
  const [planDurationDays, setPlanDurationDays] = useState<string>("");
  const [savingCredits, setSavingCredits] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const [badgeValue, setBadgeValue] = useState("clear");
  const [savingBadge, setSavingBadge] = useState(false);

  const [discountValue, setDiscountValue] = useState(0);
  const [savingDiscount, setSavingDiscount] = useState(false);

  const [customNameEnabled, setCustomNameEnabled] = useState(false);
  const [customNameCurrent, setCustomNameCurrent] = useState<string | null>(null);
  const [savingCustomName, setSavingCustomName] = useState(false);

  const [devices, setDevices] = useState<MyraDeviceRow[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [blockingDeviceId, setBlockingDeviceId] = useState<string | null>(null);
  const [unlinkingDeviceId, setUnlinkingDeviceId] = useState<string | null>(null);

  const [keyPlan, setKeyPlan] = useState("premium");
  const [keyCount, setKeyCount] = useState(1);
  const [keyAssignedEmail, setKeyAssignedEmail] = useState("");
  const [keys, setKeys] = useState<AccessKeyRow[]>([]);
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);

  const loadUsers = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const data = await api(`/api/admin/myra/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setUsers(data.users);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load users");
    } finally {
      setSearching(false);
    }
  }, []);

  const loadDevices = useCallback(async (email: string) => {
    setLoadingDevices(true);
    try {
      const data = await api(`/api/admin/myra/devices?email=${encodeURIComponent(email)}`);
      setDevices(data.devices);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load devices");
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const data = await api("/api/admin/myra/access-keys");
      setKeys(data.keys);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load access keys");
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    (async () => {
      await Promise.all([loadUsers(""), loadKeys()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const applyCredits = async () => {
    if (!selectedEmail) return;
    setSavingCredits(true);
    try {
      await api("/api/admin/myra/credits", {
        method: "POST",
        body: JSON.stringify({ email: selectedEmail, amount: creditAmount, mode: creditMode }),
      });
      toast.success("Credits updated");
      await loadUsers(query);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update credits");
    } finally {
      setSavingCredits(false);
    }
  };

  const applyPlan = async () => {
    if (!selectedEmail) return;
    setSavingPlan(true);
    try {
      await api("/api/admin/myra/plan", {
        method: "POST",
        body: JSON.stringify({
          email: selectedEmail,
          plan: planValue,
          duration_days: planDurationDays ? Number(planDurationDays) : undefined,
        }),
      });
      toast.success("Plan updated");
      await loadUsers(query);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const applyDiscount = async () => {
    if (!selectedEmail) return;
    setSavingDiscount(true);
    try {
      await api("/api/admin/myra/discount", {
        method: "POST",
        body: JSON.stringify({ email: selectedEmail, discount_percent: discountValue }),
      });
      toast.success("Discount updated");
      await loadUsers(query);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update discount");
    } finally {
      setSavingDiscount(false);
    }
  };

  const applyCustomNameEligibility = async (enabled: boolean) => {
    if (!selectedEmail) return;
    setSavingCustomName(true);
    try {
      await api("/api/admin/myra/custom-name", {
        method: "POST",
        body: JSON.stringify({ email: selectedEmail, enabled }),
      });
      setCustomNameEnabled(enabled);
      toast.success(enabled ? "Custom Name enabled for this user" : "Custom Name disabled for this user");
      await loadUsers(query);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update Custom Name eligibility");
    } finally {
      setSavingCustomName(false);
    }
  };

  const applyBadge = async () => {
    if (!selectedEmail) return;
    setSavingBadge(true);
    try {
      await api("/api/admin/myra/badge", {
        method: "POST",
        body: JSON.stringify({ email: selectedEmail, badge: badgeValue }),
      });
      toast.success("Badge updated");
      await loadUsers(query);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update badge");
    } finally {
      setSavingBadge(false);
    }
  };

  const toggleDeviceBlock = async (device: MyraDeviceRow) => {
    setBlockingDeviceId(device.device_id);
    try {
      if (device.is_blocked) {
        await api("/api/admin/myra/devices/unblock", {
          method: "POST",
          body: JSON.stringify({ device_id: device.device_id }),
        });
        toast.success("Device unblocked");
      } else {
        await api("/api/admin/myra/devices/block", {
          method: "POST",
          body: JSON.stringify({ device_id: device.device_id, reason: `Blocked from admin panel for ${selectedEmail}` }),
        });
        toast.success("Device blocked — no account can log in from it again");
      }
      if (selectedEmail) await loadDevices(selectedEmail);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update device block");
    } finally {
      setBlockingDeviceId(null);
    }
  };

  const unlinkDeviceFromAccount = async (device: MyraDeviceRow) => {
    if (!confirm(`Unlink ${device.device_name || device.device_id}? A different Gmail account will then be able to log in on it.`)) return;
    setUnlinkingDeviceId(device.device_id);
    try {
      await api("/api/admin/myra/devices/unlink", {
        method: "POST",
        body: JSON.stringify({ device_id: device.device_id }),
      });
      toast.success("Device unlinked — any account can now log in on it");
      if (selectedEmail) await loadDevices(selectedEmail);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unlink device");
    } finally {
      setUnlinkingDeviceId(null);
    }
  };

  const generateKeys = async () => {
    const assignedEmail = keyAssignedEmail.trim();
    const qty = assignedEmail ? 1 : Math.max(1, Math.min(100, Math.floor(keyCount) || 1));
    setGeneratingKeys(true);
    try {
      await api("/api/admin/myra/access-keys", {
        method: "POST",
        body: JSON.stringify({ plan: keyPlan, count: qty, assigned_email: assignedEmail || undefined }),
      });
      toast.success(`${qty} access key${qty > 1 ? "s" : ""} generated`);
      setKeyAssignedEmail("");
      await loadKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate keys");
    } finally {
      setGeneratingKeys(false);
    }
  };

  const toggleKeyStatus = async (key: AccessKeyRow) => {
    const nextStatus = key.status === "disabled" ? "available" : "disabled";
    try {
      await api("/api/admin/myra/access-keys", {
        method: "PATCH",
        body: JSON.stringify({ key: key.key, status: nextStatus }),
      });
      toast.success(`Key ${nextStatus}`);
      await loadKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update key");
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Key copied");
  };

  if (loading) {
    return (
      <div className="license-admin flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="license-admin min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 10%, hsl(0 85% 55% / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(38 92% 55% / 0.14) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">MYRA Subscription Admin</h1>
              <p className="text-sm text-muted-foreground">Credits, plans, and access-key activation</p>
            </div>
          </div>
        </div>

        {/* User lookup */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass mb-8 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-3">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Find a user</h2>
              <p className="text-sm text-muted-foreground">Search by email — same account as the website and Android app.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="user@example.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") loadUsers(query); }}
            />
            <Button onClick={() => loadUsers(query)} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Role</th>
                  <th className="p-2 text-right">Credits</th>
                  <th className="p-2 text-left">Plan</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Expiry</th>
                  <th className="p-2 text-left">Badge</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => {
                      setSelectedEmail(u.email);
                      setBadgeValue(u.badge_override || "clear");
                      setDiscountValue(u.discount_percent || 0);
                      setCustomNameEnabled(u.custom_name_enabled);
                      setCustomNameCurrent(u.custom_assistant_name);
                      loadDevices(u.email);
                      toast.message(`Selected ${u.email}`);
                    }}
                    className={`cursor-pointer border-b border-border/60 hover:bg-muted/40 ${
                      selectedEmail === u.email ? "bg-primary/10" : ""
                    }`}
                  >
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.role}</td>
                    <td className="p-2 text-right">{u.credits ?? "—"}</td>
                    <td className="p-2">{u.subscription_type ?? "—"}</td>
                    <td className="p-2">{u.subscription_status ?? "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {u.subscription_expiry ? new Date(u.subscription_expiry).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-2 text-xs">
                      {u.badge_override ? (
                        <span className={
                          u.badge_override === "red" ? "text-red-400" :
                          u.badge_override === "blue" ? "text-blue-400" :
                          u.badge_override === "yellow" ? "text-amber-400" : "text-muted-foreground"
                        }>
                          {u.badge_override}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">auto</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Credits + plan actions */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3">
                <Coins className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold">Credits</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Selected: <span className="font-mono">{selectedEmail ?? "click a user above"}</span>
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={creditMode} onValueChange={(v) => setCreditMode(v as "add" | "set")}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add</SelectItem>
                    <SelectItem value="set">Set to</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                />
              </div>
              <Button onClick={applyCredits} disabled={!selectedEmail || savingCredits} className="w-full">
                {savingCredits ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply credits
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-violet-500/15 p-3">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold">Change plan</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Selected: <span className="font-mono">{selectedEmail ?? "click a user above"}</span>
            </p>
            <div className="space-y-3">
              <Select value={planValue} onValueChange={setPlanValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Duration in days (blank = plan default)"
                value={planDurationDays}
                onChange={(e) => setPlanDurationDays(e.target.value)}
              />
              <Button onClick={applyPlan} disabled={!selectedEmail || savingPlan} className="w-full">
                {savingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Activate plan
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Badge + device block */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3">
                <BadgeCheck className="h-5 w-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold">Chat verification badge</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Selected: <span className="font-mono">{selectedEmail ?? "click a user above"}</span>
            </p>
            <div className="space-y-3">
              <Select value={badgeValue} onValueChange={setBadgeValue}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BADGE_OPTIONS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Overrides the automatic badge (real admin status / membership plan) everywhere
                in chat: search, the people directory, conversation list, and chat headers.
              </p>
              <Button onClick={applyBadge} disabled={!selectedEmail || savingBadge} className="w-full">
                {savingBadge ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply badge
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-red-500/15 p-3">
                <ShieldOff className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-lg font-semibold">Block device</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Selected: <span className="font-mono">{selectedEmail ?? "click a user above"}</span> — every
              device this account has ever logged in from. A device is locked to the first account
              that ever logs into it (no other Gmail can log in there); <strong>Block</strong> stops the
              device outright, <strong>Unlink</strong> just frees it so a different account can log in.
            </p>
            <div className="max-h-64 space-y-2 overflow-auto">
              {loadingDevices && (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
              )}
              {!loadingDevices && devices.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {selectedEmail ? "No devices found for this account." : "Select a user to see their devices."}
                </p>
              )}
              {devices.map((d) => (
                <div key={d.device_id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{d.device_name || d.model || d.device_id}</p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">{d.device_id}</p>
                      {d.last_login && (
                        <p className="text-[10px] text-muted-foreground">
                          Last login {new Date(d.last_login).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unlinkingDeviceId === d.device_id}
                      onClick={() => unlinkDeviceFromAccount(d)}
                    >
                      {unlinkingDeviceId === d.device_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unlink"}
                    </Button>
                    <Button
                      size="sm"
                      variant={d.is_blocked ? "outline" : "destructive"}
                      disabled={blockingDeviceId === d.device_id}
                      onClick={() => toggleDeviceBlock(d)}
                    >
                      {blockingDeviceId === d.device_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : d.is_blocked ? "Unblock" : "Block"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Discount + Custom Name */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3">
                <Percent className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold">Discount coupon</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Selected: <span className="font-mono">{selectedEmail ?? "click a user above"}</span> —
              applied automatically the next time this user buys/renews any plan. 0 = no discount.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <Button onClick={applyDiscount} disabled={!selectedEmail || savingDiscount} className="w-full">
                {savingDiscount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Apply discount
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-2xl bg-fuchsia-500/15 p-3">
                <UserCog className="h-5 w-5 text-fuchsia-400" />
              </div>
              <h2 className="text-lg font-semibold">Custom Name add-on (₹1500 lifetime)</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Selected: <span className="font-mono">{selectedEmail ?? "click a user above"}</span> —
              once enabled, the user picks their own assistant name in the app.
              {customNameCurrent && (
                <> Currently set to <span className="font-mono">&quot;{customNameCurrent}&quot;</span>.</>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => applyCustomNameEligibility(true)}
                disabled={!selectedEmail || savingCustomName || customNameEnabled}
                className="flex-1"
              >
                {savingCustomName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {customNameEnabled ? "Enabled" : "Enable"}
              </Button>
              <Button
                variant="outline"
                onClick={() => applyCustomNameEligibility(false)}
                disabled={!selectedEmail || savingCustomName || !customNameEnabled}
                className="flex-1"
              >
                Disable
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Access keys */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/15 p-3">
              <KeyRound className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Access keys</h2>
              <p className="text-sm text-muted-foreground">Any user can redeem one of these in the Android app to activate the plan on their own account.</p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div>
              <Label className="mb-1 block text-xs">Plan</Label>
              <Select value={keyPlan} onValueChange={setKeyPlan}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Quantity</Label>
              <Input
                type="number"
                min={1}
                max={100}
                className="w-24"
                value={keyCount}
                disabled={!!keyAssignedEmail.trim()}
                onChange={(e) => setKeyCount(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Assign to email (optional)</Label>
              <Input
                type="email"
                placeholder="only this account can redeem"
                className="w-56"
                value={keyAssignedEmail}
                onChange={(e) => setKeyAssignedEmail(e.target.value)}
              />
            </div>
            <Button onClick={generateKeys} disabled={generatingKeys}>
              {generatingKeys ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate
            </Button>
            <Button variant="outline" onClick={loadKeys} disabled={loadingKeys}>
              <RefreshCw className={`h-4 w-4 ${loadingKeys ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="max-h-96 overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                  <th className="p-2 text-left">Key</th>
                  <th className="p-2 text-left">Plan</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Assigned to</th>
                  <th className="p-2 text-left">Redeemed</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-border/60">
                    <td className="p-2 font-mono text-xs">{k.key}</td>
                    <td className="p-2">{k.plan}</td>
                    <td className="p-2">
                      <span className={
                        k.status === "available" ? "text-emerald-400" :
                        k.status === "redeemed" ? "text-muted-foreground" : "text-red-400"
                      }>
                        {k.status}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{k.assigned_email ?? "anyone"}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {k.redeemed_at ? new Date(k.redeemed_at).toLocaleString() : "—"}
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyKey(k.key)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {k.status !== "redeemed" && (
                          <Button variant="ghost" size="icon" onClick={() => toggleKeyStatus(k)}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No access keys yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MyraAdminPage;
