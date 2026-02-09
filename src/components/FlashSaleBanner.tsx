import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Clock, Zap } from "lucide-react";
import { isFlashSaleActive, getFlashSaleEnd } from "@/utils/flashSale";

const FlashSaleBanner = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const update = () => {
      if (!isFlashSaleActive()) {
        setActive(false);
        return;
      }
      setActive(true);
      const diff = getFlashSaleEnd().getTime() - Date.now();
      if (diff <= 0) { setActive(false); return; }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 border-2 border-red-500/40 bg-gradient-to-r from-red-500/15 via-orange-500/10 to-yellow-500/15 relative overflow-hidden"
    >
      {/* Animated glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center"
          >
            <Flame className="w-6 h-6 text-red-400" />
          </motion.div>
          <div>
            <h3 className="font-display text-xl font-bold text-red-400 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              FLASH SALE — 24 Hours Only!
            </h3>
            <p className="text-sm text-muted-foreground">
              MYRA 2.0 at <span className="line-through text-red-400/60">₹899</span>{" "}
              <span className="text-green-400 font-bold">₹799</span> — Save ₹100!
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {[
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Mins" },
            { value: timeLeft.seconds, label: "Secs" },
          ].map((item, i) => (
            <div key={item.label} className="text-center">
              <div className="glass rounded-lg px-4 py-3 border border-red-500/30 min-w-[70px]">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={item.value}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className="font-display text-3xl font-bold text-red-400 block"
                  >
                    {String(item.value).padStart(2, "0")}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-xs text-muted-foreground mt-1 block">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-red-400" />
          Offer expires automatically — Grab it now!
        </p>
      </div>
    </motion.div>
  );
};

export default FlashSaleBanner;
