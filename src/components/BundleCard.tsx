import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Gift, Users, ArrowRight, Zap, Crown } from "lucide-react";
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      className="relative group rounded-[2rem] overflow-hidden backdrop-blur-2xl transition-all duration-500"
      style={{
        background: 'linear-gradient(165deg, hsla(188, 100%, 50%, 0.05) 0%, hsla(263, 70%, 58%, 0.04) 30%, hsla(220, 20%, 6%, 0.95) 50%, hsla(220, 20%, 4%, 0.98) 100%)',
        border: '2px solid transparent',
        borderImage: 'linear-gradient(135deg, hsla(188, 100%, 50%, 0.4), hsla(263, 70%, 58%, 0.4)) 1',
        boxShadow: '0 0 0 1px hsla(188, 100%, 50%, 0.1), 0 25px 70px -20px hsla(188, 100%, 50%, 0.15), 0 25px 70px -20px hsla(263, 70%, 58%, 0.1)',
      }}
    >
      {/* Best Value Badge */}
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 px-6 py-1.5 rounded-b-2xl shadow-lg shadow-cyan-500/20">
          <div className="flex items-center gap-1.5">
            <Crown size={11} className="text-white" />
            <span className="text-[10px] font-display font-black text-white tracking-[0.2em]">BEST VALUE</span>
          </div>
        </div>
      </div>

      {/* Glow Effects */}
      <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-15 bg-cyan-500 group-hover:opacity-30 transition-all duration-700" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[100px] opacity-10 bg-violet-500 group-hover:opacity-25 transition-all duration-700" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 p-8 md:p-9">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-display tracking-[0.15em] mb-6 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 text-foreground border border-cyan-500/20 mt-5 backdrop-blur-sm">
          <Gift size={13} className="text-violet-400" />
          BUNDLE DEAL
        </div>

        {/* Name */}
        <h3 className="font-display text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
          {jarvisName} + {myraName}
        </h3>
        <p className="text-muted-foreground text-sm mb-5 leading-relaxed">Get both AI assistants at a discounted price</p>

        {/* Sales Counter */}
        {bundleSoldCount > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-display mb-5 bg-gradient-to-r from-cyan-500/8 to-violet-500/8 text-foreground border border-cyan-500/15 backdrop-blur-sm">
            <Users size={14} className="text-cyan-400" />
            <span>{bundleSoldCount}+ bundles sold</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-display text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
            {formatPrice(bundlePrice)}
          </span>
          <span className="text-muted-foreground text-sm font-medium">/ one-time</span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-muted-foreground line-through text-sm">{formatPrice(originalPrice)}</span>
          <span className="text-[10px] font-display font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            SAVE {formatPrice(savings)}
          </span>
        </div>
        <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
        <div className="mb-7" />

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-7" />

        {/* Features */}
        <ul className="space-y-3.5 mb-9">
          {bundleFeatures.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.06 }}
              className="flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-violet-500 flex-shrink-0 mt-0.5">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
              <span className="text-foreground/80 text-sm leading-relaxed">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* Buy Button */}
        <Button
          variant="neonCyan"
          size="xl"
          className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 hover:opacity-90 group/btn font-black text-base tracking-wide"
          onClick={() => setShowPaymentSelector(true)}
        >
          <Sparkles size={16} className="mr-2" />
          Get Bundle Now
          <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground mt-4 tracking-wide">
          Instant delivery • Lifetime access • Free updates
        </p>
      </div>

      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        productId="bundle_jarvis_myra"
      />
    </motion.div>
  );
};

export default BundleCard;
