import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const referralCode = searchParams.get("ref") || "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    // Look up referrer by referral code
    let referrerId: string | null = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle();
      if (referrer) referrerId = referrer.id;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Update referred_by if referral code was valid
    if (referrerId && data.user) {
      await supabase
        .from("profiles")
        .update({ referred_by: referrerId })
        .eq("id", data.user.id);
    }

    setLoading(false);
    toast.success("Account created! Please check your email to verify.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="relative rounded-[2rem] overflow-hidden">
              <div className="absolute inset-0 rounded-[2rem] p-px overflow-hidden">
                <motion.div
                  className="absolute inset-[-200%]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  style={{ background: "conic-gradient(from 0deg, hsla(263,70%,58%,0.4), transparent 40%, hsla(188,100%,50%,0.4), transparent 80%)" }}
                />
              </div>

              <div className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px" style={{ background: "linear-gradient(165deg, hsla(263,70%,58%,0.06) 0%, hsla(220,20%,6%,0.97) 40%, hsla(220,20%,4%,0.99) 100%)" }}>
                <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[80px] opacity-20" style={{ background: "hsla(263,70%,58%,0.5)" }} />
                <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full blur-[80px] opacity-15" style={{ background: "hsla(188,100%,50%,0.4)" }} />

                <div className="relative z-10 p-8 md:p-10">
                  <div className="text-center mb-8">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center mx-auto mb-4"
                      style={{ boxShadow: "0 0 30px hsla(263,70%,58%,0.3)" }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <UserPlus className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="font-display text-3xl font-black bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Create Account</h1>
                    <p className="text-muted-foreground text-sm mt-2">Join and start earning with referrals</p>
                    {referralCode && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        🎉 Referred with code: <span className="font-bold">{referralCode}</span>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 focus:border-secondary/50 text-foreground"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 focus:border-secondary/50 text-foreground"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 rounded-xl bg-white/5 border-white/10 focus:border-secondary/50 text-foreground"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-secondary to-primary font-display font-black text-white relative overflow-hidden group">
                        <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", width: "50%" }} />
                        <span className="relative z-10">{loading ? "Creating account..." : "Sign Up"}</span>
                        <ArrowRight size={16} className="ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      Already have an account?{" "}
                      <Link to="/login" className="text-secondary font-semibold hover:underline">Sign In</Link>
                    </p>
                  </div>
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

export default Signup;
