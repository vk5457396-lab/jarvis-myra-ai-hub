"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Megaphone, Plus, Trash2, Power, UploadCloud } from "lucide-react";

interface BannerRow {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_active: boolean;
  created_at: string;
}

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

// Supabase Storage, not Blob - Blob's quota filled up, so new banner/notification uploads go
// here instead (see src/lib/supabaseStorage.ts). Existing Blob-hosted banners are untouched and
// keep loading exactly as before; this only changes where *new* uploads land. Public bucket, so
// the returned URL is already absolute and permanent - no proxy route needed like Blob's.
async function uploadBannerImage(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "banners");
    const res = await fetch("/api/admin/storage/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || "Upload failed");
    return json.data.url as string;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Image upload failed");
    return null;
  }
}

const emptyForm = { title: "", message: "", image_url: "", cta_label: "", cta_url: "" };

const BannerAdminPage = () => {
  const router = useRouter();
  const { status } = useSession();

  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadBannerImage(file);
    if (url) setForm((f) => ({ ...f, image_url: url }));
    setUploadingImage(false);
  };

  const loadBanners = useCallback(async () => {
    try {
      const data = await api("/api/admin/banners");
      setBanners(data.banners);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load banners");
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    (async () => {
      await loadBanners();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const createBanner = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setCreating(true);
    try {
      await api("/api/admin/banners", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          image_url: form.image_url || undefined,
          cta_label: form.cta_label || undefined,
          cta_url: form.cta_url || undefined,
        }),
      });
      toast.success("Banner created - it starts off. Turn it on when you're ready.");
      setForm(emptyForm);
      await loadBanners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create banner");
    } finally {
      setCreating(false);
    }
  };

  // Only one banner is meant to be shown at a time (see getActiveBanner on the server) - turning
  // one on here also turns every other one off, so the admin never has to remember to do it.
  const toggleActive = async (banner: BannerRow) => {
    setBusyId(banner.id);
    try {
      const turningOn = !banner.is_active;
      if (turningOn) {
        await Promise.all(
          banners
            .filter((b) => b.id !== banner.id && b.is_active)
            .map((b) => api(`/api/admin/banners/${b.id}`, { method: "PATCH", body: JSON.stringify({ is_active: false }) }))
        );
      }
      await api(`/api/admin/banners/${banner.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: turningOn }),
      });
      toast.success(turningOn ? "Banner is now live in the app" : "Banner turned off");
      await loadBanners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update banner");
    } finally {
      setBusyId(null);
    }
  };

  const removeBanner = async (banner: BannerRow) => {
    if (!confirm(`Delete "${banner.title}"? This can't be undone.`)) return;
    setBusyId(banner.id);
    try {
      await api(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
      toast.success("Banner deleted");
      await loadBanners();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete banner");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="license-admin flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="license-admin min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 10%, hsl(0 85% 55% / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, hsl(38 92% 55% / 0.14) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">App Banners</h1>
            <p className="text-sm text-muted-foreground">
              Event/promo popup shown once per app open on Android (e.g. Diwali, Independence Day).
            </p>
          </div>
        </div>

        {/* Create */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass mb-8 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/15 p-3">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">New banner</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Happy Diwali!" />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Image (optional)</Label>
              <div className="flex items-center gap-2">
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://... or upload" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload image"
                >
                  {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1 block text-xs">Message</Label>
              <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="MYRA wishes you a very Happy Diwali! Get 20% off today." />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Button label (optional)</Label>
              <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="Get the offer" />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Button link (optional)</Label>
              <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <Button onClick={createBanner} disabled={creating} className="mt-4">
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create banner
          </Button>
        </motion.div>

        {/* List */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/15 p-3">
              <Megaphone className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold">All banners</h2>
          </div>
          <div className="space-y-2">
            {banners.map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{b.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${b.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"}`}>
                      {b.is_active ? "LIVE" : "off"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{b.message}</p>
                  {b.cta_label && (
                    <p className="text-[10px] text-muted-foreground">Button: {b.cta_label} → {b.cta_url}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant={b.is_active ? "outline" : "default"}
                    disabled={busyId === b.id}
                    onClick={() => toggleActive(b)}
                  >
                    {busyId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === b.id}
                    onClick={() => removeBanner(b)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No banners yet - create one above.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BannerAdminPage;
