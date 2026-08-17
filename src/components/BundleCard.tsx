"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Gift, Users, ArrowRight, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import ContactFormModal from "@/components/ContactFormModal";
import { usePurchaseCounts } from "@/hooks/usePurchaseCounts";
import { getMyraPrice, getMyraName, getBundlePrice, getJarvisName } from "@/utils/flashSale";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

const BundleCard = () => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "" });
  const { data: purchaseCounts } = usePurchaseCounts();
  const { formatPrice, currency, countryCode, setSelectedCountry } = useCurrency();
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 25 });
  const rotateX = useTransform(springY, [0, 1], [4, -4]);
  const rotateY = useTransform(springX, [0, 1], [-4, 4]);

  const jarvisPrice = 899;
  const myraPrice = getMyraPrice();
  const bundlePrice = getBundlePrice();
  const originalPrice = jarvisPrice + myraPrice;
  const savings = originalPrice - bundlePrice;
  const myraName = getMyraName();
  const jarvisName = getJarvisName();
  const bundleSoldCount = purchaseCounts?.bundle || 0;

  const hsl = "0 72% 51%";
  const hsl2 = "350 65% 40%";

  const bundleFeatures = [
    `Both ${jarvisName} & ${myraName} included`,
    `Save ${formatPrice(savings)} on bundle`,
    `All ${jarvisName} features`,
    `All ${myraName} features`,
    "Priority support",
    "Free lifetime updates",
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleContactSubmit = (data: { name: string; email: string; phone: string }) => {
    setCustomerInfo(data);
    setShowContactForm(false);
    setShowPaymentSelector(true);
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
        className="relative group rounded-3xl overflow-hidden transition-all duration-500 will-change-transform hover:-translate-y-2"
      >
        {/* Dual-color animated ring */}
        <div className="absolute inset-0 rounded-3xl p-px overflow-hidden">
          <motion.div
            className="absolute inset-[-300%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ background: `conic-gradient(from 0deg, hsla(${hsl}, 0.6), transparent 25%, hsla(${hsl2}, 0.6), transparent 55%, hsla(${hsl}, 0.6))` }}
          />
        </div>

        {/* Card body */}
        <div className="relative rounded-[calc(1.5rem-1px)] overflow-hidden m-px backdrop-blur-xl" style={{ background: `linear-gradient(170deg, hsla(${hsl}, 0.07) 0%, hsla(${hsl2}, 0.04) 20%, hsla(0, 0%, 8%, 0.98) 40%, hsla(0, 0%, 5%, 0.99) 100%)` }}>

          {/* Mesh gradient */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(ellipse at 10% 10%, hsla(${hsl}, 0.12), transparent 50%), radial-gradient(ellipse at 90% 90%, hsla(${hsl2}, 0.1), transparent 50%)` }} />

          {/* Floating orbs */}
          {[...Array(4)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: i % 2 === 0 ? `hsla(${hsl}, 0.12)` : `hsla(${hsl2}, 0.12)`, width: `${50 + i * 15}px`, height: `${50 + i * 15}px`, left: `${10 + i * 22}%`, top: `${15 + (i % 3) * 25}%` }}
              animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5 + i, repeat: Infinity, delay: i * 0.4 }} />
          ))}

          {/* Best Value Badge */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
            <motion.div
              animate={{ boxShadow: [`0 4px 20px hsla(${hsl}, 0.3)`, `0 4px 40px hsla(${hsl}, 0.6)`, `0 4px 20px hsla(${hsl}, 0.3)`] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-red-400 via-red-500 to-rose-600 px-8 py-2.5 rounded-b-2xl"
            >
              <span className="text-[10px] font-display font-black text-white tracking-[0.25em] flex items-center gap-2">
                <Crown size={12} /> BEST VALUE
              </span>
            </motion.div>
          </div>

          <div className="relative z-10 p-8 md:p-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-display tracking-[0.15em] mb-7 mt-5 backdrop-blur-md border" style={{ background: `linear-gradient(135deg, hsla(${hsl}, 0.06), hsla(${hsl2}, 0.06))`, borderColor: `hsla(${hsl}, 0.2)` }}>
              <Gift size={13} className="text-rose-400" />
              <span className="text-foreground/80">BUNDLE DEAL</span>
            </div>

            <h3 className="font-display text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r from-red-300 via-red-400 to-rose-400 bg-clip-text text-transparent tracking-tight">
              {jarvisName} + {myraName}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">Get both AI assistants at a discounted price</p>

            {bundleSoldCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display mb-6 border backdrop-blur-sm" style={{ background: `hsla(${hsl}, 0.05)`, borderColor: `hsla(${hsl}, 0.12)` }}>
                <Users size={14} className="text-red-400" />
                <span className="text-foreground/60">{bundleSoldCount}+ bundles sold</span>
              </div>
            )}

            <div className="mb-2">
              <span className="font-display text-5xl md:text-6xl font-black bg-gradient-to-r from-red-300 to-rose-400 bg-clip-text text-transparent tracking-tighter" style={{ textShadow: `0 0 60px hsla(${hsl}, 0.25)` }}>
                {formatPrice(bundlePrice)}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-muted-foreground line-through text-sm">{formatPrice(originalPrice)}</span>
              <span className="text-[10px] font-display font-black px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">SAVE {formatPrice(savings)}</span>
            </div>
            <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
            <div className="mb-8" />

            <div className="h-px w-full mb-8" style={{ background: `linear-gradient(to right, transparent 5%, hsla(${hsl}, 0.2) 30%, hsla(${hsl2}, 0.2) 70%, transparent 95%)` }} />

            <ul className="space-y-3.5 mb-9">
              {bundleFeatures.map((feature, index) => (
                <motion.li key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + index * 0.04 }} className="flex items-start gap-3 group/item">
                  <motion.div whileHover={{ scale: 1.3, rotate: 10 }} className="w-5 h-5 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-400 to-rose-500 flex-shrink-0 mt-0.5" style={{ boxShadow: `0 0 12px hsla(${hsl}, 0.3)` }}>
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </motion.div>
                  <span className="text-foreground/70 text-sm leading-relaxed group-hover/item:text-foreground transition-colors duration-300">{feature}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="neonCyan"
                size="xl"
                className="w-full bg-gradient-to-r from-red-400 via-red-500 to-rose-600 hover:opacity-90 group/btn font-black text-base tracking-wide relative overflow-hidden rounded-2xl"
                onClick={() => setShowContactForm(true)}
              >
                <motion.div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", width: "40%" }} />
                <Sparkles size={16} className="mr-2 relative z-10" />
                <span className="relative z-10">Get Bundle Now</span>
                <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-2 transition-transform duration-300 relative z-10" />
              </Button>
            </motion.div>

            <p className="text-center text-[10px] text-muted-foreground mt-5 tracking-wider font-display">
              ⚡ Instant delivery • ♾️ Lifetime access • 🔄 Free updates
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: `linear-gradient(to top, hsla(${hsl}, 0.03), transparent)` }} />
        </div>
      </motion.div>

      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} onSubmit={handleContactSubmit} productName={`${jarvisName} + ${myraName} Bundle`} accentHsl={hsl} />
      <PaymentGatewaySelector isOpen={showPaymentSelector} onClose={() => setShowPaymentSelector(false)} productId="bundle_jarvis_myra" customerName={customerInfo.name} customerEmail={customerInfo.email} customerPhone={customerInfo.phone} />
    </>
  );
};

export default BundleCard;