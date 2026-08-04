"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  KeyRound, LayoutDashboard, PlusCircle, List, BarChart3, Settings2, ArrowLeft, Loader2, RefreshCw, Menu,
} from "lucide-react";
import LicenseStats from "@/components/licenses/LicenseStats";
import GenerateLicense from "@/components/licenses/GenerateLicense";
import LicenseList from "@/components/licenses/LicenseList";
import LicenseAnalytics from "@/components/licenses/LicenseAnalytics";
import LicenseSettings, { LicenseSettingsValue } from "@/components/licenses/LicenseSettings";
import { LicenseRow } from "@/lib/licenses";

type Section = "dashboard" | "generate" | "manage" | "analytics" | "settings";

const NAV: { id: Section; label: string; icon: typeof KeyRound }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "generate", label: "Generate License", icon: PlusCircle },
  { id: "manage", label: "Manage Licenses", icon: List },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const DEFAULT_SETTINGS: LicenseSettingsValue = {
  prefix: "MYRA",
  random_length: 16,
  max_activations: 1,
  device_lock: true,
  offline_activation: true,
};

const LicenseAdmin = () => {
  const router = useRouter();
  const { status } = useSession();
  const [section, setSection] = useState<Section>("dashboard");
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [settings, setSettings] = useState<LicenseSettingsValue>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  const loadData = useCallback(async () => {
    const [licRes, cfgRes] = await Promise.all([
      fetch("/api/admin/licenses"),
      fetch("/api/admin/license-settings"),
    ]);
    if (licRes.status === 401 || licRes.status === 403) { router.push("/dashboard"); return; }

    const licJson = await licRes.json();
    if (!licJson.success) toast.error(licJson.message || "Could not load licenses");
    setLicenses((licJson.data?.licenses ?? []) as LicenseRow[]);

    const cfgJson = await cfgRes.json();
    if (cfgJson.success) setSettings(cfgJson.data);
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    const init = async () => {
      await loadData();
      setLoading(false);
    };
    init();
  }, [router, loadData, status]);

  if (loading) {
    return (
      <div className="license-admin flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="license-admin min-h-screen">
      <div className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 10%, hsl(263 83% 58% / 0.22) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(188 94% 43% / 0.16) 0%, transparent 55%)",
        }}
      />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-background/80 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="mb-8 flex items-center gap-3 px-2 pt-2">
              <div className="rounded-xl bg-primary/20 p-2">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">MYRA Licenses</p>
                <p className="text-xs text-muted-foreground">Admin Control</p>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSection(item.id); setNavOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    section === item.id
                      ? "bg-primary/20 text-primary shadow-[0_0_20px_-6px_hsl(263_83%_58%/0.7)]"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto space-y-2">
              <Button variant="secondary" className="w-full justify-start" onClick={() => loadData()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/admin")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
              </Button>
            </div>
          </div>
        </aside>

        {navOpen && (
          <div className="fixed inset-0 z-30 bg-background/70 lg:hidden" onClick={() => setNavOpen(false)} />
        )}

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="secondary" size="icon" className="lg:hidden" onClick={() => setNavOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">
                {NAV.find((n) => n.id === section)?.label}
              </h1>
              <p className="text-sm text-muted-foreground">MYRA AI Assistant license control center</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {section === "dashboard" && (
                <>
                  <LicenseStats licenses={licenses} />
                  <LicenseAnalytics licenses={licenses} />
                </>
              )}
              {section === "generate" && (
                <GenerateLicense settings={settings} onGenerated={loadData} />
              )}
              {section === "manage" && (
                <>
                  <LicenseStats licenses={licenses} />
                  <LicenseList licenses={licenses} onRefresh={loadData} />
                </>
              )}
              {section === "analytics" && <LicenseAnalytics licenses={licenses} />}
              {section === "settings" && <LicenseSettings value={settings} onSaved={loadData} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default LicenseAdmin;