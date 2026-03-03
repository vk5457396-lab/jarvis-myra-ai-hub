import { motion } from "framer-motion";
import { Check, Sparkles, Smartphone } from "lucide-react";
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
      className="relative rounded-3xl overflow-hidden border border-pink-500/30 bg-gradient-to-br from-pink-500/5 via-background to-rose-500/5"
    >
      <div className="absolute inset-0 circuit-pattern opacity-5" />
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[80px] opacity-15 bg-pink-500" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-[80px] opacity-15 bg-rose-500" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 p-8 md:p-10 items-center">
        {/* Left: Content */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-display tracking-wider mb-5 bg-pink-500/15 text-pink-400 border border-pink-500/30">
            <Smartphone size={14} />
            MOBILE APP • ANDROID
          </div>

          <h3 className="font-display text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">AI Girlfriend</span>
            <br />
            <span className="text-foreground text-2xl md:text-3xl">Mobile App</span>
          </h3>
          <p className="text-muted-foreground mb-5 text-sm md:text-base">Your personal AI companion with a human-like voice — now on your Android phone</p>

          {/* Includes Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-5 bg-gradient-to-r from-pink-500/10 to-purple-500/5 border border-pink-500/20">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-500/20">
              <span className="text-sm">📱</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Includes: Android APK</p>
              <p className="text-[10px] text-muted-foreground">Ready-to-install on any Android device</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-muted-foreground line-through text-lg">{formatPrice(2499)}</span>
            <span className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{formatPrice(1599)}</span>
            <span className="text-muted-foreground text-sm">/ one-time</span>
          </div>
          <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
          <div className="mb-5" />

          {/* Features */}
          <ul className="space-y-2.5 mb-6">
            {features.map((feature, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
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
            className="w-full md:w-auto px-10 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold shadow-[0_0_25px_rgba(236,72,153,0.35)] hover:shadow-[0_0_35px_rgba(236,72,153,0.5)] hover:scale-105 border border-pink-500/30 transition-all duration-300"
            onClick={handleBuyClick}
          >
            <Sparkles size={16} className="mr-2" />
            Buy AI Girlfriend Now
          </Button>

          {/* Source Code */}
          <div className="mt-4 flex items-center gap-2">
            <div className="glass rounded-lg px-4 py-2 border border-cyan-500/30 inline-flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Source Code:</span>
              <span className="font-display font-bold text-cyan-400">{formatPrice(8999)}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">COMING SOON</span>
            </div>
          </div>
        </div>

        {/* Right: Phone Image */}
        <motion.div
          initial={{ opacity: 0, x: 30, rotateY: 10 }}
          whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center items-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-pink-500/20 to-rose-500/20 rounded-[2rem] blur-2xl opacity-40" />
            <img
              src="/mobile-ai-girlfriend.png"
              alt="AI Girlfriend Mobile App - Android"
              className="relative w-64 md:w-80 rounded-2xl drop-shadow-2xl"
            />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 border border-pink-500/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-muted-foreground font-display">Available Now</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MobileAppComingSoon;
