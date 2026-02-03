import { motion } from "framer-motion";
import { Send, Globe, Code2, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const WebsiteServiceCard = () => {
  const telegramLink = "https://t.me/codeninjavik1?text=" + encodeURIComponent(
    "🌐 Website Development Inquiry\n\nHi, I'm interested in getting a professional website built. Please share more details about your services and pricing."
  );

  const features = [
    { icon: Globe, text: "Custom Web Design" },
    { icon: Code2, text: "Modern Tech Stack" },
    { icon: Rocket, text: "Fast Delivery" },
    { icon: Sparkles, text: "SEO Optimized" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="relative glass-card rounded-2xl p-8 overflow-hidden border border-secondary/30"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-secondary/30 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="text-xs font-display text-secondary tracking-wider">SERVICES</span>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1 text-center lg:text-left">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">
              Need a <span className="text-secondary text-glow-purple">Professional Website</span>?
            </h3>
            <p className="text-muted-foreground mb-6">
              Get a stunning, modern website built for your business or personal brand. 
              Fast delivery, affordable pricing, and complete customization.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <feature.icon className="w-4 h-4 text-secondary" />
                  <span className="text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <a href={telegramLink} target="_blank" rel="noopener noreferrer">
              <Button variant="neonPurple" size="xl" className="gap-2 group">
                <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                DM on Telegram for Quote
              </Button>
            </a>
          </div>

          {/* Decorative Element */}
          <div className="hidden lg:flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="relative w-48 h-48"
            >
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-secondary/30" />
              <div className="absolute inset-4 rounded-full border border-primary/20" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                <Globe className="w-16 h-16 text-secondary/60" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WebsiteServiceCard;
