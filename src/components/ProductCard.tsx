import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Users, Heart, ArrowRight, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
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
    border: "border-cyan-500/20 hover:border-cyan-400/40",
    bgGradient: "from-cyan-950/40 via-slate-950/60 to-slate-950/80",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    badgeLabel: "SYSTEM AUTOMATION",
    badgeIcon: Cpu,
    priceGradient: "from-cyan-400 to-blue-400",
    salesBadge: "bg-cyan-500/8 text-cyan-400 border-cyan-500/15",
    includesBg: "bg-cyan-950/40 border-cyan-500/20",
    includesIcon: "bg-cyan-500/20",
    includesText: "Includes: Old Source Code",
    includesDesc: "Learn & customize the original codebase",
    checkColor: "text-cyan-400",
    buttonVariant: "neonCyan" as const,
    glowColor: "cyan-500",
    accentHsl: "188 100% 50%",
  },
  myra: {
    productId: "myra",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    border: "border-violet-500/20 hover:border-violet-400/40",
    bgGradient: "from-violet-950/40 via-slate-950/60 to-slate-950/80",
    badge: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    badgeLabel: "PERSONAL ASSISTANT",
    badgeIcon: Sparkles,
    priceGradient: "from-violet-400 to-fuchsia-400",
    salesBadge: "bg-violet-500/8 text-violet-400 border-violet-500/15",
    includesBg: "bg-violet-950/40 border-violet-500/20",
    includesIcon: "bg-violet-500/20",
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run executable for Windows",
    checkColor: "text-violet-400",
    buttonVariant: "neonPurple" as const,
    glowColor: "violet-500",
    accentHsl: "263 70% 58%",
  },
  aura: {
    productId: "aura",
    gradient: "from-pink-500 via-rose-500 to-red-400",
    border: "border-pink-500/20 hover:border-pink-400/40",
    bgGradient: "from-pink-950/40 via-slate-950/60 to-slate-950/80",
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/30",
    badgeLabel: "AI GIRLFRIEND",
    badgeIcon: Heart,
    priceGradient: "from-pink-400 to-rose-400",
    salesBadge: "bg-pink-500/8 text-pink-400 border-pink-500/15",
    includesBg: "bg-pink-950/40 border-pink-500/20",
    includesIcon: "bg-pink-500/20",
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run AI Girlfriend for Windows",
    checkColor: "text-pink-400",
    buttonVariant: "neonPink" as const,
    glowColor: "pink-500",
    accentHsl: "330 80% 60%",
  },
};

const ProductCard = ({ name, tagline, price, features, variant, delay = 0 }: ProductCardProps) => {
  const s = variantStyles[variant];
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const { data: purchaseCounts } = usePurchaseCounts();
  const { formatPrice, currency, countryCode, setSelectedCountry } = useCurrency();

  const soldCount = variant === "jarvis" ? purchaseCounts?.jarvis || 0 : variant === "myra" ? purchaseCounts?.myra || 0 : 0;
  const BadgeIcon = s.badgeIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className={`relative group rounded-[2rem] overflow-hidden ${s.border} border backdrop-blur-2xl transition-all duration-500`}
      style={{
        background: `linear-gradient(165deg, hsla(${s.accentHsl}, 0.06) 0%, hsla(220, 20%, 6%, 0.95) 40%, hsla(220, 20%, 4%, 0.98) 100%)`,
        boxShadow: `0 0 0 1px hsla(${s.accentHsl}, 0.1), 0 20px 60px -20px hsla(${s.accentHsl}, 0.15)`,
      }}
    >
      {/* Animated corner glow */}
      <div
        className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 group-hover:opacity-35 transition-all duration-700"
        style={{ background: `radial-gradient(circle, hsla(${s.accentHsl}, 0.6), transparent 70%)` }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[100px] opacity-10 group-hover:opacity-20 transition-all duration-700"
        style={{ background: `radial-gradient(circle, hsla(${s.accentHsl}, 0.4), transparent 70%)` }}
      />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 p-8 md:p-9">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-display tracking-[0.15em] mb-6 ${s.badge} border backdrop-blur-sm`}>
          <BadgeIcon size={13} />
          {s.badgeLabel}
        </div>

        {/* Name & Tagline */}
        <h3 className={`font-display text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent tracking-tight`}>
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{tagline}</p>

        {/* Sales Counter */}
        {soldCount > 0 && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-display mb-5 ${s.salesBadge} border backdrop-blur-sm`}>
            <Users size={14} />
            <span>{soldCount}+ users purchased</span>
          </div>
        )}

        {/* Includes Badge */}
        <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl mb-6 ${s.includesBg} border`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.includesIcon}`}>
            <span className="text-base">📦</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-foreground">{s.includesText}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.includesDesc}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className={`font-display text-5xl md:text-6xl font-black bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent tracking-tight`}>
            {formatPrice(price)}
          </span>
          <span className="text-muted-foreground text-sm font-medium">/ one-time</span>
        </div>
        <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
        <div className="mb-7" />

        {/* Divider */}
        <div className={`h-px w-full bg-gradient-to-r from-transparent via-${s.glowColor}/30 to-transparent mb-7`} />

        {/* Features */}
        <ul className="space-y-3.5 mb-9">
          {features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + index * 0.06 }}
              className="flex items-start gap-3"
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center bg-gradient-to-br ${s.gradient} flex-shrink-0 mt-0.5`}>
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-foreground/80 text-sm leading-relaxed">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* Buy Button */}
        <Button
          variant={s.buttonVariant}
          size="xl"
          className="w-full group/btn font-black text-base tracking-wide"
          onClick={() => setShowPaymentSelector(true)}
        >
          <Zap size={16} className="mr-2" />
          Buy {name} Now
          <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground mt-4 tracking-wide">
          Instant delivery • Lifetime access • Free updates
        </p>
      </div>

      {/* Payment Gateway Selector - uses productId, no amount */}
      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        productId={s.productId}
      />
    </motion.div>
  );
};

export default ProductCard;
