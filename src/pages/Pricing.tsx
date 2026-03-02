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
import { jarvisFeatures, myraFeatures, auraFeatures } from "@/data/features";
import { Check, Shield, CreditCard, Zap, Code, Wallet } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

import { getMyraPrice, getMyraName } from "@/utils/flashSale";

const jarvisPrice = 899;
const myraPrice = getMyraPrice();
const myraName = getMyraName();
const auraPrice = 899;

const Pricing = () => {
  const [isOutsideIndia, setIsOutsideIndia] = useState(false);
  const [showBinanceModal, setShowBinanceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({ name: "", amount: 0 });
  const { formatPrice, isIndia, currency } = useCurrency();

  useEffect(() => {
    const checkLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        // Show banner only if user is NOT in India
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

  return <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5
        }} className="text-center max-w-3xl mx-auto">
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
      <BinancePaymentModal
        isOpen={showBinanceModal}
        onClose={() => setShowBinanceModal(false)}
        productName={selectedProduct.name}
        amount={selectedProduct.amount}
      />

      {/* International Payment Support - Always visible for crypto payments */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <div className="glass-card rounded-xl p-4 md:p-6 border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-display font-semibold text-foreground mb-1">
                      Crypto Payment via <span className="text-amber-400">Binance</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Pay with USDT • International & Indian Users • Fast & Secure
                    </p>
                  </div>
                </div>
                
                {/* Product Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Regular Products */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Products</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openBinancePayment("Jarvis + MYRA Bundle", 1499)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-amber-500/30"
                      >
                        Bundle {formatPrice(1499)}
                      </button>
                      <button
                        onClick={() => openBinancePayment("Jarvis AI", jarvisPrice)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-primary/30"
                      >
                        Jarvis {formatPrice(jarvisPrice)}
                      </button>
                      <button
                        onClick={() => openBinancePayment(myraName, myraPrice)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-secondary/30"
                      >
                        {myraName} {formatPrice(myraPrice)}
                      </button>
                      <button
                        onClick={() => openBinancePayment("AURA AI", auraPrice)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-pink-500/30"
                      >
                        AURA AI {formatPrice(auraPrice)}
                      </button>
                    </div>
                  </div>
                  
                  {/* Source Code */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                      <Code size={12} /> Source Code
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openBinancePayment("Source Code Bundle (Jarvis + MYRA)", 4999)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-display font-semibold text-sm transition-colors whitespace-nowrap border border-yellow-500/30"
                      >
                        Bundle {formatPrice(4999)}
                      </button>
                      <button
                        onClick={() => openBinancePayment("Jarvis Source Code", 3499)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-primary/30"
                      >
                        Jarvis {formatPrice(3499)}
                      </button>
                      <button
                        onClick={() => openBinancePayment(`${myraName} Source Code`, 3499)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary font-display font-semibold text-sm transition-colors whitespace-nowrap border border-secondary/30"
                      >
                        {myraName} {formatPrice(3499)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flash Sale Banner */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <FlashSaleBanner />
          </div>
        </div>
      </section>

      {/* Bundle Deal - Featured */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              🎁 Special <span className="gradient-text">Bundle Offer</span>
            </h2>
            <p className="text-muted-foreground">Get both assistants and save!</p>
          </motion.div>
          <div className="max-w-md mx-auto">
            <BundleCard />
          </div>
        </div>
      </section>

      {/* Individual Pricing Cards */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Or Choose <span className="gradient-text">Individual</span>
            </h2>
            <p className="text-muted-foreground">Pick the assistant that fits your needs</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <ProductCard name="Jarvis" tagline="AI System Assistant for power users" price={jarvisPrice} features={jarvisFeatures} variant="jarvis" delay={0.1} />
            <ProductCard name={myraName} tagline="AI Personal Voice Assistant for daily life" price={myraPrice} features={myraFeatures} variant="myra" delay={0.2} />
            <ProductCard name="AURA AI" tagline="Your AI Girlfriend - Smart & Caring Companion" price={auraPrice} features={auraFeatures} variant="aura" delay={0.3} />
          </div>
        </div>
      </section>

      {/* Mobile App Coming Soon */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <MobileAppComingSoon />
          </div>
        </div>
      </section>

      {/* Source Code Section */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-yellow-400 font-display text-sm tracking-wider mb-6">
              <Code size={16} />
              FOR DEVELOPERS
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Want to <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Build Your Own?</span>
            </h2>
            <p className="text-muted-foreground">Get the complete source code and create your custom AI assistant</p>
          </motion.div>
          
          {/* Source Code Bundle - Featured */}
          <div className="max-w-lg mx-auto mb-12">
            <SourceCodeCard variant="bundle" />
          </div>

          {/* Individual Source Code Cards */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-8">
            <h3 className="font-display text-xl md:text-2xl font-bold mb-2">
              Or Buy <span className="gradient-text">Individual</span> Source Code
            </h3>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <SourceCodeCard variant="jarvis" />
            <SourceCodeCard variant="myra" />
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What's <span className="gradient-text">Included</span>
            </h2>
            <p className="text-muted-foreground">Everything you need to get started</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[{
            icon: Check,
            title: "Lifetime License",
            desc: "One-time payment, forever access"
          }, {
            icon: Zap,
            title: "Instant Download",
            desc: "Get started within minutes"
          }, {
            icon: Shield,
            title: "Free Updates",
            desc: "All future updates included"
          }, {
            icon: CreditCard,
            title: "Secure Payment",
            desc: "100% safe Razorpay checkout"
          }].map((item, index) => <motion.div key={index} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            delay: index * 0.1
          }} className="glass-card rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-gradient-neon flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-background" />
                </div>
                <h3 className="font-display text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>)}
          </div>
        </div>
      </section>


      <Footer />
    </div>;
};
export default Pricing;
