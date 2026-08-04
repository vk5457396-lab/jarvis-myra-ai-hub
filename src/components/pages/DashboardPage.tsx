"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Wallet, Users, Copy, LogOut, TrendingUp, Gift, Shield,
  ArrowDownToLine, IndianRupee, Clock, CheckCircle2, XCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  referral_code: string;
  wallet_balance: number;
  created_at: string;
}

interface Earning {
  id: string;
  purchase_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  upi_id: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Check if admin — redirect to admin dashboard
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        router.push("/admin");
        return;
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profileData) setProfile(profileData as Profile);

      const { data: earningsData } = await supabase.from("referral_earnings").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
      if (earningsData) setEarnings(earningsData as Earning[]);

      const { data: withdrawalsData } = await supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (withdrawalsData) setWithdrawals(withdrawalsData as Withdrawal[]);

      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", user.id);
      setReferralCount(count || 0);

      setLoading(false);
    };
    loadData();
  }, [router]);

  const copyReferralLink = () => {
    if (!profile) return;
    const link = `${window.location.origin}/pricing?ref=${profile.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const handleWithdraw = async () => {
    if (!upiId.trim()) { toast.error("UPI ID daalo"); return; }
    const amt = parseInt(withdrawAmount);
    if (!amt || amt <= 0) { toast.error("Valid amount daalo"); return; }
    if (amt > 500) { toast.error("Maximum ₹500 withdraw kar sakte ho"); return; }
    if (amt > (profile?.wallet_balance || 0)) { toast.error("Insufficient balance"); return; }

    setWithdrawing(true);
    const { error } = await supabase.rpc("request_withdrawal", {
      p_amount: amt,
      p_upi_id: upiId.trim(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Withdrawal request submitted!");
      setProfile(prev => prev ? { ...prev, wallet_balance: prev.wallet_balance - amt } : prev);
      setUpiId("");
      setWithdrawAmount("");
      setShowWithdrawForm(false);
      // Refresh withdrawals
      const { data } = await supabase.from("withdrawals").select("*").eq("user_id", profile!.id).order("created_at", { ascending: false });
      if (data) setWithdrawals(data as Withdrawal[]);
    }
    setWithdrawing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const referralLink = `${window.location.origin}/pricing?ref=${profile?.referral_code || ""}`;

  // Chart data — aggregate earnings by date
  const chartData = earnings.reduce((acc: { date: string; amount: number }[], e) => {
    const date = new Date(e.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    const existing = acc.find(d => d.date === date);
    if (existing) existing.amount += e.commission_amount;
    else acc.push({ date, amount: e.commission_amount });
    return acc;
  }, []).reverse();

  const totalEarnings = earnings.reduce((s, e) => s + e.commission_amount, 0);

  const stats = [
    { icon: Wallet, label: "Wallet Balance", value: `₹${profile?.wallet_balance || 0}`, gradient: "from-emerald-500 to-cyan-500", accentHsl: "160 70% 50%" },
    { icon: Users, label: "Referrals", value: referralCount.toString(), gradient: "from-violet-500 to-fuchsia-500", accentHsl: "263 70% 58%" },
    { icon: TrendingUp, label: "Total Earnings", value: `₹${totalEarnings}`, gradient: "from-amber-500 to-orange-500", accentHsl: "38 92% 55%" },
    { icon: Gift, label: "Commission Rate", value: "5%", gradient: "from-pink-500 to-rose-500", accentHsl: "330 80% 60%" },
  ];

  const statusIcon = (s: string) => {
    if (s === "completed") return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (s === "rejected") return <XCircle size={14} className="text-red-400" />;
    return <Clock size={14} className="text-amber-400" />;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome, {profile?.full_name || "User"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{profile?.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="rounded-xl border-white/10 gap-2">
              <LogOut size={16} /> Logout
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative rounded-2xl overflow-hidden group">
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

          {/* Earnings Chart */}
          {chartData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10">
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                  <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(160,70%,50%,0.3), transparent 40%, hsla(263,70%,58%,0.3), transparent 80%)" }} />
                </div>
                <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(160,70%,50%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                  <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-400" /> Earnings Chart
                  </h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "rgba(10,10,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                          formatter={(value: number) => [`₹${value}`, "Commission"]}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#earningsGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Referral Link */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-10">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(188,100%,50%,0.3), transparent 40%, hsla(263,70%,58%,0.3), transparent 80%)" }} />
              </div>
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(188,100%,50%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={20} className="text-primary" />
                  <h2 className="font-display text-lg font-bold text-foreground">Your Referral Link</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Share this link and earn <span className="text-emerald-400 font-bold">5% commission</span> on every purchase.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground/80 font-mono break-all">
                    {referralLink}
                  </div>
                  <Button onClick={copyReferralLink} className="rounded-xl bg-gradient-to-r from-primary to-secondary font-display font-bold gap-2 shrink-0">
                    <Copy size={14} /> Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Withdraw Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-10">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(263,70%,58%,0.3), transparent 50%, hsla(263,70%,58%,0.3))" }} />
              </div>
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(263,70%,58%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <ArrowDownToLine size={20} className="text-violet-400" /> Withdraw Earnings
                  </h2>
                  <Button
                    onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                    variant="outline"
                    className="rounded-xl border-violet-500/30 text-violet-400 hover:bg-violet-500/10 gap-2"
                  >
                    <IndianRupee size={14} /> Withdraw
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm mb-4">Maximum withdrawal: <span className="text-violet-400 font-bold">₹500</span> per request. Payment via UPI.</p>

                <AnimatePresence>
                  {showWithdrawForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="space-y-3 pt-2 pb-4 border-t border-white/5">
                        <input
                          type="text"
                          placeholder="UPI ID (e.g. name@upi)"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-violet-500/50 mt-3"
                        />
                        <input
                          type="number"
                          placeholder="Amount (max ₹500)"
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                          max={500}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-violet-500/50"
                        />
                        <Button
                          onClick={handleWithdraw}
                          disabled={withdrawing}
                          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-display font-bold"
                        >
                          {withdrawing ? "Processing..." : "Submit Withdrawal Request"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Withdrawal History */}
                {withdrawals.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs text-muted-foreground font-display tracking-wider mb-2">WITHDRAWAL HISTORY</p>
                    {withdrawals.map(w => (
                      <div key={w.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          {statusIcon(w.status)}
                          <div>
                            <p className="text-sm font-medium text-foreground">₹{w.amount} → {w.upi_id}</p>
                            <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-display font-bold px-2 py-1 rounded-lg ${
                          w.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                          w.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-amber-500/20 text-amber-400"
                        }`}>
                          {w.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Earnings History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(38,92%,55%,0.3), transparent 50%, hsla(38,92%,55%,0.3))" }} />
              </div>
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(38,92%,55%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
                <h2 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-amber-400" /> Commission History
                </h2>
                {earnings.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    <Gift size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No earnings yet. Share your referral link to start earning!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earnings.map(e => (
                      <div key={e.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                        <div>
                          <p className="text-sm font-medium text-foreground">Purchase: ₹{e.purchase_amount}</p>
                          <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-emerald-400 font-display font-bold">+₹{e.commission_amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Dashboard;