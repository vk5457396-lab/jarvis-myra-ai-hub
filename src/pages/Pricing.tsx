import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import BundleCard from "@/components/BundleCard";
import SourceCodeCard from "@/components/SourceCodeCard";
import PriceCountdown from "@/components/PriceCountdown";
import { jarvisFeatures, myraFeatures } from "@/data/features";
import { Check, Shield, CreditCard, Zap, Code } from "lucide-react";

// Dynamic product name and pricing based on date
const isAfterFeb1 = new Date() >= new Date('2026-02-01');
const myraName = isAfterFeb1 ? "MYRA 2.0" : "MYRA";
const jarvisPrice = 899; // Jarvis is always ₹899
const myraPrice = isAfterFeb1 ? 899 : 799; // MYRA increases on Feb 1st

const Pricing = () => {
  const [isOutsideIndia, setIsOutsideIndia] = useState(false);

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

      {/* International Payment Support - Only for users outside India */}
      {isOutsideIndia && (
        <section className="py-6">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="glass-card rounded-xl p-4 md:p-5 border border-amber-500/30 bg-amber-500/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-medium">
                      <span className="text-amber-400">International Payment Failed?</span> Pay via <span className="text-primary font-semibold">Binance</span> - DM us on Telegram!
                    </p>
                  </div>
                </div>
                <a
                  href="https://t.me/codeninjavik1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-display font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  @codeninjavik1
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Countdown Timer */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <PriceCountdown />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ProductCard name="Jarvis" tagline="AI System Assistant for power users" price={jarvisPrice} features={jarvisFeatures} variant="jarvis" delay={0.1} />
            <ProductCard name={myraName} tagline="AI Personal Voice Assistant for daily life" price={myraPrice} features={myraFeatures} variant="myra" delay={0.2} />
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