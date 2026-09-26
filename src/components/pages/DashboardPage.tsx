"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Wallet, Users, Copy, LogOut, TrendingUp, Gift, Shield,
  ArrowDownToLine, IndianRupee, Clock, CheckCircle2, XCircle,
  Smartphone, KeyRound, Loader2, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getStoredReferralCode } from "@/lib/referral";

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
  method: "upi" | "bank";
  upi_id: string | null;
  payout_to: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

interface MyraKey {
  key: string;
  plan: string;
  status: string;
  redeemed_at: string | null;
  created_at: string;
}

// Only Membership is sold from the dashboard now - Basic/Premium/Elite/Elite Pro were removed
// from this buy UI per an explicit request (2026-09-18), leaving Membership as the sole purchase
// option here. The plan values themselves still exist elsewhere (admin key issuance, existing
// redeemed keys, backend validation) - this only trims what a user can BUY from their dashboard.
const MYRA_PLAN_OPTIONS: { value: string; label: string; price: number }[] = [
  { value: "membership", label: "Membership (Unlimited)", price: 999 },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

const MIN_WITHDRAWAL = 500;

const fieldClass =
  "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-rose-500/50 focus-visible:ring-2 focus-visible:ring-rose-500/30";

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const Dashboard = () => {
  const { status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [myraKeys, setMyraKeys] = useState<MyraKey[]>([]);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const router = useRouter();

  const loadMyraKeys = async () => {
    const res = await fetch("/api/myra/website-purchase/keys");
    const json = await res.json();
    if (json.success) setMyraKeys(json.data.keys);
  };

  const buyMyraPlan = async (plan: string) => {
    setBuyingPlan(plan);
    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) { toast.error("Could not load payment gateway."); return; }

      const orderRes = await fetch("/api/myra/website-purchase/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        toast.error(orderJson.message || "Could not start payment");
        return;
      }
      const order = orderJson.data;

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "MYRA",
        description: `MYRA ${plan} plan access key`,
        prefill: { email: profile?.email || "" },
        theme: { color: "#10b981" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/myra/website-purchase/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              plan,
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              referral_code: getStoredReferralCode(),
            }),
          });
          const verifyJson = await verifyRes.json();
          if (!verifyRes.ok || !verifyJson.success) {
            toast.error(verifyJson.message || "Payment succeeded but key issuance failed. Contact support.");
            return;
          }
          toast.success(`Access key issued: ${verifyJson.data.key}`);
          loadMyraKeys();
        },
        modal: { ondismiss: () => setBuyingPlan(null) },
      });
      checkout.open();
    } catch {
      toast.error("Could not start payment. Try again.");
    } finally {
      setBuyingPlan(null);
    }
  };

  const copyMyraKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Key copied");
  };

  const loadData = async () => {
    const [profileRes, walletRes] = await Promise.all([fetch("/api/profile"), fetch("/api/wallet")]);

    if (profileRes.status === 401) { router.push("/login"); return; }

    const profileJson = await profileRes.json();
    if (profileJson.success) {
      if (profileJson.data.role === "admin") { router.push("/admin"); return; }
      setProfile(profileJson.data);
    }

    const walletJson = await walletRes.json();
    if (walletJson.success) {
      setEarnings(walletJson.data.earnings);
      setWithdrawals(walletJson.data.withdrawals);
      setReferralCount(walletJson.data.referral_count);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    loadData();
    loadMyraKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const copyReferralLink = () => {
    if (!profile) return;
    const link = `${window.location.origin}/pricing?ref=${profile.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmount);
    if (!amt || amt <= 0) { toast.error("Valid amount daalo"); return; }
    if (amt < MIN_WITHDRAWAL) { toast.error(`Minimum ₹${MIN_WITHDRAWAL} withdraw kar sakte ho`); return; }
    if (amt > (profile?.wallet_balance || 0)) { toast.error("Insufficient balance"); return; }
    if (payoutMethod === "upi" && !upiId.trim()) { toast.error("UPI ID daalo"); return; }
    if (payoutMethod === "bank" && (!bankName.trim() || !bankAccount.trim() || !bankIfsc.trim())) {
      toast.error("Bank ki saari details daalo"); return;
    }

    setWithdrawing(true);
    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        payoutMethod === "upi"
          ? { amount: amt, method: "upi", upi_id: upiId.trim() }
          : {
              amount: amt,
              method: "bank",
              bank_account_name: bankName.trim(),
              bank_account_number: bankAccount.replace(/\s+/g, ""),
              bank_ifsc: bankIfsc.trim().toUpperCase(),
            }
      ),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      toast.error(json.message || "Withdrawal failed");
    } else {
      toast.success("Withdrawal request submitted!");
      setProfile((prev) => (prev ? { ...prev, wallet_balance: prev.wallet_balance - amt } : prev));
      setUpiId("");
      setBankName("");
      setBankAccount("");
      setBankIfsc("");
      setWithdrawAmount("");
      setShowWithdrawForm(false);
      const walletJson = await (await fetch("/api/wallet")).json();
      if (walletJson.success) setWithdrawals(walletJson.data.withdrawals);
    }
    setWithdrawing(false);
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
  const walletBalance = profile?.wallet_balance || 0;
  const canWithdraw = walletBalance >= MIN_WITHDRAWAL;

  const stats = [
    { icon: Wallet, label: "Wallet Balance", value: `₹${profile?.wallet_balance || 0}`, gradient: "from-emerald-500 to-red-500", accentHsl: "160 70% 50%" },
    { icon: Users, label: "Referrals", value: referralCount.toString(), gradient: "from-rose-500 to-red-600", accentHsl: "350 65% 45%" },
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
                <div className="relative rounded-[calc(1rem-1px)] m-px p-5" style={{ background: `linear-gradient(165deg, hsla(${stat.accentHsl}, 0.06) 0%, hsla(0,0%,6%,0.97) 100%)` }}>
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
                  <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(160,70%,50%,0.3), transparent 40%, hsla(350,65%,45%,0.3), transparent 80%)" }} />
                </div>
                <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(160,70%,50%,0.04) 0%, hsla(0,0%,6%,0.97) 100%)" }}>
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
                <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(0,72%,51%,0.3), transparent 40%, hsla(350,65%,45%,0.3), transparent 80%)" }} />
              </div>
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(0,72%,51%,0.04) 0%, hsla(0,0%,6%,0.97) 100%)" }}>
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

          {/* MYRA Android Access Keys */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="mb-10">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(160,70%,50%,0.3), transparent 40%, hsla(38,92%,55%,0.3), transparent 80%)" }} />
              </div>
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(160,70%,50%,0.04) 0%, hsla(0,0%,6%,0.97) 100%)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone size={20} className="text-emerald-400" />
                  <h2 className="font-display text-lg font-bold text-foreground">MYRA Android App Access</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Buy a plan to get an access key here — redeem it inside the MYRA app (Account → License Key) to
                  activate it, using this same email.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 [&:has(>:only-child)]:grid-cols-1 [&:has(>:only-child)]:sm:w-56">
                  {MYRA_PLAN_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => buyMyraPlan(p.value)}
                      disabled={buyingPlan !== null}
                      className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 text-center transition-colors disabled:opacity-50"
                    >
                      <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">{p.label.toUpperCase()}</p>
                      <p className="text-xl font-display font-black text-foreground">₹{p.price}</p>
                      <div className="mt-2 flex items-center justify-center gap-1 text-xs text-emerald-400">
                        {buyingPlan === p.value ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        Buy
                      </div>
                    </button>
                  ))}
                </div>

                {myraKeys.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-display tracking-wider mb-2">YOUR ACCESS KEYS</p>
                    {myraKeys.map((k) => (
                      <div key={k.key} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <KeyRound size={16} className="text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-mono text-foreground truncate">{k.key}</p>
                            <p className="text-xs text-muted-foreground">{k.plan} · {new Date(k.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            k.status === "available" ? "bg-emerald-500/20 text-emerald-400" :
                            k.status === "redeemed" ? "bg-white/10 text-muted-foreground" : "bg-red-500/20 text-red-400"
                          }`}>
                            {k.status.toUpperCase()}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => copyMyraKey(k.key)}>
                            <Copy size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Withdraw Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mb-10">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(350,65%,45%,0.3), transparent 50%, hsla(350,65%,45%,0.3))" }} />
              </div>
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(350,65%,45%,0.04) 0%, hsla(0,0%,6%,0.97) 100%)" }}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                    <ArrowDownToLine size={20} className="text-rose-400" aria-hidden="true" /> Withdraw Earnings
                  </h2>
                  <Button
                    onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                    disabled={!canWithdraw}
                    aria-expanded={showWithdrawForm}
                    aria-controls="withdraw-form"
                    variant="outline"
                    className="rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-2 min-h-11"
                  >
                    <IndianRupee size={14} aria-hidden="true" /> Withdraw
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Minimum withdrawal: <span className="text-rose-400 font-bold">₹{MIN_WITHDRAWAL}</span>. Paid to your UPI ID or bank account.
                </p>

                {!canWithdraw && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>₹{walletBalance} earned</span>
                      <span>₹{MIN_WITHDRAWAL - walletBalance} more to withdraw</span>
                    </div>
                    <div
                      className="h-2 rounded-full bg-white/5 overflow-hidden"
                      role="progressbar"
                      aria-label="Progress to minimum withdrawal"
                      aria-valuemin={0}
                      aria-valuemax={MIN_WITHDRAWAL}
                      aria-valuenow={walletBalance}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-[width] duration-500 motion-reduce:transition-none"
                        style={{ width: `${Math.min(100, (walletBalance / MIN_WITHDRAWAL) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {showWithdrawForm && canWithdraw && (
                    <motion.div id="withdraw-form" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <form
                        onSubmit={e => { e.preventDefault(); handleWithdraw(); }}
                        className="space-y-4 pt-4 pb-4 border-t border-white/5"
                      >
                        <fieldset>
                          <legend className="text-xs text-muted-foreground font-display tracking-wider mb-2">PAYOUT METHOD</legend>
                          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10" role="radiogroup" aria-label="Payout method">
                            {(["upi", "bank"] as const).map(m => (
                              <button
                                key={m}
                                type="button"
                                role="radio"
                                aria-checked={payoutMethod === m}
                                onClick={() => setPayoutMethod(m)}
                                className={`min-h-11 rounded-lg text-sm font-display font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
                                  payoutMethod === m ? "bg-gradient-to-r from-rose-600 to-red-600 text-white" : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {m === "upi" ? "UPI" : "Bank Account"}
                              </button>
                            ))}
                          </div>
                        </fieldset>

                        {payoutMethod === "upi" ? (
                          <div>
                            <label htmlFor="wd-upi" className="block text-sm text-foreground mb-1.5">UPI ID</label>
                            <input id="wd-upi" type="text" autoComplete="off" placeholder="name@upi" value={upiId} onChange={e => setUpiId(e.target.value)} className={fieldClass} />
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label htmlFor="wd-bank-name" className="block text-sm text-foreground mb-1.5">Account holder name</label>
                              <input id="wd-bank-name" type="text" autoComplete="name" value={bankName} onChange={e => setBankName(e.target.value)} className={fieldClass} />
                            </div>
                            <div>
                              <label htmlFor="wd-bank-acct" className="block text-sm text-foreground mb-1.5">Account number</label>
                              <input id="wd-bank-acct" type="text" inputMode="numeric" autoComplete="off" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/[^\d\s]/g, ""))} className={`${fieldClass} font-mono`} />
                            </div>
                            <div>
                              <label htmlFor="wd-bank-ifsc" className="block text-sm text-foreground mb-1.5">IFSC code</label>
                              <input id="wd-bank-ifsc" type="text" autoComplete="off" placeholder="SBIN0001234" maxLength={11} value={bankIfsc} onChange={e => setBankIfsc(e.target.value.toUpperCase())} className={`${fieldClass} font-mono uppercase`} />
                            </div>
                          </div>
                        )}

                        <div>
                          <label htmlFor="wd-amount" className="block text-sm text-foreground mb-1.5">Amount (₹)</label>
                          <input
                            id="wd-amount"
                            type="number"
                            inputMode="numeric"
                            min={MIN_WITHDRAWAL}
                            max={walletBalance}
                            placeholder={`₹${MIN_WITHDRAWAL} – ₹${walletBalance}`}
                            value={withdrawAmount}
                            onChange={e => setWithdrawAmount(e.target.value)}
                            aria-describedby="wd-amount-help"
                            className={fieldClass}
                          />
                          <div id="wd-amount-help" className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                            <span>Minimum ₹{MIN_WITHDRAWAL}</span>
                            <button type="button" onClick={() => setWithdrawAmount(String(walletBalance))} className="text-rose-400 hover:underline focus-visible:outline-none focus-visible:underline">
                              Withdraw all (₹{walletBalance})
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={withdrawing}
                          className="w-full min-h-11 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 font-display font-bold"
                        >
                          {withdrawing ? "Processing..." : "Submit Withdrawal Request"}
                        </Button>
                      </form>
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
                            <p className="text-sm font-medium text-foreground">₹{w.amount} → {w.payout_to || w.upi_id}</p>
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
              <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(38,92%,55%,0.04) 0%, hsla(0,0%,6%,0.97) 100%)" }}>
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
