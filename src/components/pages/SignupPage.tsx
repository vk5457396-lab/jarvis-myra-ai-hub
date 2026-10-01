"use client";

import { useEffect, useState } from "react";
import Link from "@/components/IntentLink";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getStoredReferralCode } from "@/lib/referral";
import AuthSplitCard, {
  PANEL_BG,
  pillInput,
  fieldLabel,
  primaryButton,
  eyeButton,
  googleButton,
  GoogleIcon,
  useRise,
} from "@/components/auth/AuthSplitCard";

const Signup = () => {
  const rise = useRise();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  // The shared link lands on /pricing?ref=…, so fall back to the code ReferralBanner stored.
  useEffect(() => {
    if (!referralCode) setReferralCode(getStoredReferralCode() || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isMyraLogin = searchParams.get("redirect") === "myra://auth";
  // Same-site ?next= only (see LoginPage) — returns the buyer to MYRA after creating an account.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const successUrl = isMyraLogin ? "/auth/myra" : next || "/dashboard";
  const loginUrl = isMyraLogin
    ? "/login?redirect=myra%3A%2F%2Fauth"
    : next
      ? `/login?next=${encodeURIComponent(next)}`
      : "/login";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, referral_code: referralCode || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Could not create account");
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast.success("Account created! Please sign in.");
        router.push(loginUrl);
        return;
      }

      toast.success("Account created!");
      router.push(successUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <AuthSplitCard
        mirrored
        panelTitle="Hello, Friend!"
        panelText="Already have an account? Sign in to pick up where you left off"
        panelCta={{ href: loginUrl, label: "SIGN IN" }}
      >
        <motion.h1
          {...rise(0.15)}
          className="text-center font-display text-3xl font-bold lowercase text-[hsl(0_72%_46%)] md:text-4xl"
        >
          create account
        </motion.h1>
        <motion.p {...rise(0.2)} className="mt-1 text-center text-sm text-neutral-600">
          Join and start earning with referrals
        </motion.p>
        {referralCode && (
          <motion.p {...rise(0.22)} className="mt-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800 ring-1 ring-emerald-200">
              Referred with code <span className="font-bold">{referralCode}</span>
            </span>
          </motion.p>
        )}

        <motion.form {...rise(0.26)} onSubmit={handleSignup} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="signup-name" className={fieldLabel}>
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={pillInput}
            />
          </div>

          <div>
            <label htmlFor="signup-email" className={fieldLabel}>
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={pillInput}
            />
          </div>

          <div>
            <label htmlFor="signup-password" className={fieldLabel}>
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${pillInput} pr-12`}
                aria-describedby="signup-password-hint"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className={eyeButton}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
            <p id="signup-password-hint" className="mt-1.5 pl-4 text-xs text-neutral-500">
              Use 8 or more characters.
            </p>
          </div>

          <div className="flex justify-center pt-1">
            <button type="submit" disabled={loading} className={primaryButton} style={{ background: PANEL_BG }}>
              {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {loading ? "CREATING ACCOUNT" : "SIGN UP"}
            </button>
          </div>
        </motion.form>

        <motion.div {...rise(0.32)}>
          <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <button type="button" onClick={() => signIn("google", { callbackUrl: successUrl })} className={googleButton}>
            <GoogleIcon /> Sign up with Google
          </button>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{" "}
            <Link href={loginUrl} className="font-semibold text-[hsl(0_72%_46%)] hover:underline">
              sign in
            </Link>
          </p>
        </motion.div>
      </AuthSplitCard>
      <Footer />
    </div>
  );
};

export default Signup;
