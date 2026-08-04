"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Enter your email"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) { toast.error("Something went wrong. Try again."); return; }
    setSent(true);
    toast.success("Password reset email sent!");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="container mx-auto px-4 relative z-10 flex justify-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="relative rounded-[2rem] overflow-hidden">
              <div className="absolute inset-0 rounded-[2rem] p-px overflow-hidden">
                <motion.div className="absolute inset-[-200%]" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ background: "conic-gradient(from 0deg, hsla(38,92%,55%,0.4), transparent 40%, hsla(188,100%,50%,0.4), transparent 80%)" }} />
              </div>
              <div className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px" style={{ background: "linear-gradient(165deg, hsla(38,92%,55%,0.06) 0%, hsla(220,20%,6%,0.97) 40%, hsla(220,20%,4%,0.99) 100%)" }}>
                <div className="relative z-10 p-8 md:p-10">
                  <div className="text-center mb-8">
                    <motion.div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4" whileHover={{ scale: 1.1 }}>
                      <KeyRound className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="font-display text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Reset Password</h1>
                    <p className="text-muted-foreground text-sm mt-2">We'll send you a reset link</p>
                  </div>

                  {sent ? (
                    <div className="text-center space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                        ✅ Reset link sent to <strong>{email}</strong>. Check your inbox.
                      </div>
                      <Link href="/login" className="inline-flex items-center gap-2 text-primary text-sm hover:underline">
                        <ArrowLeft size={14} /> Back to login
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleReset} className="space-y-5">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 text-foreground" />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-display font-black text-white">
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>
                      <div className="text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-primary">
                          <ArrowLeft size={14} /> Back to login
                        </Link>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ForgotPassword;