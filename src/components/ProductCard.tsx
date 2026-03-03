import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Users, Heart, ArrowRight } from "lucide-react";
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
    gradient: "from-cyan-500 via-blue-500 to-primary",
    border: "border-primary/20",
    bgGradient: "from-primary/8 via-cyan-500/3 to-transparent",
    badge: "bg-primary/10 text-primary border-primary/25",
    badgeLabel: "SYSTEM AUTOMATION",
    badgeIcon: Sparkles,
    priceGradient: "from-cyan-400 to-primary",
    salesBadge: "bg-primary/8 text-primary border-primary/15",
    includesBg: "bg-gradient-to-r from-primary/10 to-cyan-500/5 border-primary/20",
    includesIcon: "bg-primary/20",
    includesText: "Includes: Old Source Code",
    includesDesc: "Learn & customize the original codebase",
    checkColor: "text-cyan-400",
    buttonVariant: "neonCyan" as const,
    glowColor: "primary",
  },
  myra: {
    gradient: "from-purple-500 via-violet-500 to-secondary",
    border: "border-secondary/20",
    bgGradient: "from-secondary/8 via-purple-500/3 to-transparent",
    badge: "bg-secondary/10 text-secondary border-secondary/25",
    badgeLabel: "PERSONAL ASSISTANT",
    badgeIcon: Sparkles,
    priceGradient: "from-purple-400 to-secondary",
    salesBadge: "bg-secondary/8 text-secondary border-secondary/15",
    includesBg: "bg-gradient-to-r from-secondary/10 to-purple-500/5 border-secondary/20",
    includesIcon: "bg-secondary/20",
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run executable for Windows",
    checkColor: "text-purple-400",
    buttonVariant: "neonPurple" as const,
    glowColor: "secondary",
  },
  aura: {
    gradient: "from-pink-500 via-rose-500 to-red-400",
    border: "border-pink-500/20",
    bgGradient: "from-pink-500/8 via-rose-500/3 to-transparent",
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/25",
    badgeLabel: "AI GIRLFRIEND",
    badgeIcon: Heart,
    priceGradient: "from-pink-400 to-rose-400",
    salesBadge: "bg-pink-500/8 text-pink-400 border-pink-500/15",
    includesBg: "bg-gradient-to-r from-pink-500/10 to-rose-500/5 border-pink-500/20",
    includesIcon: "bg-pink-500/20",
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run AI Girlfriend for Windows",
    checkColor: "text-pink-400",
    buttonVariant: "neonPink" as const,
    glowColor: "pink-500",
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
      className={`relative group rounded-3xl overflow-hidden ${s.border} border backdrop-blur-xl`}
    >
      {/* Animated background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${s.bgGradient}`} />
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-15 bg-${s.glowColor} group-hover:opacity-25 transition-opacity duration-500`} />
      <div className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-10 bg-${s.glowColor} group-hover:opacity-20 transition-opacity duration-500`} />

      <div className="relative z-10 p-7 md:p-8">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-display tracking-wider mb-5 ${s.badge} border backdrop-blur-sm`}>
          <BadgeIcon size={12} />
          {s.badgeLabel}
        </div>

        {/* Name & Tagline */}
        <h3 className={`font-display text-3xl font-bold mb-2 bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent`}>
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">{tagline}</p>

        {/* Sales Counter */}
        {soldCount > 0 && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display mb-4 ${s.salesBadge} border backdrop-blur-sm`}>
            <Users size={14} />
            <span>{soldCount}+ users purchased</span>
          </div>
        )}

        {/* Includes Badge */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-5 ${s.includesBg} border`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.includesIcon}`}>
            <span className="text-sm">📦</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">{s.includesText}</p>
            <p className="text-[10px] text-muted-foreground">{s.includesDesc}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`font-display text-5xl font-bold bg-gradient-to-r ${s.priceGradient} bg-clip-text text-transparent`}>
            {formatPrice(price)}
          </span>
          <span className="text-muted-foreground text-sm">/ one-time</span>
        </div>
        <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
        <div className="mb-6" />

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + index * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-r ${s.gradient} bg-opacity-20`}>
                <Check size={11} className="text-white" />
              </div>
              <span className="text-foreground/80 text-sm">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* Buy Button */}
        <Button
          variant={s.buttonVariant}
          size="xl"
          className="w-full group/btn"
          onClick={() => setShowPaymentSelector(true)}
        >
          Buy {name} Now
          <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Payment Gateway Selector */}
      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        amount={price}
        productName={name}
      />
    </motion.div>
  );
};

export default ProductCard;
