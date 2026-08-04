"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Package, ShieldCheck, Loader2, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ContactFormModal from "@/components/ContactFormModal";
import { invokeBackendFunction } from "@/lib/backend/invokeFunction";

interface MarketProduct {
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
  file_name: string | null;
  file_size: number | null;
  download_count: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const ProductPagePage = ({ slug }: { slug: string }) => {
  const router = useRouter();
  const [product, setProduct] = useState<MarketProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeShot, setActiveShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("marketplace_products")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (data) {
        const p = data as unknown as MarketProduct & { screenshots: unknown };
        const shots = Array.isArray(p.screenshots) ? (p.screenshots as string[]) : [];
        setProduct({ ...p, screenshots: shots });
        setActiveShot(p.banner_url || shots[0] || p.thumbnail_url || null);
      }
      setLoading(false);
    })();
  }, [slug]);

  const triggerBrowserDownload = (url: string, filename?: string) => {
    const a = document.createElement("a");
    a.href = url;
    if (filename) a.download = filename;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadFree = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const { data, error } = await invokeBackendFunction<{ download_url: string; error?: string }>(
        "marketplace-download",
        { product_id: product.id }
      );
      if (error || data?.error || !data?.download_url) {
        toast.error(data?.error || error?.message || "Download failed");
        return;
      }
      triggerBrowserDownload(data.download_url, product.file_name ?? undefined);
      toast.success("Download started!");
    } finally {
      setBusy(false);
    }
  };

  const buyAndDownload = async (contact: { name: string; email: string; phone: string }) => {
    if (!product) return;
    setBusy(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) {
        toast.error("Failed to load payment gateway");
        return;
      }
      const { data: order, error } = await invokeBackendFunction<{
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
        product_name: string;
        display_amount: number;
        error?: string;
      }>("marketplace-create-order", {
        product_id: product.id,
        customer_name: contact.name,
        customer_email: contact.email,
        customer_phone: contact.phone,
      });
      if (error || order?.error || !order?.order_id) {
        toast.error(order?.error || error?.message || "Could not start payment");
        return;
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "codeninjavik",
        description: `Purchase ${order.product_name}`,
        prefill: { name: contact.name, email: contact.email, contact: contact.phone },
        theme: { color: "#00D4FF" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const { data: dl, error: dlErr } = await invokeBackendFunction<{
            download_url: string;
            error?: string;
          }>("marketplace-download", {
            product_id: product.id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            customer_name: contact.name,
            customer_email: contact.email,
          });
          if (dlErr || dl?.error || !dl?.download_url) {
            toast.error(dl?.error || dlErr?.message || "Could not generate download");
            return;
          }
          triggerBrowserDownload(dl.download_url, product.file_name ?? undefined);
          toast.success("Payment successful! Download started.");
        },
        modal: { ondismiss: () => toast.info("Payment cancelled") },
      });
      rzp.open();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Package size={48} className="text-muted-foreground/40" />
          <p className="text-muted-foreground">Product not found.</p>
          <Link href="/products" className="text-cyan-400 underline">Back to products</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <Button variant="ghost" onClick={() => router.push("/products")} className="mb-6 text-muted-foreground hover:text-foreground gap-2">
            <ArrowLeft size={16} /> Back to Products
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
            {/* Left: gallery */}
            <div className="lg:col-span-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative rounded-2xl overflow-hidden border border-white/10 bg-background/40 backdrop-blur-md aspect-video">
                {activeShot ? (
                  <img src={activeShot} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package size={80} className="text-cyan-400/30" />
                  </div>
                )}
              </motion.div>

              {product.screenshots.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {(product.banner_url ? [product.banner_url, ...product.screenshots] : product.screenshots)
                    .slice(0, 8)
                    .map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveShot(s)}
                        className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          activeShot === s ? "border-cyan-400" : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <img src={s} alt={`shot ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Right: details */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                  <div className="absolute inset-[-200%]" style={{ background: "conic-gradient(from 0deg, hsla(188,100%,50%,0.4), transparent 40%, hsla(263,70%,58%,0.4), transparent 80%, hsla(188,100%,50%,0.4))" }} />
                </div>
                <div className="relative rounded-[calc(1rem-1px)] m-px p-6" style={{ background: "linear-gradient(165deg, hsla(220,20%,8%,0.65) 0%, hsla(220,20%,4%,0.95) 100%)", backdropFilter: "blur(12px)" }}>
                  {product.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-display font-bold tracking-wider uppercase mb-3">
                      <Tag size={10} /> {product.category}
                    </span>
                  )}
                  <h1 className="font-display text-2xl md:text-3xl font-black text-foreground">{product.title}</h1>
                  {product.short_description && (
                    <p className="text-muted-foreground mt-2">{product.short_description}</p>
                  )}

                  <div className="flex items-baseline gap-2 mt-5">
                    {product.price === 0 ? (
                      <span className="font-display text-4xl font-black text-emerald-400">FREE</span>
                    ) : (
                      <>
                        <span className="font-display text-4xl font-black bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">₹{product.price}</span>
                        <span className="text-xs text-muted-foreground">one-time</span>
                      </>
                    )}
                  </div>

                  <div className="mt-6 space-y-3">
                    {product.price === 0 ? (
                      <Button
                        onClick={downloadFree}
                        disabled={busy}
                        variant="neonCyan"
                        size="lg"
                        className="w-full rounded-xl gap-2"
                      >
                        {busy ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Download Free
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowContact(true)}
                        disabled={busy}
                        variant="neonCyan"
                        size="lg"
                        className="w-full rounded-xl gap-2"
                      >
                        {busy ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Buy & Download — ₹{product.price}
                      </Button>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      Secure payment · Instant download · Verified file
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 text-xs">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-muted-foreground">File</p>
                      <p className="font-mono text-foreground truncate">{product.file_name || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-mono text-foreground">{formatSize(product.file_size)}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 col-span-2">
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-display font-bold text-foreground">{product.download_count}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="max-w-6xl mx-auto mt-10">
              <div className="rounded-2xl border border-white/10 bg-background/40 backdrop-blur-md p-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-3">About this product</h2>
                <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {product.description}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ContactFormModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        onSubmit={(c) => {
          setShowContact(false);
          buyAndDownload(c);
        }}
        productName={product.title}
        accentHsl="188, 100%, 50%"
      />

      <Footer />
    </div>
  );
};

export default ProductPagePage;
