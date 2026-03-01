import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Code, FileCode, GitBranch, Layers, Settings, Star } from "lucide-react";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import { useCurrency } from "@/hooks/useCurrency";

interface SourceCodeCardProps {
  variant: "jarvis" | "myra" | "bundle";
}

const SourceCodeCard = ({ variant }: SourceCodeCardProps) => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const { formatPrice, isIndia, currency } = useCurrency();
  
  const isAfterFeb1 = new Date() >= new Date('2026-02-01');
  const myraName = isAfterFeb1 ? "MYRA 2.0" : "MYRA";

  const config = {
    jarvis: {
      name: "Jarvis",
      productName: "Jarvis Source Code",
      price: 3499,
      originalPrice: 4999,
      savings: 1500,
      gradient: "from-primary to-cyan-400",
      bgGradient: "from-primary/10 via-cyan-500/5 to-blue-500/10",
      glowColor: "primary",
      badgeText: "JARVIS CODE",
      features: [
        "Complete Jarvis Source Code",
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
      price: 3499,
      originalPrice: 4999,
      savings: 1500,
      gradient: "from-secondary to-purple-400",
      bgGradient: "from-secondary/10 via-purple-500/5 to-pink-500/10",
      glowColor: "secondary",
      badgeText: `${myraName.toUpperCase()} CODE`,
      features: [
        `Complete ${myraName} Source Code`,
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
      ],
    },
    bundle: {
      name: `Jarvis + ${myraName}`,
      productName: `Jarvis + ${myraName} Source Code Bundle`,
      price: 4999,
      originalPrice: 6998,
      savings: 1999,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-500/10 via-orange-500/5 to-red-500/10",
      glowColor: "yellow-500",
      badgeText: "BEST VALUE",
      features: [
        "Complete Jarvis Source Code",
        `Complete ${myraName} Source Code`,
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
        "Commercial License",
      ],
    },
  };

  const currentConfig = config[variant];

  const handleBuyClick = () => {
    setShowPaymentSelector(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className={`relative glass-card rounded-3xl p-6 md:p-8 overflow-hidden h-full ${
        variant === "bundle" ? "border-2 border-yellow-500/50" : "border border-white/10"
      }`}
    >
      {/* Background effects */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentConfig.bgGradient}`} />
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${currentConfig.glowColor}/20 rounded-full blur-3xl`} />
      <div className={`absolute bottom-0 left-0 w-32 h-32 bg-${currentConfig.glowColor}/20 rounded-full blur-3xl`} />

      {/* Badge */}
      <div className="absolute -top-1 -right-1">
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${currentConfig.gradient} blur-sm`} />
          <div className={`relative bg-gradient-to-r ${currentConfig.gradient} text-background px-3 py-1 rounded-bl-xl rounded-tr-2xl font-display text-xs font-bold flex items-center gap-1`}>
            <Code size={12} />
            {currentConfig.badgeText}
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentConfig.gradient} flex items-center justify-center shadow-lg`}>
            <FileCode className="w-8 h-8 text-background" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h3 className="font-display text-xl md:text-2xl font-bold mb-1">
            {currentConfig.name}
          </h3>
          <p className="text-muted-foreground text-sm">
            Source Code
          </p>
        </div>

        {/* Price */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-muted-foreground line-through text-sm">{formatPrice(currentConfig.originalPrice)}</span>
            <span className={`font-display text-4xl font-bold bg-gradient-to-r ${currentConfig.gradient} bg-clip-text text-transparent`}>
              {formatPrice(currentConfig.price)}
            </span>
          </div>
          <p className="text-xs text-green-400 mt-1 font-medium">
            Save {formatPrice(currentConfig.savings)}!
          </p>
          {!isIndia && (
            <p className="text-xs text-muted-foreground mt-1">
              {currency.flag} {currency.code}
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {currentConfig.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${currentConfig.gradient} flex items-center justify-center flex-shrink-0`}>
                <Star className="w-2.5 h-2.5 text-background" />
              </div>
              <span className="text-foreground/90 text-xs md:text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* What You Can Do */}
        <div className="glass rounded-xl p-3 mb-4">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Settings, label: "Customize" },
              { icon: GitBranch, label: "Extend" },
              { icon: Layers, label: "Integrate" },
            ].map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${currentConfig.gradient} bg-opacity-10 text-xs`}
                style={{ background: `linear-gradient(to right, ${variant === 'jarvis' ? 'rgba(0,212,255,0.1)' : variant === 'myra' ? 'rgba(168,85,247,0.1)' : 'rgba(234,179,8,0.1)'}, transparent)` }}
              >
                <item.icon size={10} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Buy Button */}
        <Button
          onClick={handleBuyClick}
          className={`w-full h-12 text-base font-display font-bold bg-gradient-to-r ${currentConfig.gradient} hover:opacity-90 text-background shadow-lg transition-all duration-300`}
        >
          <Code className="mr-2 w-4 h-4" />
          Get Source Code
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Instant delivery • Lifetime access
        </p>
      </div>

      {/* Payment Gateway Selector */}
      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        amount={currentConfig.price}
        productName={currentConfig.productName}
      />
    </motion.div>
  );
};

export default SourceCodeCard;
