import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRazorpay } from "@/hooks/useRazorpay";
import { Code, FileCode, GitBranch, Layers, Settings, Star } from "lucide-react";

const SourceCodeCard = () => {
  const { initiatePayment } = useRazorpay();

  const handleBuyClick = () => {
    initiatePayment({
      amount: 3499,
      productName: "Jarvis + MYRA Source Code",
    });
  };

  const sourceCodeFeatures = [
    "Complete Jarvis Source Code",
    "Complete MYRA Source Code",
    "Python & Automation Scripts",
    "Full Documentation",
    "Customization Guide",
    "Future Code Updates",
    "Developer Support",
    "Commercial License",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="relative glass-card rounded-3xl p-8 border-2 border-yellow-500/50 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-red-500/10" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl" />

      {/* Developer Badge */}
      <div className="absolute -top-1 -right-1">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 blur-sm" />
          <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-background px-4 py-1.5 rounded-bl-xl rounded-tr-2xl font-display text-sm font-bold flex items-center gap-1">
            <Code size={14} />
            FOR DEVELOPERS
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <FileCode className="w-10 h-10 text-background" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
            Source Code Bundle
          </h3>
          <p className="text-muted-foreground">
            Get full access to Jarvis & MYRA source code
          </p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-muted-foreground line-through text-lg">₹4999</span>
            <span className="font-display text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              ₹3499
            </span>
          </div>
          <p className="text-sm text-green-400 mt-1 font-medium">
            Save ₹1500 - Limited Time Offer!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {sourceCodeFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-3 h-3 text-yellow-400" />
              </div>
              <span className="text-foreground/90">{feature}</span>
            </div>
          ))}
        </div>

        {/* What You Can Do */}
        <div className="glass rounded-xl p-4 mb-6">
          <p className="text-sm text-center text-muted-foreground mb-3">
            <span className="text-yellow-400 font-semibold">Build Your Own AI Assistant</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Settings, label: "Customize" },
              { icon: GitBranch, label: "Extend" },
              { icon: Layers, label: "Integrate" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 text-xs text-yellow-400"
              >
                <item.icon size={12} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Buy Button */}
        <Button
          onClick={handleBuyClick}
          className="w-full h-14 text-lg font-display font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-background shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-300"
        >
          <Code className="mr-2" />
          Get Source Code Now
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Instant delivery • Lifetime access • Commercial license
        </p>
      </div>
    </motion.div>
  );
};

export default SourceCodeCard;
