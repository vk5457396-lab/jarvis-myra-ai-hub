import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";

const BundleCard = () => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  // Dynamic pricing: Jarvis becomes ₹899 from Feb 1, 2025
  const isAfterFeb1 = new Date() >= new Date('2025-02-01');
  const jarvisPrice = isAfterFeb1 ? 899 : 799;
  const myraPrice = 799;
  const bundlePrice = isAfterFeb1 ? 1499 : 1399;
  const originalPrice = jarvisPrice + myraPrice;
  const savings = originalPrice - bundlePrice;

  const handleBuyClick = () => {
    setShowPaymentSelector(true);
  };

  const bundleFeatures = [
    "Both Jarvis & MYRA included",
    `Save ₹${savings} on bundle`,
    "All Jarvis features",
    "All MYRA features",
    "Priority support",
    "Free lifetime updates",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.15 }}
      whileHover={{ y: -10 }}
      className="relative glass-card rounded-2xl p-8 overflow-hidden border-2 border-transparent bg-gradient-to-b from-primary/10 to-secondary/10"
      style={{
        borderImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary))) 1",
      }}
    >
      {/* Best Value Badge */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2">
        <div className="bg-gradient-neon px-4 py-1 rounded-b-lg">
          <span className="text-xs font-display font-bold text-background tracking-wider">
            BEST VALUE
          </span>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 bg-primary" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-20 bg-secondary" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-display tracking-wider mb-4 bg-gradient-to-r from-primary/20 to-secondary/20 text-foreground border border-primary/30 mt-4">
        <Gift size={12} className="text-secondary" />
        BUNDLE DEAL
      </div>

      {/* Name & Tagline */}
      <h3 className="font-display text-3xl font-bold mb-2 bg-gradient-neon bg-clip-text text-transparent">
        Jarvis + MYRA
      </h3>
      <p className="text-muted-foreground mb-6">
        Get both AI assistants at a discounted price
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-display text-5xl font-bold text-foreground">
          ₹{bundlePrice.toLocaleString('en-IN')}
        </span>
        <span className="text-muted-foreground">/ one-time</span>
      </div>
      <div className="flex items-center gap-2 mb-8">
        <span className="text-muted-foreground line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
        <span className="text-xs font-display px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
          SAVE ₹{savings}
        </span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {bundleFeatures.map((feature, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gradient-neon">
              <Check size={12} className="text-background" />
            </div>
            <span className="text-foreground/80 text-sm">{feature}</span>
          </motion.li>
        ))}
      </ul>

      {/* Buy Button */}
      <Button
        variant="neonCyan"
        size="xl"
        className="w-full bg-gradient-neon hover:opacity-90"
        onClick={handleBuyClick}
      >
        <Sparkles size={18} className="mr-2" />
        Get Bundle Now
      </Button>

      {/* Payment Gateway Selector */}
      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        amount={bundlePrice}
        productName="Jarvis + MYRA Bundle"
      />
    </motion.div>
  );
};

export default BundleCard;
