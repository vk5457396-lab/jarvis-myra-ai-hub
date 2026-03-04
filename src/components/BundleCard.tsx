import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Sparkles, Gift, Users, ArrowRight, Crown } from "lucide-react";
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
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [0, 1], [3, -3]);
  const rotateY = useTransform(springX, [0, 1], [-3, 3]);

  const jarvisPrice = 899;
  const myraPrice = getMyraPrice();
  const bundlePrice = getBundlePrice();
  const originalPrice = jarvisPrice + myraPrice;
  const savings = originalPrice - bundlePrice;
  const myraName = getMyraName();
  const jarvisName = getJarvisName();
  const bundleSoldCount = purchaseCounts?.bundle || 0;
  const accentHsl = "188 100% 50%";
  const accentHsl2 = "263 70% 58%";

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
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
        className="relative group rounded-[2rem] overflow-hidden transition-all duration-500 will-change-transform"
      >
        {/* Animated border */}
        <div className="absolute inset-0 rounded-[2rem] p-px overflow-hidden">
          <motion.div
            className="absolute inset-[-200%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            style={{ background: `conic-gradient(from 0deg, hsla(${accentHsl}, 0.5), transparent 30%, hsla(${accentHsl2}, 0.5), transparent 70%, hsla(${accentHsl}, 0.5))` }}
          />
        </div>

        {/* Card inner */}
        <div className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px" style={{ background: `linear-gradient(165deg, hsla(${accentHsl}, 0.06) 0%, hsla(${accentHsl2}, 0.04) 25%, hsla(220, 20%, 6%, 0.97) 45%, hsla(220, 20%, 4%, 0.99) 100%)` }}>

          {/* Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-50" style={{ background: i % 2 === 0 ? `hsla(${accentHsl}, 0.8)` : `hsla(${accentHsl2}, 0.8)`, left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%` }}
              animate={{ y: [0, -25, 0], opacity: [0, 0.5, 0] }} transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.3 }} />
          ))}

          {/* Glows */}
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-all duration-700" style={{ background: `hsla(${accentHsl}, 0.5)` }} />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full blur-[80px] opacity-15 group-hover:opacity-30 transition-all duration-700" style={{ background: `hsla(${accentHsl2}, 0.4)` }} />

          {/* Best Value Badge */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
            <motion.div
              animate={{ boxShadow: [`0 4px 20px hsla(${accentHsl}, 0.3)`, `0 4px 35px hsla(${accentHsl}, 0.5)`, `0 4px 20px hsla(${accentHsl}, 0.3)`] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-7 py-2 rounded-b-2xl"
            >
              <span className="text-[10px] font-display font-black text-white tracking-[0.2em] flex items-center gap-1.5">
                <Crown size={11} /> BEST VALUE
              </span>
            </motion.div>
          </div>

          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 p-8 md:p-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-display tracking-[0.15em] mb-6 mt-5 backdrop-blur-sm border" style={{ background: 'linear-gradient(135deg, hsla(188,100%,50%,0.08), hsla(263,70%,58%,0.08))', borderColor: 'hsla(188,100%,50%,0.2)' }}>
              <Gift size={13} className="text-violet-400" />
              <span className="text-foreground/80">BUNDLE DEAL</span>
            </div>

            <h3 className="font-display text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
              {jarvisName} + {myraName}
            </h3>
            <p className="text-muted-foreground text-sm mb-5 leading-relaxed">Get both AI assistants at a discounted price</p>

            {bundleSoldCount > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-display mb-5 border backdrop-blur-sm" style={{ background: 'hsla(188,100%,50%,0.06)', borderColor: 'hsla(188,100%,50%,0.12)' }}>
                <Users size={14} className="text-cyan-400" />
                <span className="text-foreground/70">{bundleSoldCount}+ bundles sold</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-display text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent tracking-tight" style={{ textShadow: '0 0 40px hsla(188,100%,50%,0.3)' }}>
                {formatPrice(bundlePrice)}
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-muted-foreground line-through text-sm">{formatPrice(originalPrice)}</span>
              <span className="text-[10px] font-display font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">SAVE {formatPrice(savings)}</span>
            </div>
            <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
            <div className="mb-7" />

            <div className="h-px w-full mb-7" style={{ background: 'linear-gradient(to right, transparent, hsla(188,100%,50%,0.25), hsla(263,70%,58%,0.25), transparent)' }} />

            <ul className="space-y-3 mb-9">
              {bundleFeatures.map((feature, index) => (
                <motion.li key={index} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 + index * 0.05 }} className="flex items-start gap-3 group/item">
                  <motion.div whileHover={{ scale: 1.2 }} className="w-5 h-5 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-violet-500 flex-shrink-0 mt-0.5" style={{ boxShadow: '0 0 10px hsla(188,100%,50%,0.3)' }}>
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </motion.div>
                  <span className="text-foreground/75 text-sm leading-relaxed group-hover/item:text-foreground/90 transition-colors">{feature}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="neonCyan"
                size="xl"
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:opacity-90 group/btn font-black text-base tracking-wide relative overflow-hidden"
                onClick={() => setShowContactForm(true)}
              >
                <motion.div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", width: "50%" }} />
                <Sparkles size={16} className="mr-2 relative z-10" />
                <span className="relative z-10">Get Bundle Now</span>
                <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1.5 transition-transform relative z-10" />
              </Button>
            </motion.div>

            <p className="text-center text-[10px] text-muted-foreground mt-4 tracking-wide">
              ⚡ Instant delivery • ♾️ Lifetime access • 🔄 Free updates
            </p>
          </div>

          {/* Bottom reflection */}
          <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, hsla(188,100%,50%,0.02), transparent)' }} />
        </div>
      </motion.div>

      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} onSubmit={handleContactSubmit} productName={`${jarvisName} + ${myraName} Bundle`} accentHsl={accentHsl} />
      <PaymentGatewaySelector isOpen={showPaymentSelector} onClose={() => setShowPaymentSelector(false)} productId="bundle_jarvis_myra" customerName={customerInfo.name} customerEmail={customerInfo.email} customerPhone={customerInfo.phone} />
    </>
  );
};

export default BundleCard;
