"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Megaphone, Pencil, Power, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferCard, type SiteOffer } from "@/components/SiteOfferPopup";

interface SiteBannerRow extends SiteOffer {
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

type FormState = {
  title: string;
  message: string;
  badge: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  starts_at: string;
  ends_at: string;
};

const emptyForm: FormState = {
  title: "",
  message: "",
  badge: "",
  cta_label: "",
  cta_url: "",
  image_url: "",
  starts_at: "",
  ends_at: "",
};

const fieldClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30";

async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { ...opts, headers: { "content-type": "application/json", ...(opts.headers || {}) } });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Request failed");
  return json.data;
}

/** ISO → value for <input type="datetime-local"> in the admin's own timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function statusOf(b: SiteBannerRow): { label: string; className: string } {
  const now = Date.now();
  if (!b.is_active) return { label: "Off", className: "bg-white/10 text-muted-foreground" };
  if (b.ends_at && new Date(b.ends_at).getTime() <= now) return { label: "Ended", className: "bg-white/10 text-muted-foreground" };
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return { label: "Scheduled", className: "bg-amber-500/20 text-amber-300" };
  return { label: "Live", className: "bg-emerald-500/20 text-emerald-300" };
}

const formatWhen = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null;

/**
 * Admin: create and schedule the event/offer popup visitors see when they open the website.
 * Only one popup is live at a time — turning one on turns the others off.
 */
const SiteBannerManager = () => {
  const [banners, setBanners] = useState<SiteBannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api("/api/admin/site-banners");
      setBanners(data.banners);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load popups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "site-offers");
      const res = await fetch("/api/admin/storage/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Upload failed");
      setForm((f) => ({ ...f, image_url: json.data.url }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const payload = () => ({
    title: form.title.trim(),
    message: form.message.trim(),
    badge: form.badge.trim() || null,
    cta_label: form.cta_label.trim() || null,
    cta_url: form.cta_url.trim() || null,
    image_url: form.image_url.trim() || null,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
  });

  const save = async (activate: boolean) => {
    if (!form.title.trim()) {
      toast.error("Add a title for the popup");
      return;
    }
    if (form.cta_label.trim() && !form.cta_url.trim()) {
      toast.error("Add a link for the button, or clear the button text");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api(`/api/admin/site-banners/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ ...payload(), ...(activate ? { is_active: true } : {}) }),
        });
        toast.success(activate ? "Popup updated and live" : "Popup updated");
      } else {
        await api("/api/admin/site-banners", { method: "POST", body: JSON.stringify({ ...payload(), activate }) });
        toast.success(activate ? "Popup is live" : "Popup saved as off");
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save popup");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (b: SiteBannerRow) => {
    setBusyId(b.id);
    try {
      await api(`/api/admin/site-banners/${b.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !b.is_active }) });
      toast.success(b.is_active ? "Popup turned off" : "Popup is live");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update popup");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await api(`/api/admin/site-banners/${id}`, { method: "DELETE" });
      toast.success("Popup deleted");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete popup");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const startEdit = (b: SiteBannerRow) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      message: b.message || "",
      badge: b.badge || "",
      cta_label: b.cta_label || "",
      cta_url: b.cta_url || "",
      image_url: b.image_url || "",
      starts_at: toLocalInput(b.starts_at),
      ends_at: toLocalInput(b.ends_at),
    });
    document.getElementById("offer-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const previewOffer: SiteOffer = {
    id: "preview",
    title: form.title || "Your popup title",
    message: form.message,
    image_url: form.image_url || null,
    cta_label: form.cta_label || null,
    cta_url: form.cta_url || (form.cta_label ? "#" : null),
    badge: form.badge || null,
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form
          id="offer-form"
          onSubmit={(e) => { e.preventDefault(); save(true); }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4 scroll-mt-24"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Megaphone size={18} className="text-primary" aria-hidden="true" />
              {editingId ? "Edit popup" : "New offer popup"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm(emptyForm); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-11 px-2"
              >
                <X size={14} aria-hidden="true" /> Cancel edit
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Visitors see this once per visit when they open the website. Only one popup can be live at a time.
          </p>

          <div>
            <label htmlFor="of-title" className="block text-sm text-foreground mb-1.5">Title</label>
            <input id="of-title" required maxLength={120} placeholder="Diwali sale: MYRA at ₹699" value={form.title} onChange={set("title")} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="of-message" className="block text-sm text-foreground mb-1.5">Message</label>
            <textarea id="of-message" rows={3} maxLength={500} placeholder="Lifetime access, today only." value={form.message} onChange={set("message")} className={`${fieldClass} resize-y`} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="of-badge" className="block text-sm text-foreground mb-1.5">Badge <span className="text-muted-foreground">(optional)</span></label>
              <input id="of-badge" maxLength={24} placeholder="30% OFF" value={form.badge} onChange={set("badge")} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="of-cta-label" className="block text-sm text-foreground mb-1.5">Button text</label>
              <input id="of-cta-label" maxLength={40} placeholder="Get the offer" value={form.cta_label} onChange={set("cta_label")} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="of-cta-url" className="block text-sm text-foreground mb-1.5">Button link</label>
              <input id="of-cta-url" maxLength={2048} placeholder="/pricing" value={form.cta_url} onChange={set("cta_url")} className={fieldClass} aria-describedby="of-cta-help" />
            </div>
          </div>
          <p id="of-cta-help" className="text-xs text-muted-foreground -mt-2">A page on this site like /pricing, or a full https:// link.</p>

          <div>
            <span className="block text-sm text-foreground mb-1.5">Image <span className="text-muted-foreground">(optional, 16:9 works best)</span></span>
            <div className="flex flex-wrap items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" id="of-image" />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl gap-2 min-h-11">
                {uploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <UploadCloud size={16} aria-hidden="true" />}
                {uploading ? "Uploading..." : form.image_url ? "Replace image" : "Upload image"}
              </Button>
              {form.image_url && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="text-sm text-muted-foreground hover:text-foreground min-h-11 px-2">
                  Remove image
                </button>
              )}
            </div>
          </div>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="text-sm text-foreground mb-1.5">Schedule <span className="text-muted-foreground">(optional — leave empty to run until you turn it off)</span></legend>
            <div>
              <label htmlFor="of-start" className="block text-xs text-muted-foreground mb-1.5">Starts</label>
              <input id="of-start" type="datetime-local" value={form.starts_at} onChange={set("starts_at")} className={`${fieldClass} [color-scheme:dark]`} />
            </div>
            <div>
              <label htmlFor="of-end" className="block text-xs text-muted-foreground mb-1.5">Ends</label>
              <input id="of-end" type="datetime-local" value={form.ends_at} onChange={set("ends_at")} className={`${fieldClass} [color-scheme:dark]`} />
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => save(false)} className="rounded-xl min-h-11">
              {editingId ? "Save changes" : "Save as off"}
            </Button>
            <Button type="submit" disabled={saving} className="rounded-xl min-h-11 font-display font-bold">
              {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : editingId ? "Save and go live" : "Publish popup"}
            </Button>
          </div>
        </form>

        <div className="lg:sticky lg:top-24 self-start">
          <p className="text-sm text-muted-foreground mb-3">Preview</p>
          <div className="rounded-3xl bg-black/60 p-4 sm:p-6">
            <OfferCard offer={previewOffer} onClose={() => {}} preview />
          </div>
        </div>
      </div>

      <section aria-labelledby="offer-list-heading">
        <h3 id="offer-list-heading" className="font-display text-base font-bold text-foreground mb-3">All popups</h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" aria-label="Loading popups" /></div>
        ) : banners.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-muted-foreground">
            No popups yet. Create one above and publish it.
          </p>
        ) : (
          <ul className="space-y-3">
            {banners.map((b) => {
              const st = statusOf(b);
              const start = formatWhen(b.starts_at);
              const end = formatWhen(b.ends_at);
              return (
                <li key={b.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
                  {b.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image_url} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover bg-muted" />
                  ) : (
                    <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                      <Megaphone size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${st.className}`}>{st.label}</span>
                      {b.badge && <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">{b.badge}</span>}
                    </div>
                    <p className="mt-1.5 font-medium text-foreground truncate">{b.title}</p>
                    {(start || end) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {start ? `From ${start}` : "Now"}{end ? ` until ${end}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => toggle(b)}
                      disabled={busyId === b.id}
                      variant={b.is_active ? "outline" : "default"}
                      className="rounded-lg gap-1.5 min-h-10"
                    >
                      <Power size={14} aria-hidden="true" /> {b.is_active ? "Turn off" : "Go live"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(b)} className="rounded-lg gap-1.5 min-h-10">
                      <Pencil size={14} aria-hidden="true" /> Edit
                    </Button>
                    {confirmDeleteId === b.id ? (
                      <>
                        <Button size="sm" onClick={() => remove(b.id)} disabled={busyId === b.id} className="rounded-lg min-h-10 bg-red-600 hover:bg-red-700">
                          Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)} className="rounded-lg min-h-10">
                          Keep
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDeleteId(b.id)}
                        aria-label={`Delete popup: ${b.title}`}
                        className="rounded-lg min-h-10 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SiteBannerManager;
