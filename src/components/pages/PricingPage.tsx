"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import BinancePaymentModal from "@/components/BinancePaymentModal";
import MyraAndroidDownload from "@/components/MyraAndroidDownload";

import { Check, Shield, CreditCard, Zap, Code, Wallet, Monitor, FileCode, ArrowRight, Package } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const thumbJarvis = "/assets/thumb-jarvis.png";
const thumbMyra = "/assets/thumb-myra.png";
const thumbAria = "/assets/thumb-aria.png";

const Pricing = () => {
  const router = useRouter();
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({ name: "", amount: 0 });
  const { formatPrice } = useCurrency();

  const openBinancePayment = (productName: string, amount: number) => {
    setSelectedProduct({ name: productName, amount });
    setShowBinanceModal(true);
  };

  const sourceAis = [
    { thumb: thumbJarvis, name: "Jarvis 2.0", hsl: "188 100% 50%" },
    { thumb: thumbMyra, name: "MYRA 2.0", hsl: "263 70% 58%" },
  ];

  const exeAis = [
    { thumb: thumbAria, name: "ARIA 1.0", hsl: "160 70% 50%" },
  ];

  const mainCategories = [
    {
      id: "source",
      title: "Source Code",
      tagline: "For developers — modify, extend & own it",
      icon: FileCode,
      hsl: "45 95% 55%",
      gradient: "from-yellow-400 via-amber-500 to-orange-500",
      badge: "💻 DEVELOPER",
      countLabel: "2 AIs + Bundle",
      thumbs: sourceAis,
      priceLabel: `Starts at ${formatPrice(3900)}`,
    },
    {
      id: "exe",
      title: ".exe File",
      tagline: "Ready to use — download, install & run",
      icon: Monitor,
      hsl: "160 70% 50%",
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      badge: "⚡ READY TO USE",
      countLabel: `${exeAis.length} AI Available`,
      thumbs: exeAis,
      priceLabel: `Starts at ${formatPrice(899)}`,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 rounded-full glass text-secondary font-display text-sm tracking-wider mb-6">
              CHOOSE YOUR CATEGORY
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Pick a <span className="text-aurora">Category</span> to Begin
            </h1>
            <p className="text-lg text-muted-foreground">
              Two simple categories. Click one to see all available AIs inside.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Marquee strip */}
      <section className="py-3 border-y border-white/5 bg-background/30 backdrop-blur-md overflow-hidden">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap text-sm font-display">
          {[...Array(2)].flatMap((_, k) =>
            [
              "⚡ Lifetime License",
              "🔒 Secure Razorpay & Crypto Checkout",
              "♾️ Free Future Updates",
              "🎁 Source Code from ₹3900",
              "🚀 Instant Delivery via Telegram",
              "💎 Premium Developer Support",
              "🌍 40+ Currencies Supported",
            ].map((t, i) => (
              <span key={`${k}-${i}`} className="text-foreground/70 hover:text-foreground transition-colors">{t}</span>
            ))
          )}
        </div>
      </section>

      {/* Two main category cards */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {mainCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02, y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/pricing/${cat.id}`)}
                  className="relative group cursor-pointer rounded-3xl overflow-hidden"
                >
                  {/* Animated rotating border */}
                  <div className="absolute inset-0 rounded-3xl p-px overflow-hidden">
                    <motion.div
                      className="absolute inset-[-200%]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                      style={{ background: `conic-gradient(from 0deg, hsla(${cat.hsl}, 0.6), transparent 30%, hsla(${cat.hsl}, 0.4), transparent 70%, hsla(${cat.hsl}, 0.6))` }}
                    />
                  </div>

                  <div
                    className="relative rounded-[calc(1.5rem-1px)] overflow-hidden m-px p-8 md:p-10 backdrop-blur-xl transition-all duration-500"
                    style={{ background: `linear-gradient(170deg, hsla(${cat.hsl}, 0.1) 0%, hsla(220, 15%, 8%, 0.96) 40%, hsla(220, 20%, 5%, 0.99) 100%)` }}
                  >
                    {/* Glow */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-20 group-hover:opacity-50 transition-all duration-700" style={{ background: `hsla(${cat.hsl}, 0.6)` }} />

                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <span className="inline-block text-[10px] font-display font-bold tracking-[0.18em] px-3 py-1.5 rounded-full border" style={{ background: `hsla(${cat.hsl}, 0.1)`, borderColor: `hsla(${cat.hsl}, 0.25)`, color: `hsla(${cat.hsl}, 1)` }}>
                        {cat.badge}
                      </span>
                      <span className="text-xs text-muted-foreground font-display">{cat.countLabel}</span>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-6 shadow-lg relative z-10`} style={{ boxShadow: `0 0 35px hsla(${cat.hsl}, 0.35)` }}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h2 className={`font-display text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r ${cat.gradient} bg-clip-text text-transparent`}>
                      {cat.title}
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">{cat.tagline}</p>

                    {/* AI thumbnails */}
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                      {cat.thumbs.map((ai) => (
                        <div
                          key={ai.name}
                          className="relative w-12 h-12 rounded-xl overflow-hidden border bg-background/50 backdrop-blur-sm"
                          style={{ borderColor: `hsla(${ai.hsl}, 0.4)`, boxShadow: `0 0 12px hsla(${ai.hsl}, 0.25)` }}
                          title={ai.name}
                        >
                          <img src={ai.thumb} alt={ai.name} loading="lazy" width={48} height={48} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-sm font-display font-bold" style={{ color: `hsla(${cat.hsl}, 1)` }}>{cat.priceLabel}</span>
                      <div className="flex items-center gap-2 text-sm font-display font-bold" style={{ color: `hsla(${cat.hsl}, 1)` }}>
                        <span>Explore</span>
                        <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MYRA Android APK download — free, sits alongside the paid categories */}
      <MyraAndroidDownload className="py-8 md:py-12" />

      {/* Crypto Section */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
            <div className="glass-card rounded-xl p-4 md:p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-display font-semibold text-foreground mb-1">
                      Crypto Payment via <span className="text-amber-400">Binance</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">Pay with USDT • International & Indian Users • Same prices as Razorpay</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1"><Code size={12} /> Source Code</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openBinancePayment("Source Code Bundle (Jarvis 2.0 + MYRA 2.0)", 6999)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-yellow-500/30">2-Bundle {formatPrice(6999)}</button>
                    <button onClick={() => openBinancePayment("Jarvis 2.0 Source Code", 3900)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-primary/30">Jarvis 2.0 {formatPrice(3900)}</button>
                    <button onClick={() => openBinancePayment("MYRA 2.0 Source Code", 3900)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-secondary/30">MYRA 2.0 {formatPrice(3900)}</button>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1 mt-3"><Package size={12} /> Products (.exe)</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openBinancePayment("ARIA 1.0 AI", 899)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-emerald-500/30">ARIA 1.0 {formatPrice(899)}</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <BinancePaymentModal isOpen={showBinanceModal} onClose={() => setShowBinanceModal(false)} productName={selectedProduct.name} amount={selectedProduct.amount} />

      {/* Flash Sale */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto"><FlashSaleBanner /></div>
        </div>
      </section>


      {/* What's Included */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">What's <span className="gradient-text">Included</span></h2>
            <p className="text-muted-foreground">Everything you need to get started</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Check, title: "Lifetime License", desc: "One-time payment, forever access" },
              { icon: Zap, title: "Instant Download", desc: "Get started within minutes" },
              { icon: Shield, title: "Free Updates", desc: "All future updates included" },
              { icon: CreditCard, title: "Secure Payment", desc: "100% safe checkout" },
            ].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="glass-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-gradient-neon flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-background" />
                </div>
                <h3 className="font-display text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;