import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Users, Heart } from "lucide-react";
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
    border: "border-primary/30",
    glow: "bg-primary",
    badge: "bg-primary/20 text-primary border-primary/30",
    badgeLabel: "SYSTEM AUTOMATION",
    badgeIcon: Sparkles,
    textGlow: "text-glow-cyan text-primary",
    salesBadge: "bg-primary/10 text-primary border-primary/20",
    includesBg: "bg-gradient-to-r from-primary/20 to-cyan-500/10 border-primary/30",
    includesIcon: "bg-primary/30",
    includesText: "Includes: Old Source Code",
    includesDesc: "Learn & customize the original codebase",
    checkBg: "bg-primary/20",
    checkColor: "text-primary",
    buttonVariant: "neonCyan" as const,
  },
  myra: {
    border: "border-secondary/30",
    glow: "bg-secondary",
    badge: "bg-secondary/20 text-secondary border-secondary/30",
    badgeLabel: "PERSONAL ASSISTANT",
    badgeIcon: Sparkles,
    textGlow: "text-glow-purple text-secondary",
    salesBadge: "bg-secondary/10 text-secondary border-secondary/20",
    includesBg: "bg-gradient-to-r from-secondary/20 to-purple-500/10 border-secondary/30",
    includesIcon: "bg-secondary/30",
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run executable for Windows",
    checkBg: "bg-secondary/20",
    checkColor: "text-secondary",
    buttonVariant: "neonPurple" as const,
  },
  aura: {
    border: "border-pink-500/30",
    glow: "bg-pink-500",
    badge: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    badgeLabel: "AI GIRLFRIEND",
    badgeIcon: Heart,
    textGlow: "text-pink-400",
    salesBadge: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    includesBg: "bg-gradient-to-r from-pink-500/20 to-rose-500/10 border-pink-500/30",
    includesIcon: "bg-pink-500/30",
    includesText: "Includes: .exe File",
    includesDesc: "Ready-to-run AI Girlfriend for Windows",
    checkBg: "bg-pink-500/20",
    checkColor: "text-pink-400",
    buttonVariant: "neonPink" as const,
  },
};

const ProductCard = ({
  name,
  tagline,
  price,
  features,
  variant,
  delay = 0,
}: ProductCardProps) => {
  const s = variantStyles[variant];
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const { data: purchaseCounts } = usePurchaseCounts();
  const { formatPrice, isIndia, currency, countryCode, setSelectedCountry } = useCurrency();
  
  const soldCount = variant === "jarvis" ? purchaseCounts?.jarvis || 0 : variant === "myra" ? purchaseCounts?.myra || 0 : 0;
  const BadgeIcon = s.badgeIcon;

  const handleBuyClick = () => {
    setShowPaymentSelector(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10 }}
      className={`relative glass-card rounded-2xl p-8 overflow-hidden ${s.border} border`}
    >
      {/* Glow Effect */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${s.glow}`} />

      {/* Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-display tracking-wider mb-4 ${s.badge} border`}>
        <BadgeIcon size={12} />
        {s.badgeLabel}
      </div>

      {/* Name & Tagline */}
      <h3 className={`font-display text-3xl font-bold mb-2 ${s.textGlow}`}>
        {name}
      </h3>
      <p className="text-muted-foreground mb-4">{tagline}</p>

      {/* Sales Counter */}
      {soldCount > 0 && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display mb-4 ${s.salesBadge} border`}>
          <Users size={14} />
          <span>{soldCount}+ users already purchased</span>
        </div>
      )}

      {/* Includes Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${s.includesBg} border`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center ${s.includesIcon}`}>
          <span className="text-xs">📦</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">{s.includesText}</p>
          <p className="text-[10px] text-muted-foreground">{s.includesDesc}</p>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display text-5xl font-bold text-foreground">
          {formatPrice(price)}
        </span>
        <span className="text-muted-foreground">/ one-time</span>
      </div>
      <CurrencySelector
        currentCode={countryCode}
        onSelect={setSelectedCountry}
        currency={currency}
      />
      <div className="mb-6" />

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${s.checkBg}`}>
              <Check size={12} className={s.checkColor} />
            </div>
            <span className="text-foreground/80 text-sm">{feature}</span>
          </motion.li>
        ))}
      </ul>

      {/* Buy Button */}
      <Button
        variant={s.buttonVariant}
        size="xl"
        className="w-full"
        onClick={handleBuyClick}
      >
        Buy {name} Now
      </Button>

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