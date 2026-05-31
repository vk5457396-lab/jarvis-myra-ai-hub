import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Users, ArrowRight, Cpu, Zap, Heart, Sparkles, Crown, Flame, Shield } from "lucide-react";
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
  variant: "jarvis" | "myra" | "aria";
  delay?: number;
}

const variantStyles = {
  jarvis: {
    productId: "jarvis",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    priceGradient: "from-cyan-300 to-blue-400",
    badgeLabel: "⚡ POWER USERS",
    badgeIcon: Cpu,
    includesText: "Includes: Old Source Code",
    includesDesc: "Learn & customize the original codebase",
    buttonVariant: "neonCyan" as const,
    accent: { h: 188, s: 100, l: 50 },
    accent2: { h: 210, s: 100, l: 60 },
    ringColor: "hsla(188,100%,50%,0.15)",
    popularBadge: false,
  },
  myra: {
    productId: "myra",
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    priceGradient: "from-violet-300 to-fuchsia-400",
    badgeLabel: "🔥 MOST POPULAR",
    badgeIcon: Sparkles,
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run executable for Windows",
    buttonVariant: "neonPurple" as const,
    accent: { h: 263, s: 70, l: 58 },
    accent2: { h: 290, s: 80, l: 65 },
    ringColor: "hsla(263,70%,58%,0.15)",
    popularBadge: true,
  },
  aria: {
    productId: "aria",
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
    priceGradient: "from-emerald-300 to-teal-400",
    badgeLabel: "🎵 CREATIVE AI",
    badgeIcon: Sparkles,
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run AI Music Assistant for Windows",
    buttonVariant: "neonCyan" as const,
    accent: { h: 160, s: 70, l: 50 },
    accent2: { h: 175, s: 80, l: 45 },
    ringColor: "hsla(160,70%,50%,0.15)",
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
  const springX = useSpring(mouseX, { stiffness: 120, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 25 });
  const rotateX = useTransform(springY, [0, 1], [5, -5]);
  const rotateY = useTransform(springX, [0, 1], [-5, 5]);

  const soldCount = variant === "jarvis" ? purchaseCounts?.jarvis || 0 : variant === "myra" ? purchaseCounts?.myra || 0 : 0;
  const BadgeIcon = s.badgeIcon;
  const a = s.accent;
  const a2 = s.accent2;
  const hsl = `${a.h} ${a.s}% ${a.l}%`;
  const hsl2 = `${a2.h} ${a2.s}% ${a2.l}%`;

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
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
        className="relative group rounded-3xl overflow-hidden transition-all duration-500 will-change-transform hover:-translate-y-2"
      >
        {/* Outer animated ring */}
        <div className="absolute inset-0 rounded-3xl p-px overflow-hidden">
          <motion.div
            className="absolute inset-[-300%]"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ background: `conic-gradient(from 0deg, hsla(${hsl}, 0.6), transparent 30%, hsla(${hsl2}, 0.4), transparent 60%, hsla(${hsl}, 0.6))` }}
          />
        </div>

        {/* Card body */}
        <div className="relative rounded-[calc(1.5rem-1px)] overflow-hidden m-px backdrop-blur-xl" style={{ background: `linear-gradient(170deg, hsla(${hsl}, 0.08) 0%, hsla(220, 15%, 8%, 0.98) 30%, hsla(220, 20%, 5%, 0.99) 100%)` }}>

          {/* Mesh gradient overlay */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 0%, hsla(${hsl}, 0.15), transparent 50%), radial-gradient(ellipse at 80% 100%, hsla(${hsl2}, 0.1), transparent 50%)` }} />

          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")" }} />

          {/* Floating orbs */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `hsla(${hsl}, 0.15)`,
                width: `${60 + i * 20}px`,
                height: `${60 + i * 20}px`,
                left: `${10 + i * 30}%`,
                top: `${20 + (i % 2) * 40}%`,
              }}
              animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}

          {/* Popular / Featured badge */}
          {s.popularBadge && (
            <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
              <motion.div
                animate={{ boxShadow: [`0 4px 20px hsla(${hsl}, 0.3)`, `0 4px 40px hsla(${hsl}, 0.6)`, `0 4px 20px hsla(${hsl}, 0.3)`] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`bg-gradient-to-r ${s.gradient} px-8 py-2.5 rounded-b-2xl`}
              >
                <span className="text-[10px] font-display font-black text-white tracking-[0.25em] flex items-center gap-2">
                  <Crown size={12} /> MOST POPULAR
                </span>
              </motion.div>
            </div>
          )}

          <div className="relative z-10 p-8 md:p-10">
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-display tracking-[0.15em] mb-7 border backdrop-blur-md"
              style={{ background: `hsla(${hsl}, 0.08)`, borderColor: `hsla(${hsl}, 0.2)`, color: `hsla(${hsl}, 0.9)` }}
            >
              <BadgeIcon size={13} />
              {s.badgeLabel}
            </motion.div>

            {/* Product name */}
            <h3 className={`font-display text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent tracking-tight leading-tight`}>
              {name}
            </h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed max-w-[280px]">{tagline}</p>

            {/* Sales counter */}
            {soldCount > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display mb-6 border backdrop-blur-sm" style={{ background: `hsla(${hsl}, 0.05)`, borderColor: `hsla(${hsl}, 0.12)` }}>
                <Users size={14} style={{ color: `hsla(${hsl}, 0.8)` }} />
                <span className="text-foreground/60">{soldCount}+ purchased</span>
              </motion.div>
            )}

            {/* Includes box */}
            <div className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-7 border" style={{ background: `hsla(${hsl}, 0.03)`, borderColor: `hsla(${hsl}, 0.1)` }}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.gradient} shrink-0`} style={{ boxShadow: `0 0 20px hsla(${hsl}, 0.25)` }}>
                <span className="text-lg">📦</span>
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{s.includesText}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.includesDesc}</p>
              </div>
            </div>

            {/* Price */}
            <div className="mb-2">
              <motion.span
                className={`font-display text-5xl md:text-6xl font-black bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent tracking-tighter`}
                style={{ textShadow: `0 0 60px hsla(${hsl}, 0.25)` }}
              >
                {formatPrice(price)}
              </motion.span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-display font-black px-3 py-1.5 rounded-full border" style={{ background: `hsla(${hsl}, 0.06)`, borderColor: `hsla(${hsl}, 0.15)`, color: `hsla(${hsl}, 0.8)` }}>
                <Shield size={9} className="inline mr-1" />ONE-TIME PURCHASE
              </span>
            </div>
            <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
            <div className="mb-8" />

            {/* Divider */}
            <div className="h-px w-full mb-8" style={{ background: `linear-gradient(to right, transparent 5%, hsla(${hsl}, 0.2) 50%, transparent 95%)` }} />

            {/* Features */}
            <ul className="space-y-3.5 mb-9">
              {features.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: delay + index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3 group/item"
                >
                  <motion.div
                    whileHover={{ scale: 1.3, rotate: 10 }}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center bg-gradient-to-br ${s.gradient} flex-shrink-0 mt-0.5`}
                    style={{ boxShadow: `0 0 12px hsla(${hsl}, 0.3)` }}
                  >
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </motion.div>
                  <span className="text-foreground/70 text-sm leading-relaxed group-hover/item:text-foreground transition-colors duration-300">{feature}</span>
                </motion.li>
              ))}
            </ul>

            {/* CTA Button */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant={s.buttonVariant}
                size="xl"
                className="w-full group/btn font-black text-base tracking-wide relative overflow-hidden rounded-2xl"
                onClick={() => setShowContactForm(true)}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover/btn:opacity-100"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", width: "40%" }}
                />
                <Zap size={16} className="mr-2 relative z-10" />
                <span className="relative z-10">Buy {name} Now</span>
                <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-2 transition-transform duration-300 relative z-10" />
              </Button>
            </motion.div>

            <p className="text-center text-[10px] text-muted-foreground mt-5 tracking-wider font-display">
              ⚡ Instant delivery • ♾️ Lifetime access • 🔄 Free updates
            </p>
          </div>

          {/* Bottom ambient glow */}
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: `linear-gradient(to top, hsla(${hsl}, 0.04), transparent)` }} />
        </div>
      </motion.div>

      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} onSubmit={handleContactSubmit} productName={name} accentHsl={hsl} />
      <PaymentGatewaySelector isOpen={showPaymentSelector} onClose={() => setShowPaymentSelector(false)} productId={s.productId} customerName={customerInfo.name} customerEmail={customerInfo.email} customerPhone={customerInfo.phone} />
    </>
  );
};

export default ProductCard;
