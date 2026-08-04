"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Plus, UploadCloud, Trash2, ImageIcon, Loader2, Save, X, Edit3, Package, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminProduct {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string | null;
  price: number;
  thumbnail_url: string | null;
  banner_url: string | null;
  screenshots: string[];
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  is_published: boolean;
  download_count: number;
  created_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

const SIGN_EXPIRY = 60 * 60 * 24 * 365 * 5; // 5 years

const uploadToMedia = async (file: File, prefix: string): Promise<string | null> => {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("marketplace-media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    toast.error(`Upload failed: ${error.message}`);
    return null;
  }
  const { data: signed } = await supabase.storage.from("marketplace-media").createSignedUrl(path, SIGN_EXPIRY);
  return signed?.signedUrl ?? null;
};

const uploadToFiles = async (file: File): Promise<{ path: string; name: string; size: number } | null> => {
  const ext = file.name.split(".").pop() || "bin";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("marketplace-files").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    toast.error(`File upload failed: ${error.message}`);
    return null;
  }
  return { path, name: file.name, size: file.size };
};

const emptyDraft = () => ({
  id: "",
  title: "",
  slug: "",
  short_description: "",
  description: "",
  category: "general",
  price: 0,
  thumbnail_url: "",
  banner_url: "",
  screenshots: [] as string[],
  file_path: "",
  file_name: "",
  file_size: 0,
  is_published: true,
});

type Draft = ReturnType<typeof emptyDraft>;

const AdminProductsTab = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marketplace_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setProducts(
        (data as unknown as AdminProduct[]).map((p) => ({
          ...p,
          screenshots: Array.isArray(p.screenshots) ? p.screenshots : [],
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => setEditing(emptyDraft());

  const startEdit = (p: AdminProduct) =>
    setEditing({
      id: p.id,
      title: p.title,
      slug: p.slug,
      short_description: p.short_description ?? "",
      description: p.description ?? "",
      category: p.category ?? "general",
      price: p.price,
      thumbnail_url: p.thumbnail_url ?? "",
      banner_url: p.banner_url ?? "",
      screenshots: p.screenshots ?? [],
      file_path: p.file_path ?? "",
      file_name: p.file_name ?? "",
      file_size: p.file_size ?? 0,
      is_published: p.is_published,
    });

  const handleImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "thumbnail_url" | "banner_url"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingField(field);
    const url = await uploadToMedia(file, field);
    if (url) setEditing({ ...editing, [field]: url });
    setUploadingField(null);
    e.target.value = "";
  };

  const handleScreenshots = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !editing) return;
    setUploadingField("screenshots");
    const urls: string[] = [];
    for (const f of files) {
      const u = await uploadToMedia(f, "screenshots");
      if (u) urls.push(u);
    }
    setEditing({ ...editing, screenshots: [...editing.screenshots, ...urls] });
    setUploadingField(null);
    e.target.value = "";
  };

  const handleFile = async (file: File) => {
    if (!editing) return;
    setUploadingField("file");
    const res = await uploadToFiles(file);
    if (res) {
      setEditing({
        ...editing,
        file_path: res.path,
        file_name: res.name,
        file_size: res.size,
      });
    }
    setUploadingField(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeScreenshot = (url: string) => {
    if (!editing) return;
    setEditing({ ...editing, screenshots: editing.screenshots.filter((s) => s !== url) });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editing.file_path) {
      toast.error("Please upload a downloadable file");
      return;
    }
    setSaving(true);
    const slug = (editing.slug || slugify(editing.title)) || `product-${Date.now()}`;
    const payload = {
      title: editing.title.trim(),
      slug,
      short_description: editing.short_description || null,
      description: editing.description || null,
      category: editing.category || "general",
      price: Number(editing.price) || 0,
      thumbnail_url: editing.thumbnail_url || null,
      banner_url: editing.banner_url || null,
      screenshots: editing.screenshots,
      file_path: editing.file_path,
      file_name: editing.file_name,
      file_size: editing.file_size,
      is_published: editing.is_published,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from("marketplace_products").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("marketplace_products").insert(payload));
    }
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing.id ? "Product updated" : "Product created");
    setEditing(null);
    load();
  };

  const remove = async (p: AdminProduct) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    const { error } = await supabase.from("marketplace_products").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    load();
  };

  const togglePublish = async (p: AdminProduct) => {
    const { error } = await supabase
      .from("marketplace_products")
      .update({ is_published: !p.is_published })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else load();
  };

  const filtered = products.filter(
    (p) =>
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9 h-10 bg-background/40 border-white/10"
          />
        </div>
        <Button onClick={startNew} className="gap-2">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed border-white/10 rounded-2xl">
          <Package size={36} className="mx-auto mb-2 opacity-40" />
          No products yet. Click <span className="text-cyan-400">Add Product</span> to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="relative rounded-2xl overflow-hidden border border-white/10 bg-background/40 backdrop-blur-md">
              <div className="aspect-video bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="text-cyan-400/30" size={48} />
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-foreground line-clamp-1">{p.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${p.price === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                    {p.price === 0 ? "FREE" : `₹${p.price}`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                  {p.short_description || "—"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{p.category}</span>
                  <span>·</span>
                  <span>{p.download_count} downloads</span>
                  <span>·</span>
                  <button
                    onClick={() => togglePublish(p)}
                    className={p.is_published ? "text-emerald-400" : "text-amber-400"}
                  >
                    {p.is_published ? "Published" : "Hidden"}
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="gap-1.5 flex-1">
                    <Edit3 size={12} /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(p)} className="gap-1.5 text-red-400 border-red-400/30 hover:bg-red-500/10">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={() => setEditing(null)}>
          <div
            className="relative w-full max-w-3xl my-8 rounded-2xl border border-white/10 bg-[hsl(220,20%,6%)] p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
              <X size={16} />
            </button>
            <h2 className="font-display text-xl font-black mb-5">
              {editing.id ? "Edit Product" : "New Product"}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                    placeholder="My Awesome Product"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
                  <Input
                    value={editing.slug}
                    onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <Input
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="ebook, tool, theme..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Price (₹) — 0 for free</label>
                  <Input
                    type="number"
                    value={editing.price}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Short description</label>
                <Input
                  value={editing.short_description}
                  onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                  placeholder="One line summary"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full description</label>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={5}
                  className="w-full rounded-md bg-background/40 border border-white/10 p-3 text-sm text-foreground"
                  placeholder="What is this product? Features, instructions, what's included..."
                />
              </div>

              {/* Thumbnail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Thumbnail</label>
                  <label className="block aspect-video rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-400/50 cursor-pointer overflow-hidden bg-background/40">
                    {editing.thumbnail_url ? (
                      <img src={editing.thumbnail_url} alt="thumb" className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                        {uploadingField === "thumbnail_url" ? <Loader2 className="animate-spin" /> : <ImageIcon size={24} />}
                        Click to upload
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, "thumbnail_url")} />
                  </label>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Banner</label>
                  <label className="block aspect-video rounded-lg border-2 border-dashed border-white/10 hover:border-violet-400/50 cursor-pointer overflow-hidden bg-background/40">
                    {editing.banner_url ? (
                      <img src={editing.banner_url} alt="banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                        {uploadingField === "banner_url" ? <Loader2 className="animate-spin" /> : <ImageIcon size={24} />}
                        Click to upload
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, "banner_url")} />
                  </label>
                </div>
              </div>

              {/* Screenshots */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Screenshots (multiple)</label>
                <div className="flex flex-wrap gap-2">
                  {editing.screenshots.map((s) => (
                    <div key={s} className="relative w-24 h-16 rounded-md overflow-hidden border border-white/10">
                      <img src={s} alt="ss" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(s)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-16 rounded-md border-2 border-dashed border-white/10 hover:border-cyan-400/50 cursor-pointer flex items-center justify-center text-muted-foreground">
                    {uploadingField === "screenshots" ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleScreenshots} />
                  </label>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Downloadable file *</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                    dragOver ? "border-cyan-400 bg-cyan-500/5" : "border-white/10 bg-background/40 hover:border-white/30"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingField === "file" ? (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="animate-spin" size={16} /> Uploading...
                    </div>
                  ) : editing.file_path ? (
                    <div>
                      <p className="text-foreground font-mono text-sm break-all">{editing.file_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((editing.file_size || 0) / 1024 / 1024).toFixed(2)} MB · Click or drop to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UploadCloud size={32} />
                      <p className="text-sm">Drag & drop a file here, or click to browse</p>
                      <p className="text-xs">ZIP, PDF, EXE, MP4 — any file type</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.is_published}
                  onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Published (visible on /products)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button onClick={save} disabled={saving} className="gap-2 flex-1">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {editing.id ? "Update Product" : "Create Product"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminProductsTab;