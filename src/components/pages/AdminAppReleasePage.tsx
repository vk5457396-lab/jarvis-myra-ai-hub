"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Smartphone, ArrowLeft, Save, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface ReleaseForm {
  version_name: string;
  version_code: number;
  release_notes: string;
  apk_asset_url: string;
  file_size_mb: string;
}

const EMPTY: ReleaseForm = {
  version_name: "",
  version_code: 1,
  release_notes: "",
  apk_asset_url: "",
  file_size_mb: "",
};

const AdminAppReleasePage = () => {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ReleaseForm>(EMPTY);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }

    const init = async () => {
      const res = await fetch("/api/app/release/admin");
      if (res.status === 401 || res.status === 403) { router.push("/dashboard"); return; }
      const body = await res.json();
      if (body.success && body.data) {
        const d = body.data;
        setForm({
          version_name: d.version_name ?? "",
          version_code: d.version_code ?? 1,
          release_notes: d.release_notes ?? "",
          apk_asset_url: d.apk_asset_url ?? "",
          file_size_mb: d.file_size_mb ? String(d.file_size_mb) : "",
        });
        setUpdatedAt(d.updated_at ?? null);
      }
      setLoading(false);
    };
    init();
  }, [router, status]);

  const handleSave = async () => {
    if (!form.apk_asset_url.trim()) { toast.error("Direct download URL daalo"); return; }
    if (!form.version_name.trim()) { toast.error("Version name daalo"); return; }

    setSaving(true);
    const res = await fetch("/api/app/release/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version_name: form.version_name.trim(),
        version_code: Number(form.version_code) || 1,
        release_notes: form.release_notes.trim(),
        apk_asset_url: form.apk_asset_url.trim(),
        file_size_mb: form.file_size_mb ? Number(form.file_size_mb) : null,
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      toast.error(body.message || "Update failed");
    } else {
      toast.success("Release updated! Users will get this version now.");
      setUpdatedAt(body.data?.updated_at ?? null);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Button onClick={() => router.push("/admin")} variant="outline" size="icon" className="rounded-xl border-white/10 shrink-0">
              <ArrowLeft size={16} />
            </Button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Smartphone size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                App Release
              </h1>
              <p className="text-muted-foreground text-sm">Manage the APK users download from the site</p>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
              <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(188,100%,50%,0.3), transparent 50%, hsla(188,100%,50%,0.3))" }} />
            </div>
            <div className="relative rounded-[calc(1rem-1px)] m-px p-6 space-y-5" style={{ background: "linear-gradient(165deg, hsla(188,100%,50%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">VERSION NAME</label>
                  <input
                    type="text"
                    placeholder="1.2.0"
                    value={form.version_name}
                    onChange={(e) => setForm({ ...form, version_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">VERSION CODE</label>
                  <input
                    type="number"
                    placeholder="12"
                    value={form.version_code}
                    onChange={(e) => setForm({ ...form, version_code: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">APK LINK (MEDIAFIRE FILE PAGE)</label>
                <input
                  type="text"
                  placeholder="https://www.mediafire.com/file/xxxxx/app-release.apk/file"
                  value={form.apk_asset_url}
                  onChange={(e) => setForm({ ...form, apk_asset_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Paste the normal MediaFire <span className="text-foreground/80">file page</span> link (the one you land on after uploading —
                  ends in <span className="font-mono">/file</span>). The server resolves a fresh download link from it on every request, since
                  MediaFire&apos;s own &quot;direct download&quot; link expires after a few hours and would silently break installs later.
                  Other hosts (Drive/Dropbox raw links) still need to be a <span className="text-foreground/80">direct</span> link, not a share page —
                  <span className="text-red-300/80"> api.github.com</span> asset URLs won&apos;t work here (private repo, needs auth this route no longer sends).
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">FILE SIZE (MB, optional)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={form.file_size_mb}
                  onChange={(e) => setForm({ ...form, file_size_mb: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">RELEASE NOTES (optional)</label>
                <textarea
                  placeholder="What's new in this version..."
                  value={form.release_notes}
                  onChange={(e) => setForm({ ...form, release_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              {updatedAt && (
                <p className="text-xs text-muted-foreground">Last updated: {new Date(updatedAt).toLocaleString()}</p>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-display font-bold gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : "Publish Release"}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AdminAppReleasePage;
