"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight } from "lucide-react";
import { lovable } from "@/lib/lovable/index";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

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
                  style={{ background: "conic-gradient(from 0deg, hsla(188,100%,50%,0.4), transparent 40%, hsla(263,70%,58%,0.4), transparent 80%)" }}
                />
              </div>

              <div className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px" style={{ background: "linear-gradient(165deg, hsla(188,100%,50%,0.06) 0%, hsla(220,20%,6%,0.97) 40%, hsla(220,20%,4%,0.99) 100%)" }}>
                <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full blur-[80px] opacity-20" style={{ background: "hsla(188,100%,50%,0.5)" }} />
                <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full blur-[80px] opacity-15" style={{ background: "hsla(263,70%,58%,0.4)" }} />

                <div className="relative z-10 p-8 md:p-10">
                  <div className="text-center mb-8">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4"
                      style={{ boxShadow: "0 0 30px hsla(188,100%,50%,0.3)" }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <LogIn className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="font-display text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Welcome Back</h1>
                    <p className="text-muted-foreground text-sm mt-2">Sign in to your account</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        aria-label="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 text-foreground"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        aria-label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 rounded-xl bg-white/5 border-white/10 focus:border-primary/50 text-foreground"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>

                    </div>

                    <div className="text-right">
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-secondary font-display font-black text-white relative overflow-hidden group">
                        <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", width: "50%" }} />
                        <span className="relative z-10">{loading ? "Signing in..." : "Sign In"}</span>
                        <ArrowRight size={16} className="ml-2 relative z-10 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-3 text-muted-foreground">or continue with</span>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 gap-3 font-display"
                      onClick={async () => {
                        const { error } = await lovable.auth.signInWithOAuth("google", {
                          redirect_uri: window.location.origin,
                        });
                        if (error) toast.error(error.message || "Google sign-in failed");
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign in with Google
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 gap-3 font-display"
                      onClick={async () => {
                        const { error } = await lovable.auth.signInWithOAuth("apple", {
                          redirect_uri: window.location.origin,
                        });
                        if (error) toast.error(error.message || "Apple sign-in failed");
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Sign in with Apple
                    </Button>
                  </motion.div>

                  <div className="mt-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      Don't have an account?{" "}
                      <Link href="/signup" className="text-primary font-semibold hover:underline">Sign Up</Link>
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

export default Login;