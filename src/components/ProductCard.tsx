import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Sparkles, Users, Heart, ArrowRight, Cpu, Zap, Crown, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import ContactFormModal from "@/components/ContactFormModal";
import { usePurchaseCounts } from "@/hooks/usePurchaseCounts";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

interface ProductCardProps {
  name: string;
  tagline: string;
  price: number;
  features: string[];
  variant: "jarvis" | "myra" | "aura";
  delay?: number;
}

const variantStyles = {
  jarvis: {
    productId: "jarvis",
    gradient: "from-cyan-500 via-blue-500 to-primary",
    priceGradient: "from-cyan-400 to-blue-400",
    badgeLabel: "⚡ POWER USERS",
    badgeIcon: Cpu,
    includesText: "Includes: Old Source Code",
    includesDesc: "Learn & customize the original codebase",
    buttonVariant: "neonCyan" as const,
    accentHsl: "188 100% 50%",
    accentHsl2: "210 100% 60%",
    popularBadge: false,
  },
  myra: {
    productId: "myra",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    priceGradient: "from-violet-400 to-fuchsia-400",
    badgeLabel: "🔥 MOST POPULAR",
    badgeIcon: Sparkles,
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run executable for Windows",
    buttonVariant: "neonPurple" as const,
    accentHsl: "263 70% 58%",
    accentHsl2: "290 80% 65%",
    popularBadge: true,
  },
  aura: {
    productId: "aura",
    gradient: "from-pink-500 via-rose-500 to-red-400",
    priceGradient: "from-pink-400 to-rose-400",
    badgeLabel: "💖 EMOTIONAL AI",
    badgeIcon: Heart,
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run AI Girlfriend for Windows",
    buttonVariant: "neonPink" as const,
    accentHsl: "330 80% 60%",
    accentHsl2: "350 90% 55%",
    popularBadge: false,
  },
};

const ProductCard = ({ name, tagline, price, features, variant, delay = 0 }: ProductCardProps) => {
  const s = variantStyles[variant];
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
  const rotateX = useTransform(springY, [0, 1], [4, -4]);
  const rotateY = useTransform(springX, [0, 1], [-4, 4]);
  const sheenX = useTransform(springX, [0, 1], [-100, 100]);

  const soldCount = variant === "jarvis" ? purchaseCounts?.jarvis || 0 : variant === "myra" ? purchaseCounts?.myra || 0 : 0;
  const BadgeIcon = s.badgeIcon;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
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
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative group rounded-[2rem] overflow-hidden transition-all duration-500 will-change-transform"
      >
        {/* Animated border gradient */}
        <div className="absolute inset-0 rounded-[2rem] p-px overflow-hidden">
          <motion.div
            className="absolute inset-[-200%] rounded-[2rem]"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{
              background: `conic-gradient(from 0deg, hsla(${s.accentHsl}, 0.4), transparent 40%, hsla(${s.accentHsl2}, 0.4), transparent 80%, hsla(${s.accentHsl}, 0.4))`,
            }}
          />
        </div>

        {/* Card inner */}
        <div
          className="relative rounded-[calc(2rem-1px)] overflow-hidden m-px"
          style={{
            background: `linear-gradient(165deg, hsla(${s.accentHsl}, 0.07) 0%, hsla(220, 20%, 6%, 0.97) 35%, hsla(220, 20%, 4%, 0.99) 100%)`,
          }}
        >
          {/* Animated light sheen */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: useTransform(sheenX, (x) => `linear-gradient(${105 + x * 0.3}deg, transparent 35%, hsla(${s.accentHsl}, 0.06) 50%, transparent 65%)`),
            }}
          />

          {/* Floating particles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-0 group-hover:opacity-60"
              style={{ background: `hsla(${s.accentHsl}, 0.8)`, left: `${15 + i * 18}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [0, -20, 0], opacity: [0, 0.6, 0] }}
              transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            />
          ))}

          {/* Corner glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-all duration-700" style={{ background: `hsla(${s.accentHsl}, 0.6)` }} />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-10 group-hover:opacity-25 transition-all duration-700" style={{ background: `hsla(${s.accentHsl2}, 0.4)` }} />

          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)', backgroundSize: '20px 20px' }} />

          {/* Popular badge (MYRA) */}
          {s.popularBadge && (
            <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
              <motion.div
                animate={{ boxShadow: [`0 4px 20px hsla(${s.accentHsl}, 0.3)`, `0 4px 30px hsla(${s.accentHsl}, 0.5)`, `0 4px 20px hsla(${s.accentHsl}, 0.3)`] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`bg-gradient-to-r ${s.gradient} px-6 py-2 rounded-b-2xl`}
              >
                <span className="text-[10px] font-display font-black text-white tracking-[0.2em] flex items-center gap-1.5">
                  <Crown size={11} /> MOST POPULAR
                </span>
              </motion.div>
            </div>
          )}

          <div className="relative z-10 p-8 md:p-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-display tracking-[0.15em] mb-6 backdrop-blur-sm border"
              style={{
                background: `hsla(${s.accentHsl}, 0.08)`,
                borderColor: `hsla(${s.accentHsl}, 0.2)`,
                color: `hsla(${s.accentHsl}, 0.9)`,
              }}>
              <BadgeIcon size={13} />
              {s.badgeLabel}
            </div>

            {/* Name */}
            <h3 className={`font-display text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent tracking-tight`}>
              {name}
            </h3>
            <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{tagline}</p>

            {/* Sales */}
            {soldCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-display mb-5 border backdrop-blur-sm"
                style={{ background: `hsla(${s.accentHsl}, 0.06)`, borderColor: `hsla(${s.accentHsl}, 0.12)`, color: `hsla(${s.accentHsl}, 0.8)` }}
              >
                <Users size={14} />
                <span>{soldCount}+ users purchased</span>
              </motion.div>
            )}

            {/* Includes */}
            <div className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-6 border" style={{ background: `hsla(${s.accentHsl}, 0.04)`, borderColor: `hsla(${s.accentHsl}, 0.12)` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `hsla(${s.accentHsl}, 0.15)` }}>
                <span className="text-base">📦</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">{s.includesText}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.includesDesc}</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-1">
              <motion.span
                className={`font-display text-5xl md:text-6xl font-black bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent tracking-tight`}
                style={{ textShadow: `0 0 40px hsla(${s.accentHsl}, 0.3)` }}
              >
                {formatPrice(price)}
              </motion.span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-display font-bold px-3 py-1 rounded-full border" style={{ background: `hsla(${s.accentHsl}, 0.08)`, borderColor: `hsla(${s.accentHsl}, 0.15)`, color: `hsla(${s.accentHsl}, 0.8)` }}>
                ONE-TIME PURCHASE
              </span>
            </div>
            <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
            <div className="mb-7" />

            {/* Divider */}
            <div className="h-px w-full mb-7" style={{ background: `linear-gradient(to right, transparent, hsla(${s.accentHsl}, 0.25), transparent)` }} />

            {/* Features */}
            <ul className="space-y-3 mb-9">
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: delay + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 group/item"
                >
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center bg-gradient-to-br ${s.gradient} flex-shrink-0 mt-0.5`}
                    style={{ boxShadow: `0 0 10px hsla(${s.accentHsl}, 0.3)` }}
                  >
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </motion.div>
                  <span className="text-foreground/75 text-sm leading-relaxed group-hover/item:text-foreground/90 transition-colors">{feature}</span>
                </motion.li>
              ))}
            </ul>

            {/* Buy Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant={s.buttonVariant}
                size="xl"
                className="w-full group/btn font-black text-base tracking-wide relative overflow-hidden"
                onClick={() => setShowContactForm(true)}
              >
                {/* Button shine effect */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover/btn:opacity-100"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)", width: "50%" }}
                />
                <Zap size={16} className="mr-2 relative z-10" />
                <span className="relative z-10">Buy {name} Now</span>
                <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1.5 transition-transform relative z-10" />
              </Button>
            </motion.div>

            <p className="text-center text-[10px] text-muted-foreground mt-4 tracking-wide">
              ⚡ Instant delivery • ♾️ Lifetime access • 🔄 Free updates
            </p>
          </div>

          {/* Bottom reflection */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: `linear-gradient(to top, hsla(${s.accentHsl}, 0.03), transparent)` }} />
        </div>
      </motion.div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        onSubmit={handleContactSubmit}
        productName={name}
        accentHsl={s.accentHsl}
      />

      {/* Payment Gateway */}
      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        productId={s.productId}
        customerName={customerInfo.name}
        customerEmail={customerInfo.email}
        customerPhone={customerInfo.phone}
      />
    </>
  );
};

export default ProductCard;
