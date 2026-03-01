import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

const MobileAppComingSoon = () => {
  const { formatPrice, isIndia, currency, countryCode, setSelectedCountry } = useCurrency();

  const features = [
    "Human-like Girlfriend Voice",
    "Spotify Music Control",
    "YouTube Playback",
    "WhatsApp Messaging",
    "Email Automation",
    "All Tasks Automation",
  ];

  const handleBuyClick = () => {
    window.open("https://www.zaraai.in/", "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -10 }}
      className="relative glass-card rounded-2xl p-8 overflow-hidden border border-pink-500/30"
    >
      {/* Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 bg-pink-500" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-display tracking-wider mb-4 bg-pink-500/20 text-pink-400 border border-pink-500/30">
        <Sparkles size={12} />
        MOBILE AI COMPANION
      </div>

      {/* Name & Tagline */}
      <h3 className="font-display text-3xl font-bold mb-2 text-pink-400" style={{ textShadow: "0 0 20px rgba(236, 72, 153, 0.5)" }}>
        AI Girlfriend
      </h3>
      <p className="text-muted-foreground mb-4">Your personal AI companion with a human-like voice</p>

      {/* Includes Badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 bg-gradient-to-r from-pink-500/20 to-purple-500/10 border border-pink-500/30">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-pink-500/30">
          <span className="text-xs">📱</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">Includes: Android Mobile App</p>
          <p className="text-[10px] text-muted-foreground">Ready-to-install APK for Android devices</p>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-muted-foreground line-through text-lg">{formatPrice(2499)}</span>
        <span className="font-display text-5xl font-bold text-foreground">{formatPrice(1599)}</span>
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
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center bg-pink-500/20">
              <Check size={12} className="text-pink-400" />
            </div>
            <span className="text-foreground/80 text-sm">{feature}</span>
          </motion.li>
        ))}
      </ul>

      {/* Buy Button */}
      <Button
        size="xl"
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)] hover:scale-105 border border-pink-500/30 transition-all duration-300"
        onClick={handleBuyClick}
      >
        Buy AI Girlfriend Now
      </Button>

      {/* Source Code Coming Soon */}
      <div className="mt-4 flex items-center gap-2 justify-center">
        <div className="glass rounded-lg px-4 py-2 border border-cyan-500/30 inline-flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Source Code:</span>
          <span className="font-display font-bold text-cyan-400">{formatPrice(8999)}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">COMING SOON</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileAppComingSoon;
