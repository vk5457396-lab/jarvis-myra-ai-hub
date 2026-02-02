import { motion } from "framer-motion";
import { usePurchaseCounts } from "@/hooks/usePurchaseCounts";
import { Users, ShoppingCart, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SalesSummary = () => {
  const { data: counts, isLoading } = usePurchaseCounts();

  const stats = [
    {
      icon: Users,
      label: "Total Customers",
      value: counts?.total || 0,
      color: "text-primary",
      glow: "glow-cyan",
    },
    {
      icon: ShoppingCart,
      label: "Jarvis Sales",
      value: counts?.jarvis || 0,
      color: "text-primary",
      glow: "glow-cyan",
    },
    {
      icon: Sparkles,
      label: "MYRA Sales",
      value: counts?.myra || 0,
      color: "text-secondary",
      glow: "glow-purple",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-6 md:p-8"
    >
      <div className="text-center mb-6">
        <h3 className="font-display text-xl md:text-2xl font-bold gradient-text">
          Live Sales Counter
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          Join our growing community
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className={`w-12 h-12 rounded-full glass ${stat.glow} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
            ) : (
              <div className={`font-display text-2xl md:text-3xl font-bold ${stat.color}`}>
                {stat.value}+
              </div>
            )}
            <div className="text-muted-foreground text-xs md:text-sm">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SalesSummary;
