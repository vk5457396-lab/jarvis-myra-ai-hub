"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, LogOut, Users, Wallet, TrendingUp, CheckCircle2, XCircle, Clock, ArrowDownToLine, Package, Bell
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import AdminProductsTab from "@/components/admin/AdminProductsTab";
import NotificationCenter from "@/components/admin/NotificationCenter";
import CreditMissedReferral from "@/components/admin/CreditMissedReferral";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  wallet_balance: number;
  referral_code: string;
  created_at: string;
}

interface Earning {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  purchase_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface WithdrawalRow {
  id: string;
  user_id: string;
  amount: number;
  method: "upi" | "bank";
  upi_id: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const COLORS = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

/** Full payout destination so the admin can send the money: UPI ID, or bank name / A/C / IFSC. */
const PayoutDetails = ({ w }: { w: WithdrawalRow }) =>
  w.method === "bank" ? (
    <div className="font-mono text-xs text-muted-foreground space-y-0.5">
      <p className="font-sans text-[10px] font-display font-bold tracking-wider text-sky-400">BANK</p>
      <p className="text-foreground">{w.bank_account_name}</p>
      <p>A/C {w.bank_account_number}</p>
      <p>IFSC {w.bank_ifsc}</p>
    </div>
  ) : (
    <div className="font-mono text-xs text-muted-foreground">
      <p className="font-sans text-[10px] font-display font-bold tracking-wider text-violet-400">UPI</p>
      <p className="break-all">{w.upi_id}</p>
    </div>
  );

const AdminDashboard = () => {
  const { status } = useSession();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allEarnings, setAllEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "withdrawals" | "products" | "notifications">("users");
  const router = useRouter();

  const loadOverview = async () => {
    const res = await fetch("/api/admin/overview");
    if (res.status === 401 || res.status === 403) { router.push("/dashboard"); return; }
    const json = await res.json();
    if (json.success) {
      setUsers(json.data.users);
      setAllEarnings(json.data.earnings);
      setWithdrawals(json.data.withdrawals);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const processWithdrawal = async (id: string, status: "completed" | "rejected") => {
    setProcessing(id);
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      toast.error(json.message || "Failed to update withdrawal");
    } else {
      toast.success(`Withdrawal ${status}!`);
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status, processed_at: new Date().toISOString() } : w));
      if (status === "rejected") {
        const overview = await (await fetch("/api/admin/overview")).json();
        if (overview.success) setUsers(overview.data.users);
      }
    }
    setProcessing(null);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalEarnings = allEarnings.reduce((s, e) => s + e.commission_amount, 0);
  const totalWallets = users.reduce((s, u) => s + u.wallet_balance, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");

  // Top earners for chart
  const earnerMap = new Map<string, number>();
  allEarnings.forEach(e => {
    earnerMap.set(e.referrer_id, (earnerMap.get(e.referrer_id) || 0) + e.commission_amount);
  });
  const topEarners = Array.from(earnerMap.entries())
    .map(([id, amount]) => ({
      name: users.find(u => u.id === id)?.full_name || "Unknown",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // Withdrawal status pie
  const statusCounts = [
    { name: "Pending", value: withdrawals.filter(w => w.status === "pending").length, color: "#f59e0b" },
    { name: "Completed", value: withdrawals.filter(w => w.status === "completed").length, color: "#10b981" },
    { name: "Rejected", value: withdrawals.filter(w => w.status === "rejected").length, color: "#ef4444" },
  ].filter(s => s.value > 0);

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.full_name || "Unknown";

  const stats = [
    { icon: Users, label: "Total Users", value: users.length.toString(), gradient: "from-violet-500 to-fuchsia-500", accentHsl: "263 70% 58%" },
    { icon: TrendingUp, label: "Total Commissions", value: `₹${totalEarnings}`, gradient: "from-emerald-500 to-cyan-500", accentHsl: "160 70% 50%" },
    { icon: Wallet, label: "Total in Wallets", value: `₹${totalWallets}`, gradient: "from-amber-500 to-orange-500", accentHsl: "38 92% 55%" },
    { icon: ArrowDownToLine, label: "Pending Withdrawals", value: pendingWithdrawals.length.toString(), gradient: "from-pink-500 to-rose-500", accentHsl: "330 80% 60%" },
  ];

  return (
    <div className="min-h-screen">
      <section className="pt-8 pb-16 md:pt-12 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">Manage users, earnings & withdrawals</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" className="rounded-xl border-white/10 gap-2">
              <LogOut size={16} /> Logout
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                  <div className="absolute inset-[-200%]" style={{ background: `conic-gradient(from 0deg, hsla(${stat.accentHsl}, 0.3), transparent 50%, hsla(${stat.accentHsl}, 0.3))` }} />
                </div>
                <div className="relative rounded-[calc(1rem-1px)] m-px p-5" style={{ background: `linear-gradient(165deg, hsla(${stat.accentHsl}, 0.06) 0%, hsla(220,20%,6%,0.97) 100%)` }}>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`} style={{ boxShadow: `0 0 20px hsla(${stat.accentHsl}, 0.3)` }}>
                    <stat.icon size={18} className="text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground font-display tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-display font-black text-foreground mt-1">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
            {/* Top Earners Bar Chart */}
            {topEarners.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="relative rounded-2xl overflow-hidden h-full">
                  <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                    <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(160,70%,50%,0.3), transparent 50%, hsla(160,70%,50%,0.3))" }} />
                  </div>
                  <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(160,70%,50%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                    <h3 className="font-display font-bold text-foreground mb-4">Top Earners</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topEarners}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                          <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                          <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Withdrawal Status Pie */}
            {statusCounts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="relative rounded-2xl overflow-hidden h-full">
                  <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                    <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(263,70%,58%,0.3), transparent 50%, hsla(263,70%,58%,0.3))" }} />
                  </div>
                  <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(263,70%,58%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                    <h3 className="font-display font-bold text-foreground mb-4">Withdrawal Status</h3>
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusCounts} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {statusCounts.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <CreditMissedReferral onCredited={loadOverview} />

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                activeTab === "users" ? "bg-gradient-to-r from-primary to-secondary text-white" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={14} className="inline mr-2" /> All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                activeTab === "withdrawals" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownToLine size={14} className="inline mr-2" /> Withdrawals ({withdrawals.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                activeTab === "products" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package size={14} className="inline mr-2" /> Products
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all ${
                activeTab === "notifications" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bell size={14} className="inline mr-2" /> Notifications
            </button>
          </div>


          {activeTab === "products" && <AdminProductsTab />}
          {activeTab === "notifications" && <NotificationCenter />}

          {/* Users Table */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                  <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(188,100%,50%,0.2), transparent 50%, hsla(188,100%,50%,0.2))" }} />
                </div>
                <div className="relative rounded-[calc(1rem-1px)] m-px p-4 md:p-6" style={{ background: "linear-gradient(165deg, hsla(188,100%,50%,0.03) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                  {/* Below md: a dense multi-column table just gets an endless horizontal
                      scrollbar on a phone-width screen - stacked cards instead. */}
                  {/* max-h + overflow-y-auto is load-bearing, not cosmetic: `users` is the
                      FULL unpaginated list (thousands of rows in production). Without a height
                      cap here, this subtree's real layout height scales with the row count -
                      at ~6,700 users that's on the order of 900,000px of DOM, which desktop-class
                      hardware can still limp through compositing but real mobile GPUs cannot,
                      corrupting the paint for most of the page (discovered 2026-09-17: a phone
                      showed almost everything blank/invisible below the very top of the screen). */}
                  <div className="md:hidden max-h-[70vh] overflow-y-auto space-y-3">
                    {users.map(u => {
                      const userEarnings = allEarnings.filter(e => e.referrer_id === u.id).reduce((s, e) => s + e.commission_amount, 0);
                      return (
                        <div key={u.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-foreground truncate">{u.full_name || "—"}</p>
                            <span className="text-xs text-muted-foreground shrink-0">{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">{u.email}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <span className="text-emerald-400 font-bold">₹{u.wallet_balance} <span className="text-muted-foreground font-normal text-xs">wallet</span></span>
                            <span className="text-amber-400 font-bold">₹{userEarnings} <span className="text-muted-foreground font-normal text-xs">earnings</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden md:block max-h-[70vh] overflow-y-auto overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">USER</th>
                          <th className="text-left py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">EMAIL</th>
                          <th className="text-right py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">WALLET</th>
                          <th className="text-right py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">EARNINGS</th>
                          <th className="text-center py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">JOINED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => {
                          const userEarnings = allEarnings.filter(e => e.referrer_id === u.id).reduce((s, e) => s + e.commission_amount, 0);
                          return (
                            <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-3 font-medium text-foreground">{u.full_name || "—"}</td>
                              <td className="py-3 px-3 text-muted-foreground">{u.email}</td>
                              <td className="py-3 px-3 text-right text-emerald-400 font-bold">₹{u.wallet_balance}</td>
                              <td className="py-3 px-3 text-right text-amber-400 font-bold">₹{userEarnings}</td>
                              <td className="py-3 px-3 text-center text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Withdrawals Table */}
          {activeTab === "withdrawals" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                  <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(263,70%,58%,0.2), transparent 50%, hsla(263,70%,58%,0.2))" }} />
                </div>
                <div className="relative rounded-[calc(1rem-1px)] m-px p-4 md:p-6" style={{ background: "linear-gradient(165deg, hsla(263,70%,58%,0.03) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No withdrawal requests yet.</div>
                  ) : (
                    <>
                      {/* Below md: stacked cards instead of a 6-column table forced into a
                          horizontal scrollbar. max-h + overflow-y-auto for the same reason as
                          the users list above - unpaginated, so height must be capped, not
                          allowed to scale with row count. */}
                      <div className="md:hidden max-h-[70vh] overflow-y-auto space-y-3">
                        {withdrawals.map(w => (
                          <div key={w.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-foreground truncate">{getUserName(w.user_id)}</p>
                              <span className={`inline-flex items-center gap-1 text-xs font-display font-bold px-2 py-1 rounded-lg shrink-0 ${
                                w.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                                w.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                "bg-amber-500/20 text-amber-400"
                              }`}>
                                {w.status === "completed" ? <CheckCircle2 size={12} /> : w.status === "rejected" ? <XCircle size={12} /> : <Clock size={12} />}
                                {w.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-2"><PayoutDetails w={w} /></div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-violet-400 font-bold text-sm">₹{w.amount}</span>
                              <span className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</span>
                            </div>
                            {w.status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  onClick={() => processWithdrawal(w.id, "completed")}
                                  disabled={processing === w.id}
                                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs h-8 px-3 flex-1"
                                >
                                  <CheckCircle2 size={12} className="mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => processWithdrawal(w.id, "rejected")}
                                  disabled={processing === w.id}
                                  variant="outline"
                                  className="rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3 flex-1"
                                >
                                  <XCircle size={12} className="mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block max-h-[70vh] overflow-y-auto overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">USER</th>
                              <th className="text-left py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">PAY TO</th>
                              <th className="text-right py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">AMOUNT</th>
                              <th className="text-center py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">STATUS</th>
                              <th className="text-center py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">DATE</th>
                              <th className="text-center py-3 px-3 text-muted-foreground font-display text-xs tracking-wider">ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {withdrawals.map(w => (
                              <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-3 px-3 font-medium text-foreground">{getUserName(w.user_id)}</td>
                                <td className="py-3 px-3"><PayoutDetails w={w} /></td>
                                <td className="py-3 px-3 text-right text-violet-400 font-bold">₹{w.amount}</td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`inline-flex items-center gap-1 text-xs font-display font-bold px-2 py-1 rounded-lg ${
                                    w.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                                    w.status === "rejected" ? "bg-red-500/20 text-red-400" :
                                    "bg-amber-500/20 text-amber-400"
                                  }`}>
                                    {w.status === "completed" ? <CheckCircle2 size={12} /> : w.status === "rejected" ? <XCircle size={12} /> : <Clock size={12} />}
                                    {w.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center text-muted-foreground text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                                <td className="py-3 px-3 text-center">
                                  {w.status === "pending" ? (
                                    <div className="flex gap-2 justify-center">
                                      <Button
                                        size="sm"
                                        onClick={() => processWithdrawal(w.id, "completed")}
                                        disabled={processing === w.id}
                                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs h-8 px-3"
                                      >
                                        <CheckCircle2 size={12} className="mr-1" /> Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => processWithdrawal(w.id, "rejected")}
                                        disabled={processing === w.id}
                                        variant="outline"
                                        className="rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                                      >
                                        <XCircle size={12} className="mr-1" /> Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
