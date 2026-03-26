import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") !== "recovery") {
      // Allow the page to render anyway — user might arrive from email link
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated successfully!");
    navigate("/login");
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
              <div className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px" style={{ background: "linear-gradient(165deg, hsla(160,70%,50%,0.06) 0%, hsla(220,20%,6%,0.97) 40%, hsla(220,20%,4%,0.99) 100%)" }}>
                <div className="relative z-10 p-8 md:p-10">
                  <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Set New Password</h1>
                  </div>
                  <form onSubmit={handleUpdate} className="space-y-5">
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type={showPassword ? "text" : "password"} placeholder="New password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-11 h-12 rounded-xl bg-white/5 border-white/10 text-foreground" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 font-display font-black text-white">
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
