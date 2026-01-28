import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";

const PriceCountdown = () => {
  const targetDate = new Date('2026-02-01T00:00:00');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isExpired) {
    return null; // Don't show countdown after Feb 1st
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-yellow-400">
            Price Increase Alert!
          </h3>
          <p className="text-sm text-muted-foreground">
            MYRA price goes from ₹799 → ₹899 on Feb 1st
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Mins" },
          { value: timeLeft.seconds, label: "Secs" },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="glass rounded-lg p-3 border border-yellow-500/20">
              <motion.span
                key={item.value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-display text-2xl md:text-3xl font-bold text-yellow-400 block"
              >
                {String(item.value).padStart(2, '0')}
              </motion.span>
            </div>
            <span className="text-xs text-muted-foreground mt-1 block">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4" />
        Buy MYRA at ₹799 before time runs out!
      </p>
    </motion.div>
  );
};

export default PriceCountdown;
