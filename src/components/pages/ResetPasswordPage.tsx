"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (!token || !email) { toast.error("This reset link is invalid. Request a new one."); return; }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok || !json.success) { toast.error(json.message || "Reset link is invalid or has expired."); return; }
    toast.success("Password updated successfully!");
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 flex justify-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="relative rounded-[2rem] overflow-hidden">
              <div className="absolute inset-0 rounded-[2rem] p-px overflow-hidden">
                <motion.div className="absolute inset-[-200%]" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ background: "conic-gradient(from 0deg, hsla(160,70%,50%,0.4), transparent 50%, hsla(160,70%,50%,0.4))" }} />
              </div>
              <div className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px" style={{ background: "linear-gradient(165deg, hsla(160,70%,50%,0.06) 0%, hsla(0,0%,7%,0.97) 40%, hsla(0,0%,4%,0.99) 100%)" }}>
                <div className="relative z-10 p-8 md:p-10">
                  <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-black bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">Set New Password</h1>
                  </div>
                  <form onSubmit={handleUpdate} className="space-y-5">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="New password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 rounded-xl bg-white/5 border-white/10 text-foreground" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 font-display font-black text-white">
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
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

export default ResetPassword;
