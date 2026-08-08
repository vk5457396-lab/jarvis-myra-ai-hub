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
  ArrowLeft, Loader2, Search, Sparkles, Coins, KeyRound, Copy, Ban, RefreshCw,
} from "lucide-react";

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "premium", label: "Premium" },
  { value: "elite", label: "Elite" },
  { value: "elite_pro", label: "Elite Pro" },
  { value: "membership", label: "Membership" },
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
  plan: string | null;
  plan_status: string | null;
  credits_used: number | null;
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
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => { setSelectedEmail(u.email); toast.message(`Selected ${u.email}`); }}
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
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No users found.</td></tr>
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
