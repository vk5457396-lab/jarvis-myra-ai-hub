import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Code, FileCode, GitBranch, Layers, Settings, Star, ArrowRight } from "lucide-react";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

interface SourceCodeCardProps {
  variant: "jarvis" | "myra" | "aura" | "bundle" | "triple";
}

const SourceCodeCard = ({ variant }: SourceCodeCardProps) => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const { formatPrice, isIndia, currency, countryCode, setSelectedCountry } = useCurrency();

  const isAfterFeb1 = new Date() >= new Date('2026-02-01');
  const myraName = isAfterFeb1 ? "MYRA 2.0" : "MYRA";

  const config = {
    jarvis: {
      name: "Jarvis 2.0",
      productName: "Jarvis 2.0 Source Code",
      price: isIndia ? 4500 : 3499,
      originalPrice: isIndia ? 5999 : 4999,
      savings: isIndia ? 1499 : 1500,
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-primary/8 via-cyan-500/3 to-transparent",
      glowColor: "primary",
      badgeText: "JARVIS 2.0 CODE",
      borderColor: "border-primary/25",
      features: [
        "Complete Jarvis 2.0 Source Code",
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
      ],
    },
    myra: {
      name: myraName,
      productName: `${myraName} Source Code`,
      price: isIndia ? 4500 : 3499,
      originalPrice: isIndia ? 5999 : 4999,
      savings: isIndia ? 1499 : 1500,
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-secondary/8 via-purple-500/3 to-transparent",
      glowColor: "secondary",
      badgeText: `${myraName.toUpperCase()} CODE`,
      borderColor: "border-secondary/25",
      features: [
        `Complete ${myraName} Source Code`,
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
      ],
    },
    aura: {
      name: "AURA 1.0",
      productName: "AURA 1.0 Source Code",
      price: isIndia ? 4500 : 3499,
      originalPrice: isIndia ? 5999 : 4999,
      savings: isIndia ? 1499 : 1500,
      gradient: "from-pink-500 to-rose-400",
      bgGradient: "from-pink-500/8 via-rose-500/3 to-transparent",
      glowColor: "pink-500",
      badgeText: "AURA 1.0 CODE",
      borderColor: "border-pink-500/25",
      features: [
        "Complete AURA 1.0 Source Code",
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
      ],
    },
    bundle: {
      name: `Jarvis 2.0 + ${myraName}`,
      productName: `Jarvis 2.0 + ${myraName} Source Code Bundle`,
      price: isIndia ? 6999 : 4999,
      originalPrice: isIndia ? 9000 : 6998,
      savings: isIndia ? 2001 : 1999,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-500/8 via-orange-500/3 to-transparent",
      glowColor: "yellow-500",
      badgeText: "BEST VALUE",
      borderColor: "border-yellow-500/30",
      features: [
        "Complete Jarvis 2.0 Source Code",
        `Complete ${myraName} Source Code`,
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
        "Commercial License",
      ],
    },
    triple: {
      name: `All 3 AI Source Codes`,
      productName: `Jarvis 2.0 + ${myraName} + AURA 1.0 Source Code`,
      price: isIndia ? 9999 : 7999,
      originalPrice: isIndia ? 13500 : 10497,
      savings: isIndia ? 3501 : 2498,
      gradient: "from-emerald-400 via-cyan-400 to-purple-500",
      bgGradient: "from-emerald-500/8 via-cyan-500/3 to-purple-500/5",
      glowColor: "emerald-500",
      badgeText: "MEGA BUNDLE",
      borderColor: "border-emerald-500/30",
      features: [
        "Complete Jarvis 2.0 Source Code",
        `Complete ${myraName} Source Code`,
        "Complete AURA 1.0 Source Code",
        "All Python & Automation Scripts",
        "Full Documentation for All 3",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
        "Commercial License",
      ],
    },
  };

  const c = config[variant];
  const isFeatured = variant === "bundle" || variant === "triple";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      className={`relative group rounded-3xl overflow-hidden h-full backdrop-blur-xl ${
        isFeatured ? `border-2 ${c.borderColor}` : `border ${c.borderColor}`
      }`}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.bgGradient}`} />
      <div className={`absolute top-0 right-0 w-40 h-40 bg-${c.glowColor}/15 rounded-full blur-[60px] group-hover:opacity-100 opacity-60 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-40 h-40 bg-${c.glowColor}/10 rounded-full blur-[60px]`} />

      {/* Top Badge */}
      {isFeatured && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
          <div className={`bg-gradient-to-r ${c.gradient} px-5 py-1 rounded-b-xl`}>
            <span className="text-[10px] font-display font-bold text-white tracking-wider">{c.badgeText}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 p-6 md:p-8">
        {/* Code Badge (non-featured) */}
        {!isFeatured && (
          <div className="absolute -top-1 -right-1">
            <div className={`bg-gradient-to-r ${c.gradient} text-white px-3 py-1 rounded-bl-xl rounded-tr-2xl font-display text-[10px] font-bold flex items-center gap-1`}>
              <Code size={10} />
              {c.badgeText}
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg`}>
            <FileCode className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <h3 className={`font-display text-xl md:text-2xl font-bold mb-1 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
            {c.name}
          </h3>
          <p className="text-muted-foreground text-xs">Source Code</p>
        </div>

        {/* Price */}
        <div className="text-center mb-5">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-muted-foreground line-through text-sm">{formatPrice(c.originalPrice)}</span>
            <span className={`font-display text-4xl font-bold bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent`}>
              {formatPrice(c.price)}
            </span>
          </div>
          <p className="text-xs text-green-400 mt-1 font-medium">Save {formatPrice(c.savings)}!</p>
          <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-6">
          {c.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2.5 text-sm">
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${c.gradient} flex items-center justify-center flex-shrink-0`}>
                <Star className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-foreground/85 text-xs md:text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* What You Can Do */}
        <div className="glass rounded-xl p-3 mb-5">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Settings, label: "Customize" },
              { icon: GitBranch, label: "Extend" },
              { icon: Layers, label: "Integrate" },
            ].map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${c.borderColor} bg-gradient-to-r ${c.bgGradient}`}
              >
                <item.icon size={10} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Buy Button */}
        <Button
          onClick={() => setShowPaymentSelector(true)}
          className={`w-full h-12 text-sm font-display font-bold bg-gradient-to-r ${c.gradient} hover:opacity-90 text-white shadow-lg transition-all duration-300 rounded-xl group/btn`}
        >
          <Code className="mr-2 w-4 h-4" />
          Get Source Code
          <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground mt-3">
          Instant delivery • Lifetime access
        </p>
      </div>

      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        amount={c.price}
        productName={c.productName}
      />
    </motion.div>
  );
};

export default SourceCodeCard;
