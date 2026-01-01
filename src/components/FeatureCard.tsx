import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  variant?: "cyan" | "purple";
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay = 0,
  variant = "cyan",
}: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card rounded-xl p-6 group cursor-pointer"
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${
          variant === "cyan"
            ? "bg-primary/20 group-hover:bg-primary/30 group-hover:shadow-neon-cyan"
            : "bg-secondary/20 group-hover:bg-secondary/30 group-hover:shadow-neon-purple"
        }`}
      >
        <Icon
          className={`w-6 h-6 ${
            variant === "cyan" ? "text-primary" : "text-secondary"
          }`}
        />
      </div>
      <h3 className="font-display text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export default FeatureCard;
