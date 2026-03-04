import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import BundleCard from "@/components/BundleCard";
import SourceCodeCard from "@/components/SourceCodeCard";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import BinancePaymentModal from "@/components/BinancePaymentModal";
import MobileAppComingSoon from "@/components/MobileAppComingSoon";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import ContactFormModal from "@/components/ContactFormModal";
import CurrencySelector from "@/components/CurrencySelector";
import { Button } from "@/components/ui/button";
import { jarvisFeatures, myraFeatures, auraFeatures } from "@/data/features";
import { Check, Shield, CreditCard, Zap, Code, Wallet } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

import { getMyraPrice, getMyraName, getJarvisName, getAuraName, getTripleBundlePrice } from "@/utils/flashSale";

const jarvisPrice = 899;
const myraPrice = getMyraPrice();
const myraName = getMyraName();
const jarvisName = getJarvisName();
const auraName = getAuraName();
const auraPrice = 899;
const tripleBundlePrice = getTripleBundlePrice();

const Pricing = () => {
  const [isOutsideIndia, setIsOutsideIndia] = useState(false);
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [showComboPayment, setShowComboPayment] = useState(false);
  const [showComboContactForm, setShowComboContactForm] = useState(false);
  const [comboCustomerInfo, setComboCustomerInfo] = useState({ name: "", email: "", phone: "" });
  const [selectedProduct, setSelectedProduct] = useState({ name: "", amount: 0 });
  const { formatPrice, isIndia, currency, countryCode, setSelectedCountry } = useCurrency();

  useEffect(() => {
    const checkLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code && data.country_code !== 'IN') {
          setIsOutsideIndia(true);
        }
      } catch (error) {
        console.log('Could not detect location');
      }
    };
    checkLocation();
  }, []);

  const openBinancePayment = (productName: string, amount: number) => {
    setSelectedProduct({ name: productName, amount });
    setShowBinanceModal(true);
  };

  const handleComboContactSubmit = (data: { name: string; email: string; phone: string }) => {
    setComboCustomerInfo(data);
    setShowComboContactForm(false);
    setShowComboPayment(true);
  };

  return <div className="min-h-screen">
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
              No subscriptions. No hidden fees. Pay once and enjoy your AI assistant forever.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Binance Payment Modal */}
      <BinancePaymentModal isOpen={showBinanceModal} onClose={() => setShowBinanceModal(false)} productName={selectedProduct.name} amount={selectedProduct.amount} />

      {/* Crypto section */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Products</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openBinancePayment("Jarvis 2.0 + MYRA 2.0 Bundle", 1499)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-amber-500/30">2-Bundle {formatPrice(1499)}</button>
                      <button onClick={() => openBinancePayment("Jarvis 2.0 + MYRA 2.0 + AURA 1.0 Combo", tripleBundlePrice)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-pink-500/20 hover:from-amber-500/30 hover:to-pink-500/30 text-amber-300 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-amber-500/30">3-Combo {formatPrice(tripleBundlePrice)}</button>
                      <button onClick={() => openBinancePayment("Jarvis 2.0 AI", jarvisPrice)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-primary/30">Jarvis 2.0 {formatPrice(jarvisPrice)}</button>
                      <button onClick={() => openBinancePayment(myraName, myraPrice)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-secondary/30">{myraName} {formatPrice(myraPrice)}</button>
                      <button onClick={() => openBinancePayment("AURA 1.0 AI", auraPrice)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-pink-500/30">AURA 1.0 {formatPrice(auraPrice)}</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1"><Code size={12} /> Source Code</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openBinancePayment("Source Code Bundle (Jarvis 2.0 + MYRA 2.0)", 4999)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-yellow-500/30">Bundle {formatPrice(4999)}</button>
                      <button onClick={() => openBinancePayment("Jarvis 2.0 Source Code", 3499)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-primary/30">Jarvis 2.0 {formatPrice(3499)}</button>
                      <button onClick={() => openBinancePayment(`${myraName} Source Code`, 3499)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-secondary/30">{myraName} {formatPrice(3499)}</button>
                    </div>
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

      {/* Bundle Deals */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">🎁 Special <span className="gradient-text">Bundle Offers</span></h2>
            <p className="text-muted-foreground">Get multiple assistants and save!</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <BundleCard />
            {/* Triple Combo */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative group rounded-[2rem] overflow-hidden transition-all duration-500"
            >
              {/* Animated border */}
              <div className="absolute inset-0 rounded-[2rem] p-px overflow-hidden">
                <motion.div className="absolute inset-[-200%]" animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  style={{ background: 'conic-gradient(from 0deg, hsla(188,100%,50%,0.4), transparent 25%, hsla(330,80%,60%,0.4), transparent 50%, hsla(263,70%,58%,0.4), transparent 75%, hsla(188,100%,50%,0.4))' }} />
              </div>

              <div className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px" style={{ background: 'linear-gradient(165deg, hsla(330,80%,60%,0.06) 0%, hsla(263,70%,58%,0.04) 20%, hsla(188,100%,50%,0.03) 35%, hsla(220,20%,6%,0.97) 50%, hsla(220,20%,4%,0.99) 100%)' }}>
                
                {/* Particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div key={i} className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-50"
                    style={{ background: ['hsla(188,100%,50%,0.8)', 'hsla(330,80%,60%,0.8)', 'hsla(263,70%,58%,0.8)'][i % 3], left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%` }}
                    animate={{ y: [0, -25, 0], opacity: [0, 0.5, 0] }} transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.3 }} />
                ))}

                {/* Glows */}
                <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-[80px] opacity-15 group-hover:opacity-35 transition-all duration-700" style={{ background: 'hsla(330,80%,60%,0.5)' }} />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full blur-[80px] opacity-10 group-hover:opacity-25 transition-all duration-700" style={{ background: 'hsla(188,100%,50%,0.4)' }} />

                {/* Mega Combo Badge */}
                <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
                  <motion.div
                    animate={{ boxShadow: ['0 4px 20px hsla(330,80%,60%,0.3)', '0 4px 35px hsla(330,80%,60%,0.5)', '0 4px 20px hsla(330,80%,60%,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-gradient-to-r from-cyan-500 via-pink-500 to-violet-500 px-7 py-2 rounded-b-2xl"
                  >
                    <span className="text-[10px] font-display font-black text-white tracking-[0.2em] flex items-center gap-1.5">
                      <Zap size={11} /> MEGA COMBO
                    </span>
                  </motion.div>
                </div>

                {/* Dot grid */}
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10 p-8 md:p-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-display tracking-[0.15em] mb-6 mt-5 backdrop-blur-sm border" style={{ background: 'linear-gradient(135deg, hsla(188,100%,50%,0.06), hsla(330,80%,60%,0.06), hsla(263,70%,58%,0.06))', borderColor: 'hsla(330,80%,60%,0.2)' }}>
                    <Zap size={13} className="text-pink-400" />
                    <span className="text-foreground/80">ALL 3 AI ASSISTANTS</span>
                  </div>

                  <h3 className="font-display text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
                    {jarvisName} + {myraName} + {auraName}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">Get all three AI assistants at the best price</p>

                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-display text-5xl md:text-6xl font-black text-foreground tracking-tight" style={{ textShadow: '0 0 40px hsla(330,80%,60%,0.2)' }}>{formatPrice(tripleBundlePrice)}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-muted-foreground line-through text-sm">{formatPrice(jarvisPrice + myraPrice + auraPrice)}</span>
                    <span className="text-[10px] font-display font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">SAVE {formatPrice(jarvisPrice + myraPrice + auraPrice - tripleBundlePrice)}</span>
                  </div>
                  <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
                  <div className="mb-7" />

                  <div className="h-px w-full mb-7" style={{ background: 'linear-gradient(to right, transparent, hsla(330,80%,60%,0.25), transparent)' }} />

                  <ul className="space-y-3 mb-9">
                    {[
                      `All ${jarvisName} features included`,
                      `All ${myraName} features included`,
                      `All ${auraName} features included`,
                      `Save ${formatPrice(jarvisPrice + myraPrice + auraPrice - tripleBundlePrice)} on combo`,
                      "Priority support",
                      "Free lifetime updates",
                    ].map((feature, index) => (
                      <motion.li key={index} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + index * 0.05 }} className="flex items-start gap-3 group/item">
                        <motion.div whileHover={{ scale: 1.2 }} className="w-5 h-5 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 via-pink-500 to-violet-500 flex-shrink-0 mt-0.5" style={{ boxShadow: '0 0 10px hsla(330,80%,60%,0.3)' }}>
                          <Check size={11} className="text-white" strokeWidth={3} />
                        </motion.div>
                        <span className="text-foreground/75 text-sm leading-relaxed group-hover/item:text-foreground/90 transition-colors">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="neonPink"
                      size="xl"
                      className="w-full bg-gradient-to-r from-cyan-500 via-pink-500 to-violet-500 hover:opacity-90 font-black text-base tracking-wide relative overflow-hidden group/btn"
                      onClick={() => setShowComboContactForm(true)}
                    >
                      <motion.div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", width: "50%" }} />
                      <Zap size={16} className="mr-2 relative z-10" />
                      <span className="relative z-10">Get Mega Combo</span>
                    </Button>
                  </motion.div>

                  <p className="text-center text-[10px] text-muted-foreground mt-4 tracking-wide">
                    ⚡ Instant delivery • ♾️ Lifetime access • 🔄 Free updates
                  </p>
                </div>

                {/* Bottom reflection */}
                <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, hsla(330,80%,60%,0.02), transparent)' }} />
              </div>

              <ContactFormModal isOpen={showComboContactForm} onClose={() => setShowComboContactForm(false)} onSubmit={handleComboContactSubmit} productName={`${jarvisName} + ${myraName} + ${auraName} Mega Combo`} accentHsl="330 80% 60%" />
              <PaymentGatewaySelector isOpen={showComboPayment} onClose={() => setShowComboPayment(false)} productId="combo_all" customerName={comboCustomerInfo.name} customerEmail={comboCustomerInfo.email} customerPhone={comboCustomerInfo.phone} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Individual Pricing */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Or Choose <span className="gradient-text">Individual</span></h2>
            <p className="text-muted-foreground">Pick the assistant that fits your needs</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ProductCard name={jarvisName} tagline="AI System Assistant for power users" price={jarvisPrice} features={jarvisFeatures} variant="jarvis" delay={0.1} />
            <ProductCard name={myraName} tagline="AI Personal Voice Assistant for daily life" price={myraPrice} features={myraFeatures} variant="myra" delay={0.2} />
            <ProductCard name={auraName} tagline="Your AI Girlfriend - Smart & Caring Companion" price={auraPrice} features={auraFeatures} variant="aura" delay={0.3} />
          </div>
        </div>
      </section>

      {/* Mobile App */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto"><MobileAppComingSoon /></div>
        </div>
      </section>

      {/* Source Code Section */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-yellow-400 font-display text-sm tracking-wider mb-6">
              <Code size={16} /> FOR DEVELOPERS
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Want to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Build Your Own?</span></h2>
            <p className="text-muted-foreground">Get the complete source code and create your custom AI assistant</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <SourceCodeCard variant="bundle" />
            <SourceCodeCard variant="triple" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
            <h3 className="font-display text-xl md:text-2xl font-bold mb-2">Or Buy <span className="gradient-text">Individual</span> Source Code</h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <SourceCodeCard variant="jarvis" />
            <SourceCodeCard variant="myra" />
            <SourceCodeCard variant="aura" />
          </div>
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
              { icon: CreditCard, title: "Secure Payment", desc: "100% safe Razorpay checkout" },
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
    </div>;
};
export default Pricing;
