"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Smartphone, Globe, ArrowLeft, Save, Loader2 } from "lucide-react";

interface ReleaseForm {
  version_name: string;
  version_code: number;
  release_notes: string;
  apk_asset_url: string;
  file_size_mb: string;
  sha256: string;
}

interface PublicDownloadForm {
  version_name: string;
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
  sha256: "",
};

const SHA256_RE = /^[0-9a-f]{64}$/i;
// Strips every whitespace character anywhere in the string (not just the ends - a mobile
// copy/paste can leave an internal newline from a wrapped display) plus the common invisible
// ones (zero-width space/joiners, BOM), so a value that's visually "just the hash" but carries
// hidden characters still validates. Mirrors the backend's validateSha256 exactly.
const sanitizeSha256 = (value: string) => value.replace(/[\s​‌‍﻿]/g, "");

const EMPTY_PUBLIC: PublicDownloadForm = {
  version_name: "",
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

  const [savingPublic, setSavingPublic] = useState(false);
  const [publicForm, setPublicForm] = useState<PublicDownloadForm>(EMPTY_PUBLIC);
  const [publicUpdatedAt, setPublicUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }

    const init = async () => {
      const [otaRes, publicRes] = await Promise.all([
        fetch("/api/app/release/admin"),
        fetch("/api/app/release/public-admin"),
      ]);
      if (otaRes.status === 401 || otaRes.status === 403) { router.push("/dashboard"); return; }

      const otaBody = await otaRes.json();
      if (otaBody.success && otaBody.data) {
        const d = otaBody.data;
        setForm({
          version_name: d.version_name ?? "",
          version_code: d.version_code ?? 1,
          release_notes: d.release_notes ?? "",
          apk_asset_url: d.apk_asset_url ?? "",
          file_size_mb: d.file_size_mb ? String(d.file_size_mb) : "",
          sha256: d.sha256 ?? "",
        });
        setUpdatedAt(d.updated_at ?? null);
      }

      const publicBody = await publicRes.json();
      if (publicBody.success && publicBody.data) {
        const d = publicBody.data;
        setPublicForm({
          version_name: d.version_name ?? "",
          release_notes: d.release_notes ?? "",
          apk_asset_url: d.apk_asset_url ?? "",
          file_size_mb: d.file_size_mb ? String(d.file_size_mb) : "",
        });
        setPublicUpdatedAt(d.updated_at ?? null);
      }

      setLoading(false);
    };
    init();
  }, [router, status]);

  const handleSave = async () => {
    if (!form.apk_asset_url.trim()) { toast.error("Direct download URL daalo"); return; }
    if (!form.version_name.trim()) { toast.error("Version name daalo"); return; }
    if (!Number.isInteger(Number(form.version_code)) || Number(form.version_code) <= 0) {
      toast.error("Version code ek positive integer hona chahiye"); return;
    }
    if (/\/releases\/tag\//i.test(form.apk_asset_url)) {
      toast.error("Yeh GitHub release page hai, APK asset link nahi - .../releases/download/TAG/FILE.apk use karo");
      return;
    }
    const cleanSha256 = sanitizeSha256(form.sha256);
    if (cleanSha256 && !SHA256_RE.test(cleanSha256)) {
      toast.error(`SHA-256 exactly 64 hex characters ka hona chahiye (abhi ${cleanSha256.length} characters mile)`);
      return;
    }

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
        sha256: cleanSha256 ? cleanSha256.toLowerCase() : null,
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      toast.error(body.message || "Update failed");
    } else {
      toast.success("App update published! Existing users get a push notification now - the website's Download page is untouched.");
      setUpdatedAt(body.data?.updated_at ?? null);
    }
    setSaving(false);
  };

  const handleSavePublic = async () => {
    if (!publicForm.apk_asset_url.trim()) { toast.error("Direct download URL daalo"); return; }
    if (!publicForm.version_name.trim()) { toast.error("Version name daalo"); return; }

    setSavingPublic(true);
    const res = await fetch("/api/app/release/public-admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version_name: publicForm.version_name.trim(),
        release_notes: publicForm.release_notes.trim(),
        apk_asset_url: publicForm.apk_asset_url.trim(),
        file_size_mb: publicForm.file_size_mb ? Number(publicForm.file_size_mb) : null,
      }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      toast.error(body.message || "Update failed");
    } else {
      toast.success("Website Download page updated.");
      setPublicUpdatedAt(body.data?.updated_at ?? null);
    }
    setSavingPublic(false);
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
      <section className="pt-8 pb-16 md:pt-12 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 max-w-2xl space-y-8">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/admin")} variant="outline" size="icon" className="rounded-xl border-white/10 shrink-0">
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                App Release
              </h1>
              <p className="text-muted-foreground text-sm">
                Two independent sections below - publishing one never changes the other.
              </p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 1: In-app OTA update */}
          {/* ============================================================ */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
              <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(188,100%,50%,0.3), transparent 50%, hsla(188,100%,50%,0.3))" }} />
            </div>
            <div className="relative rounded-[calc(1rem-1px)] m-px p-6 space-y-5" style={{ background: "linear-gradient(165deg, hsla(188,100%,50%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Smartphone size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">In-App Update (OTA)</h2>
                  <p className="text-xs text-muted-foreground">
                    Pushes an update notification to everyone already using the app. Does NOT touch the website&apos;s Download page.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">VERSION NAME</label>
                  <input
                    type="text"
                    placeholder="1.2.0"
                    value={form.version_name}
                    onChange={(e) => setForm({ ...form, version_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">VERSION CODE</label>
                  <input
                    type="number"
                    placeholder="12"
                    value={form.version_code}
                    onChange={(e) => setForm({ ...form, version_code: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">APK LINK (GITHUB RELEASE)</label>
                <input
                  type="text"
                  placeholder="https://github.com/vk5457396-lab/myra_apk/releases/download/vX.Y.Z/app-release.apk"
                  value={form.apk_asset_url}
                  onChange={(e) => setForm({ ...form, apk_asset_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base font-mono focus:outline-none focus:border-cyan-500/50"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Preferred: the <span className="text-foreground/80">github.com/.../releases/download/TAG/FILE</span> link from the
                  <span className="text-foreground/80"> myra_apk</span> release (public repo, no login needed) — it never expires, unlike
                  MediaFire&apos;s CDN link which goes stale after a few hours and silently breaks installs (&quot;app not found&quot;) until
                  someone notices.{" "}
                  <span className="text-red-300/80">api.github.com</span> asset URLs still won&apos;t work (that&apos;s a different, auth-gated
                  API). MediaFire <span className="text-foreground/80">file page</span> links (ending in <span className="font-mono">/file</span>)
                  and other direct links (Drive/Dropbox) are still supported as a fallback.
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">FILE SIZE (MB, optional)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={form.file_size_mb}
                  onChange={(e) => setForm({ ...form, file_size_mb: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">SHA-256 CHECKSUM</label>
                <input
                  type="text"
                  placeholder="64-character hex digest of the exact APK file above"
                  value={form.sha256}
                  onChange={(e) => setForm({ ...form, sha256: sanitizeSha256(e.target.value) })}
                  spellCheck={false}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-foreground text-base font-mono focus:outline-none ${
                    form.sha256 && !SHA256_RE.test(form.sha256)
                      ? "border-red-500/50 focus:border-red-500/70"
                      : "border-white/10 focus:border-cyan-500/50"
                  }`}
                />
                {/* Live character count - this is the whole point: "64 hex characters required" means
                    nothing on its own if you can't see how many you actually pasted. */}
                {form.sha256.length > 0 && (
                  <p className={`text-xs mt-1.5 font-mono ${form.sha256.length === 64 ? "text-emerald-400/80" : "text-red-300/80"}`}>
                    {form.sha256.length} / 64 characters
                    {form.sha256.length !== 64 && form.sha256.length > 0 ? " - paste again, something got cut off or extra characters got added" : ""}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  The Android app rejects the download if this doesn&apos;t match the file it actually received - compute it
                  from the exact same file at the APK link above (e.g. <span className="font-mono text-foreground/80">sha256sum app-release.apk</span>),
                  never a different build. Leave blank to skip the checksum check (not recommended).
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">RELEASE NOTES (optional)</label>
                <textarea
                  placeholder="What's new in this version..."
                  value={form.release_notes}
                  onChange={(e) => setForm({ ...form, release_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-cyan-500/50 resize-none"
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
                {saving ? "Publishing..." : "Publish In-App Update"}
              </Button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SECTION 2: Public website Download page */}
          {/* ============================================================ */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
              <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(150,80%,45%,0.3), transparent 50%, hsla(150,80%,45%,0.3))" }} />
            </div>
            <div className="relative rounded-[calc(1rem-1px)] m-px p-6 space-y-5" style={{ background: "linear-gradient(165deg, hsla(150,80%,45%,0.04) 0%, hsla(220,20%,6%,0.97) 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
                  <Globe size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">Website Download Page</h2>
                  <p className="text-xs text-muted-foreground">
                    What codeninjavik.in/download (and the home/pricing download cards) show. Independent of the OTA section above - no push notification is sent.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">VERSION NAME</label>
                <input
                  type="text"
                  placeholder="1.2.0"
                  value={publicForm.version_name}
                  onChange={(e) => setPublicForm({ ...publicForm, version_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">APK LINK</label>
                <input
                  type="text"
                  placeholder="https://github.com/vk5457396-lab/myra_apk/releases/download/vX.Y.Z/app-release.apk"
                  value={publicForm.apk_asset_url}
                  onChange={(e) => setPublicForm({ ...publicForm, apk_asset_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base font-mono focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">FILE SIZE (MB, optional)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={publicForm.file_size_mb}
                  onChange={(e) => setPublicForm({ ...publicForm, file_size_mb: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-display tracking-wider mb-1.5 block">RELEASE NOTES (optional)</label>
                <textarea
                  placeholder="What's new in this version..."
                  value={publicForm.release_notes}
                  onChange={(e) => setPublicForm({ ...publicForm, release_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground text-base focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {publicUpdatedAt && (
                <p className="text-xs text-muted-foreground">Last updated: {new Date(publicUpdatedAt).toLocaleString()}</p>
              )}

              <Button
                onClick={handleSavePublic}
                disabled={savingPublic}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-display font-bold gap-2"
              >
                {savingPublic ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingPublic ? "Saving..." : "Update Website Download"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAppReleasePage;
