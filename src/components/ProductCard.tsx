import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRazorpay } from "@/hooks/useRazorpay";

interface ProductCardProps {
  name: string;
  tagline: string;
  price: number;
  features: string[];
  variant: "jarvis" | "myra";
  delay?: number;
}

const ProductCard = ({
  name,
  tagline,
  price,
  features,
  variant,
  delay = 0,
}: ProductCardProps) => {
  const isJarvis = variant === "jarvis";
  const { initiatePayment } = useRazorpay();

  const handleBuyClick = () => {
    initiatePayment({
      amount: price,
      productName: name,
    });
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10 }}
      className={`relative glass-card rounded-2xl p-8 overflow-hidden ${
        isJarvis ? "border-primary/30" : "border-secondary/30"
      } border`}
    >
      {/* Glow Effect */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 ${
          isJarvis ? "bg-primary" : "bg-secondary"
        }`}
      />

      {/* Badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-display tracking-wider mb-4 ${
          isJarvis
            ? "bg-primary/20 text-primary border border-primary/30"
            : "bg-secondary/20 text-secondary border border-secondary/30"
        }`}
      >
        <Sparkles size={12} />
        {isJarvis ? "SYSTEM AUTOMATION" : "PERSONAL ASSISTANT"}
      </div>

      {/* Name & Tagline */}
      <h3
        className={`font-display text-3xl font-bold mb-2 ${
          isJarvis ? "text-glow-cyan text-primary" : "text-glow-purple text-secondary"
        }`}
      >
        {name}
      </h3>
      <p className="text-muted-foreground mb-6">{tagline}</p>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-8">
        <span className="font-display text-5xl font-bold text-foreground">
          ₹{price}
        </span>
        <span className="text-muted-foreground">/ one-time</span>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + index * 0.1 }}
            className="flex items-center gap-3"
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isJarvis ? "bg-primary/20" : "bg-secondary/20"
              }`}
            >
              <Check
                size={12}
                className={isJarvis ? "text-primary" : "text-secondary"}
              />
            </div>
            <span className="text-foreground/80 text-sm">{feature}</span>
          </motion.li>
        ))}
      </ul>

      {/* Buy Button */}
      <Button
        variant={isJarvis ? "neonCyan" : "neonPurple"}
        size="xl"
        className="w-full"
        onClick={handleBuyClick}
      >
        Buy {name} Now
      </Button>
    </motion.div>
  );
};

export default ProductCard;
