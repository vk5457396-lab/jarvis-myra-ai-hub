import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import { usePurchaseCounts } from "@/hooks/usePurchaseCounts";

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
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const { data: purchaseCounts } = usePurchaseCounts();
  
  const soldCount = isJarvis ? purchaseCounts?.jarvis || 0 : purchaseCounts?.myra || 0;

  const handleBuyClick = () => {
    setShowPaymentSelector(true);
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
      <p className="text-muted-foreground mb-4">{tagline}</p>

      {/* Sales Counter */}
      {soldCount > 0 && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display mb-4 ${
          isJarvis 
            ? "bg-primary/10 text-primary border border-primary/20" 
            : "bg-secondary/10 text-secondary border border-secondary/20"
        }`}>
          <Users size={14} />
          <span>{soldCount}+ users already purchased</span>
        </div>
      )}

      {/* Includes Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${
        isJarvis 
          ? "bg-gradient-to-r from-primary/20 to-cyan-500/10 border border-primary/30" 
          : "bg-gradient-to-r from-secondary/20 to-purple-500/10 border border-secondary/30"
      }`}>
        <div className={`w-6 h-6 rounded flex items-center justify-center ${
          isJarvis ? "bg-primary/30" : "bg-secondary/30"
        }`}>
          <span className="text-xs">📦</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">
            {isJarvis ? "Includes: Old Source Code" : "Includes: .exe File"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isJarvis ? "Learn & customize the original codebase" : "Ready-to-run executable for Windows"}
          </p>
        </div>
      </div>

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

      {/* Payment Gateway Selector */}
      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        amount={price}
        productName={name}
      />
    </motion.div>
  );
};

export default ProductCard;
