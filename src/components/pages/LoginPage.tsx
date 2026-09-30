"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const logo = "/assets/logo.png";

/** Brand gradient used for the curved panel and accents (swap here to re-colour the page). */
const PANEL_BG = "linear-gradient(150deg, hsl(0 78% 56%) 0%, hsl(0 72% 46%) 45%, hsl(350 68% 34%) 100%)";

const pillInput =
  "w-full h-12 rounded-full bg-[#fdecec] px-5 text-[15px] text-neutral-900 placeholder:text-neutral-500/80 outline-none ring-0 transition-shadow focus:bg-white focus:shadow-[0_0_0_2px_hsl(0_72%_51%)]";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/** Logo + brand name, as on the reference design's coloured panel. */
function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`flex items-center justify-center rounded-full bg-white shadow-lg ${small ? "h-14 w-14" : "h-16 w-16"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" className={`rounded-full object-cover ${small ? "h-11 w-11" : "h-12 w-12"}`} />
      </span>
      <span className="mt-2 font-display text-lg font-bold tracking-wide text-white">codeninjavik</span>
    </div>
  );
}

const Login = () => {
  const reduceMotion = useReducedMotion();
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

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="flex justify-center px-4 pb-16 pt-24 md:pb-24 md:pt-36">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] md:grid md:max-w-4xl md:grid-cols-[1.05fr_1fr]"
        >
          {/* ── Coloured panel: curved right edge on desktop, curved bottom on phones ── */}
          <section
            aria-hidden="true"
            className="relative flex flex-col items-center justify-center px-8 pb-14 pt-10 text-center md:min-h-[560px] md:pb-10 md:pr-20"
          >
            {/* Phone: curved bottom-right like the reference; desktop: ellipse-clipped right edge */}
            <div className="absolute inset-0 md:hidden" style={{ background: PANEL_BG, borderBottomRightRadius: "55% 38%" }} />
            <div className="absolute inset-0 hidden md:block" style={{ background: PANEL_BG, clipPath: "ellipse(100% 96% at 0% 50%)" }} />
            {/* soft sheen */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <motion.div {...rise(0.1)}>
                <Brand />
              </motion.div>
              {/* Desktop copy (the phone layout keeps the panel compact, like the reference) */}
              <div className="hidden md:block">
                <motion.h2 {...rise(0.18)} className="mt-10 font-display text-4xl font-bold text-white">
                  Welcome Back!
                </motion.h2>
                <motion.p {...rise(0.24)} className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-white/85">
                  To stay connected with us, sign in with your personal info
                </motion.p>
                <motion.div {...rise(0.3)} className="mt-10">
                  <Link
                    href={signupUrl}
                    tabIndex={-1}
                    className="inline-flex min-h-11 min-w-[14rem] items-center justify-center rounded-full border-2 border-white/80 px-8 text-sm font-semibold tracking-wider text-white transition-colors hover:bg-white hover:text-[hsl(0_72%_46%)]"
                  >
                    CREATE ACCOUNT
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Decorative corner swoosh on the form side (reference: top-right curve) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 hidden h-48 w-48 rounded-full md:block"
            style={{ background: PANEL_BG }}
          />

          {/* ── Form ── */}
          <section className="relative px-7 pb-10 pt-4 md:flex md:flex-col md:justify-center md:px-12 md:py-12">
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
                <label htmlFor="login-email" className="mb-1.5 block pl-4 text-xs font-medium text-neutral-600">
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
                <label htmlFor="login-password" className="mb-1.5 block pl-4 text-xs font-medium text-neutral-600">
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
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(0_72%_51%)]"
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
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-11 min-w-[10rem] items-center justify-center gap-2 rounded-full px-10 text-sm font-bold tracking-wider text-white shadow-[0_12px_24px_-10px_hsl(0_72%_46%)] transition-[filter,transform] hover:brightness-110 active:brightness-95 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(0_72%_51%)] focus-visible:ring-offset-2"
                  style={{ background: PANEL_BG }}
                >
                  {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {loading ? "SIGNING IN" : "LOG IN"}
                </button>
              </div>
            </motion.form>

            <motion.div {...rise(0.32)}>
              <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
                <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
              </div>
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: successUrl })}
                className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(0_72%_51%)]"
              >
                <GoogleIcon /> Continue with Google
              </button>

              <p className="mt-6 text-center text-sm text-neutral-600">
                Don&apos;t have an account?{" "}
                <Link href={signupUrl} className="font-semibold text-[hsl(0_72%_46%)] hover:underline">
                  sign up
                </Link>
              </p>
            </motion.div>
          </section>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
