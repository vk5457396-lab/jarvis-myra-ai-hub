import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Gift, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import { usePurchaseCounts } from "@/hooks/usePurchaseCounts";
import { getMyraPrice, getMyraName, getBundlePrice, getJarvisName } from "@/utils/flashSale";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

const BundleCard = () => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const { data: purchaseCounts } = usePurchaseCounts();
  const { formatPrice, currency, countryCode, setSelectedCountry } = useCurrency();

  const jarvisPrice = 899;
  const myraPrice = getMyraPrice();
  const bundlePrice = getBundlePrice();
  const originalPrice = jarvisPrice + myraPrice;
  const savings = originalPrice - bundlePrice;
  const myraName = getMyraName();
  const jarvisName = getJarvisName();

  const bundleSoldCount = purchaseCounts?.bundle || 0;

  const bundleFeatures = [
    `Both ${jarvisName} & ${myraName} included`,
    `Save ${formatPrice(savings)} on bundle`,
    `All ${jarvisName} features`,
    `All ${myraName} features`,
    "Priority support",
    "Free lifetime updates",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
      whileHover={{ y: -8 }}
      className="relative group rounded-3xl overflow-hidden border-2 border-transparent backdrop-blur-xl bg-gradient-to-b from-primary/8 to-secondary/8"
      style={{
        borderImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary))) 1",
      }}
    >
      {/* Best Value Badge */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-gradient-neon px-5 py-1 rounded-b-xl">
          <span className="text-[10px] font-display font-bold text-background tracking-wider">BEST VALUE</span>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-15 bg-primary group-hover:opacity-25 transition-opacity duration-500" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[80px] opacity-15 bg-secondary group-hover:opacity-25 transition-opacity duration-500" />

      <div className="relative z-10 p-7 md:p-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-display tracking-wider mb-5 bg-gradient-to-r from-primary/10 to-secondary/10 text-foreground border border-primary/20 mt-4 backdrop-blur-sm">
          <Gift size={12} className="text-secondary" />
          BUNDLE DEAL
        </div>

        {/* Name */}
        <h3 className="font-display text-3xl font-bold mb-2 bg-gradient-neon bg-clip-text text-transparent">
          {jarvisName} + {myraName}
        </h3>
        <p className="text-muted-foreground text-sm mb-4">Get both AI assistants at a discounted price</p>

        {/* Sales Counter */}
        {bundleSoldCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display mb-4 bg-gradient-to-r from-primary/8 to-secondary/8 text-foreground border border-primary/15 backdrop-blur-sm">
            <Users size={14} className="text-primary" />
            <span>{bundleSoldCount}+ bundles sold</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-display text-5xl font-bold bg-gradient-neon bg-clip-text text-transparent">
            {formatPrice(bundlePrice)}
          </span>
          <span className="text-muted-foreground text-sm">/ one-time</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
          <span className="text-[10px] font-display px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
            SAVE {formatPrice(savings)}
          </span>
        </div>
        <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
        <div className="mb-5" />

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {bundleFeatures.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + index * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gradient-neon">
                <Check size={11} className="text-background" />
              </div>
              <span className="text-foreground/80 text-sm">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* Buy Button */}
        <Button
          variant="neonCyan"
          size="xl"
          className="w-full bg-gradient-neon hover:opacity-90 group/btn"
          onClick={() => setShowPaymentSelector(true)}
        >
          <Sparkles size={16} className="mr-2" />
          Get Bundle Now
          <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>

      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        amount={bundlePrice}
        productName={`${jarvisName} + ${myraName} Bundle`}
      />
    </motion.div>
  );
};

export default BundleCard;
