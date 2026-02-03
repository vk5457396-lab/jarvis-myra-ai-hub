import { motion } from "framer-motion";
import { usePurchaseCounts } from "@/hooks/usePurchaseCounts";
import { Users, ShoppingCart, Sparkles, Package, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

const AnimatedCounter = ({ value, duration = 2, suffix = "", className = "" }: AnimatedCounterProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      onUpdate: (latest) => setDisplayValue(Math.floor(latest)),
    });
    return controls.stop;
  }, [value, duration]);

  return (
    <span className={className}>
      {displayValue.toLocaleString('en-IN')}{suffix}
    </span>
  );
};

const SalesSummary = () => {
  const { data: counts, isLoading, isRefetching } = usePurchaseCounts();

  const stats = [
    {
      icon: Users,
      label: "Total Customers",
      value: counts?.total || 0,
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
      glow: "shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
      suffix: "+",
    },
    {
      icon: ShoppingCart,
      label: "Jarvis Sales",
      value: counts?.jarvis || 0,
      color: "text-primary",
      bgGradient: "from-primary/20 to-primary/5",
      glow: "shadow-[0_0_20px_hsl(var(--primary)/0.3)]",
      suffix: "",
    },
    {
      icon: Sparkles,
      label: "MYRA Sales",
      value: counts?.myra || 0,
      color: "text-secondary",
      bgGradient: "from-secondary/20 to-secondary/5",
      glow: "shadow-[0_0_20px_hsl(var(--secondary)/0.3)]",
      suffix: "",
    },
    {
      icon: Package,
      label: "Bundle Sales",
      value: counts?.bundle || 0,
      color: "text-accent",
      bgGradient: "from-accent/20 to-accent/5",
      glow: "shadow-[0_0_20px_hsl(var(--accent)/0.3)]",
      suffix: "",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      {/* Live indicator */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-display text-primary tracking-wider">LIVE SALES</span>
          {isRefetching && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <TrendingUp className="w-3 h-3 text-primary" />
            </motion.div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 md:p-8 pt-10 border border-primary/20">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="font-display text-xl md:text-2xl font-bold gradient-text mb-2">
            Sales Counter
          </h3>
          <p className="text-muted-foreground text-sm">
            Join our growing community of satisfied users
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`relative text-center p-4 rounded-xl bg-gradient-to-b ${stat.bgGradient} border border-border/50 ${stat.glow} transition-all duration-300`}
            >
              <div className={`w-10 h-10 rounded-full bg-background/50 flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
              ) : (
                <motion.div 
                  className={`font-display text-2xl md:text-3xl font-bold ${stat.color}`}
                  key={stat.value}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </motion.div>
              )}
              <div className="text-muted-foreground text-xs mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Verified Payments
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Secure Transactions
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Instant Delivery
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SalesSummary;
