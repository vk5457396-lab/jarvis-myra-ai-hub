"use client";

import { useState } from "react";
import Link from "@/components/IntentLink";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

const Login = () => {
  const rise = useRise();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMyraLogin = searchParams.get("redirect") === "myra://auth";
  // ?next=/download#myra-android sends people back to what they were doing (e.g. buying MYRA).
  // Only same-site paths are accepted, so this can't be used as an open redirect.
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const successUrl = isMyraLogin ? "/auth/myra" : next || "/dashboard";
  const signupUrl = isMyraLogin
    ? "/signup?redirect=myra%3A%2F%2Fauth"
    : next
      ? `/signup?next=${encodeURIComponent(next)}`
      : "/signup";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.code === "rate_limited") {
      setFailedAttempts((n) => n + 1);
      toast.error("Too many sign-in attempts. Please wait a few minutes and try again.");
    } else if (result?.error) {
      // Most failed sign-ins in production are real people retrying a forgotten password —
      // point them at the fix instead of letting them keep guessing.
      setFailedAttempts((n) => n + 1);
      toast.error("Invalid email or password");
    } else {
      toast.success("Welcome back!");
      router.push(successUrl);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <AuthSplitCard
        panelTitle="Welcome Back!"
        panelText="To stay connected with us, sign in with your personal info"
        panelCta={{ href: signupUrl, label: "CREATE ACCOUNT" }}
      >
        <motion.h1
          {...rise(0.15)}
          className="text-center font-display text-3xl font-bold lowercase text-[hsl(0_72%_46%)] md:text-4xl"
        >
          welcome
        </motion.h1>
        <motion.p {...rise(0.2)} className="mt-1 text-center text-sm text-neutral-600">
          Log in to your account to continue
        </motion.p>

        <motion.form {...rise(0.26)} onSubmit={handleLogin} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="login-email" className={fieldLabel}>
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className={fieldLabel}>
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${pillInput} pr-12`}
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
          </div>

          <p className="text-center">
            <Link href="/forgot-password" className="text-xs font-medium text-neutral-600 underline-offset-2 hover:text-[hsl(0_72%_46%)] hover:underline">
              Forgot your password?
            </Link>
          </p>

          {failedAttempts > 0 && (
            <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-900">
              {failedAttempts >= 3 ? (
                <>
                  <p className="font-semibold">Still can&apos;t sign in?</p>
                  <p className="mt-1">Reset your password — it takes a minute and you won&apos;t be locked out.</p>
                  <Link
                    href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                    className="mt-2.5 inline-flex min-h-10 items-center rounded-full bg-amber-400 px-4 font-semibold text-black hover:bg-amber-300"
                  >
                    Reset my password
                  </Link>
                </>
              ) : (
                <p>
                  Wrong password? Use{" "}
                  <Link href="/forgot-password" className="font-semibold underline underline-offset-2">
                    Forgot password
                  </Link>{" "}
                  — or Continue with Google below if you signed up with Google.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center pt-1">
            <button type="submit" disabled={loading} className={primaryButton} style={{ background: PANEL_BG }}>
              {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {loading ? "SIGNING IN" : "LOG IN"}
            </button>
          </div>
        </motion.form>

        <motion.div {...rise(0.32)}>
          <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <button type="button" onClick={() => signIn("google", { callbackUrl: successUrl })} className={googleButton}>
            <GoogleIcon /> Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Don&apos;t have an account?{" "}
            <Link href={signupUrl} className="font-semibold text-[hsl(0_72%_46%)] hover:underline">
              sign up
            </Link>
          </p>
        </motion.div>
      </AuthSplitCard>
      <Footer />
    </div>
  );
};

export default Login;
