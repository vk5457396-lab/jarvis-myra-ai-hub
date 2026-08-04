"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Package, Download, Tag, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";

interface MarketProduct {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  category: string | null;
  price: number;
  thumbnail_url: string | null;
  download_count: number;
}

const Products = () => {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("marketplace_products")
        .select("id, title, slug, short_description, category, price, thumbnail_url, download_count")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (data) setProducts(data as MarketProduct[]);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.short_description ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q);
      const matchesC = category === "all" || p.category === category;
      return matchesQ && matchesC;
    });
  }, [products, query, category]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-28 pb-12 md:pt-36 md:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-cyan-400 font-display text-sm tracking-wider mb-4">
              <Sparkles size={16} /> PRODUCTS HUB
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                All Products & Downloads
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Browse premium and free downloads. Search, preview, and grab what you need.
            </p>
          </motion.div>

          {/* Search + filters */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products by name, category, or keyword..."
                className="pl-12 h-12 rounded-xl bg-background/40 border-white/10 backdrop-blur-md text-base"
              />
            </div>
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-1.5 rounded-full text-xs font-display font-bold tracking-wider uppercase transition-all border ${
                      category === c
                        ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-transparent"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/products/${p.slug}`} className="block group">
                    <div className="relative rounded-2xl overflow-hidden h-full">
                      <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                        <div className="absolute inset-[-200%] group-hover:animate-spin-slow" style={{ background: "conic-gradient(from 0deg, hsla(188,100%,50%,0.4), transparent 40%, hsla(263,70%,58%,0.4), transparent 80%, hsla(188,100%,50%,0.4))" }} />
                      </div>
                      <div className="relative rounded-[calc(1rem-1px)] m-px overflow-hidden" style={{ background: "linear-gradient(165deg, hsla(220,20%,8%,0.6) 0%, hsla(220,20%,4%,0.95) 100%)", backdropFilter: "blur(12px)" }}>
                        <div className="aspect-video bg-gradient-to-br from-cyan-500/10 to-violet-500/10 overflow-hidden">
                          {p.thumbnail_url ? (
                            <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package size={56} className="text-cyan-400/30" />
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            {p.category && (
                              <span className="text-[10px] font-display tracking-wider uppercase text-cyan-400/80">
                                {p.category}
                              </span>
                            )}
                            <span className={`text-xs font-display font-bold px-2.5 py-0.5 rounded-full ${p.price === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                              {p.price === 0 ? "FREE" : `₹${p.price}`}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-lg text-foreground group-hover:text-cyan-300 transition-colors line-clamp-1">
                            {p.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
                            {p.short_description || "Tap to view details and download."}
                          </p>
                          <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Download size={12} /> {p.download_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag size={12} /> {p.price === 0 ? "Free" : "Premium"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Products;