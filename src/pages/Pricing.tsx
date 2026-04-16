import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SourceCodeCard from "@/components/SourceCodeCard";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import BinancePaymentModal from "@/components/BinancePaymentModal";
import MobileAppComingSoon from "@/components/MobileAppComingSoon";
import { Check, Shield, CreditCard, Zap, Code, Wallet, Cpu, Sparkles, Heart, Music, ArrowRight, Package, FileCode, Monitor } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const categories = [
  {
    id: "jarvis",
    name: "Jarvis 2.0",
    tagline: "AI System Automation Assistant",
    icon: Cpu,
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    hsl: "188 100% 50%",
    badge: "⚡ POWER",
    hasExe: false,
    hasSource: true,
    exePrice: 0,
    sourcePrice: 3900,
    available: ["Source Code"],
  },
  {
    id: "myra",
    name: "MYRA 2.0",
    tagline: "AI Personal Voice Assistant",
    icon: Sparkles,
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    hsl: "263 70% 58%",
    badge: "🔥 POPULAR",
    hasExe: false,
    hasSource: true,
    exePrice: 0,
    sourcePrice: 3900,
    available: ["Source Code"],
  },
  {
    id: "aura",
    name: "AURA 1.0",
    tagline: "AI Girlfriend Companion",
    icon: Heart,
    gradient: "from-pink-400 via-rose-500 to-red-500",
    hsl: "330 80% 60%",
    badge: "💖 EMOTIONAL",
    hasExe: false,
    hasSource: true,
    exePrice: 0,
    sourcePrice: 3900,
    available: ["Source Code"],
  },
  {
    id: "aria",
    name: "ARIA 1.0",
    tagline: "AI Music & Creative Assistant",
    icon: Music,
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    hsl: "160 70% 50%",
    badge: "🎵 CREATIVE",
    hasExe: true,
    hasSource: false,
    exePrice: 899,
    sourcePrice: 0,
    available: [".exe File"],
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({ name: "", amount: 0 });
  const { formatPrice, currency, countryCode, setSelectedCountry } = useCurrency();

  const openBinancePayment = (productName: string, amount: number) => {
    setSelectedProduct({ name: productName, amount });
    setShowBinanceModal(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 rounded-full glass text-secondary font-display text-sm tracking-wider mb-6">
              SIMPLE PRICING
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              One-Time Payment, <span className="gradient-text">Lifetime Access</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              No subscriptions. No hidden fees. Choose your AI assistant and get started.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Binance Modal */}
      <BinancePaymentModal isOpen={showBinanceModal} onClose={() => setShowBinanceModal(false)} productName={selectedProduct.name} amount={selectedProduct.amount} />

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
                    <p className="text-sm text-muted-foreground">Pay with USDT • International & Indian Users • Fast & Secure</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1"><Code size={12} /> Source Code</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openBinancePayment("Source Code Bundle (Jarvis 2.0 + MYRA 2.0)", 5999)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-yellow-500/30">2-Bundle {formatPrice(5999)}</button>
                    <button onClick={() => openBinancePayment("All 3 Source Codes (Jarvis + MYRA + AURA)", 8999)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-pink-500/20 hover:from-amber-500/30 hover:to-pink-500/30 text-amber-300 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-amber-500/30">3-Bundle {formatPrice(8999)}</button>
                    <button onClick={() => openBinancePayment("Jarvis 2.0 Source Code", 3900)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-primary/30">Jarvis 2.0 {formatPrice(3900)}</button>
                    <button onClick={() => openBinancePayment("MYRA 2.0 Source Code", 3900)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-secondary/30">MYRA 2.0 {formatPrice(3900)}</button>
                    <button onClick={() => openBinancePayment("AURA 1.0 Source Code", 3900)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-pink-500/30">AURA 1.0 {formatPrice(3900)}</button>
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

      {/* Flash Sale */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto"><FlashSaleBanner /></div>
        </div>
      </section>

      {/* Category Cards - Each AI has its own clear card */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Choose Your <span className="gradient-text">AI Assistant</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Click on any AI to view & purchase available products</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {categories.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.04, y: -8 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/pricing/${cat.id}`)}
                  className="relative group cursor-pointer rounded-2xl overflow-hidden"
                >
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-2xl p-px overflow-hidden">
                    <motion.div
                      className="absolute inset-[-200%]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      style={{ background: `conic-gradient(from 0deg, hsla(${cat.hsl}, 0.5), transparent 30%, hsla(${cat.hsl}, 0.3), transparent 60%, hsla(${cat.hsl}, 0.5))` }}
                    />
                  </div>

                  <div
                    className="relative rounded-[calc(1rem-1px)] overflow-hidden m-px p-6 md:p-8 backdrop-blur-xl transition-all duration-500"
                    style={{ background: `linear-gradient(170deg, hsla(${cat.hsl}, 0.08) 0%, hsla(220, 15%, 8%, 0.98) 40%, hsla(220, 20%, 5%, 0.99) 100%)` }}
                  >
                    {/* Glow */}
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-all duration-700" style={{ background: `hsla(${cat.hsl}, 0.5)` }} />

                    {/* Badge */}
                    <span className="inline-block text-[10px] font-display font-bold tracking-[0.15em] px-3 py-1 rounded-full mb-5 border" style={{ background: `hsla(${cat.hsl}, 0.08)`, borderColor: `hsla(${cat.hsl}, 0.2)`, color: `hsla(${cat.hsl}, 0.9)` }}>
                      {cat.badge}
                    </span>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-5 shadow-lg`} style={{ boxShadow: `0 0 25px hsla(${cat.hsl}, 0.25)` }}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Name */}
                    <h3 className={`font-display text-2xl font-black mb-2 bg-gradient-to-r ${cat.gradient} bg-clip-text text-transparent`}>
                      {cat.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{cat.tagline}</p>

                    {/* Available products - clear labels */}
                    <div className="space-y-2 mb-5">
                      {cat.hasExe && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg border" style={{ background: `hsla(${cat.hsl}, 0.04)`, borderColor: `hsla(${cat.hsl}, 0.12)` }}>
                          <div className="flex items-center gap-2">
                            <Monitor size={13} style={{ color: `hsla(${cat.hsl}, 0.8)` }} />
                            <span className="text-xs text-foreground/70">.exe File</span>
                          </div>
                          <span className="text-xs font-display font-bold" style={{ color: `hsla(${cat.hsl}, 0.9)` }}>{formatPrice(cat.exePrice)}</span>
                        </div>
                      )}
                      {cat.hasSource && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-lg border" style={{ background: `hsla(${cat.hsl}, 0.04)`, borderColor: `hsla(${cat.hsl}, 0.12)` }}>
                          <div className="flex items-center gap-2">
                            <FileCode size={13} style={{ color: `hsla(${cat.hsl}, 0.8)` }} />
                            <span className="text-xs text-foreground/70">Source Code</span>
                          </div>
                          <span className="text-xs font-display font-bold" style={{ color: `hsla(${cat.hsl}, 0.9)` }}>{formatPrice(cat.sourcePrice)}</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 text-sm font-display font-bold" style={{ color: `hsla(${cat.hsl}, 0.9)` }}>
                      <span>View & Buy</span>
                      <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Source Code Bundles */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-yellow-400 font-display text-sm tracking-wider mb-6">
              <Code size={16} /> SOURCE CODE BUNDLES
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Save More with <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Bundles</span></h2>
            <p className="text-muted-foreground">Get multiple source codes at a discounted price</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <SourceCodeCard variant="bundle" />
            <SourceCodeCard variant="triple" />
          </div>
        </div>
      </section>

      {/* Mobile App */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto"><MobileAppComingSoon /></div>
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
