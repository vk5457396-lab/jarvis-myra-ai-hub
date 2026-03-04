import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Code, FileCode, GitBranch, Layers, Settings, Star, ArrowRight, Gem } from "lucide-react";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

interface SourceCodeCardProps {
  variant: "jarvis" | "myra" | "aura" | "bundle" | "triple";
}

const SourceCodeCard = ({ variant }: SourceCodeCardProps) => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const { formatPrice, isIndia, currency, countryCode, setSelectedCountry } = useCurrency();

  const isAfterFeb1 = new Date() >= new Date('2026-02-01');
  const myraName = isAfterFeb1 ? "MYRA 2.0" : "MYRA";

  const config = {
    jarvis: {
      productId: "source_jarvis",
      name: "Jarvis 2.0",
      price: isIndia ? 4500 : 3499,
      originalPrice: isIndia ? 5999 : 4999,
      savings: isIndia ? 1499 : 1500,
      gradient: "from-cyan-500 to-blue-500",
      accentHsl: "188 100% 50%",
      badgeText: "JARVIS 2.0",
      borderColor: "border-cyan-500/25",
      features: [
        "Complete Jarvis 2.0 Source Code",
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
      ],
    },
    myra: {
      productId: "source_myra",
      name: myraName,
      price: isIndia ? 4500 : 3499,
      originalPrice: isIndia ? 5999 : 4999,
      savings: isIndia ? 1499 : 1500,
      gradient: "from-violet-500 to-fuchsia-500",
      accentHsl: "263 70% 58%",
      badgeText: myraName.toUpperCase(),
      borderColor: "border-violet-500/25",
      features: [
        `Complete ${myraName} Source Code`,
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
      ],
    },
    aura: {
      productId: "source_aura",
      name: "AURA 1.0",
      price: isIndia ? 4500 : 3499,
      originalPrice: isIndia ? 5999 : 4999,
      savings: isIndia ? 1499 : 1500,
      gradient: "from-pink-500 to-rose-400",
      accentHsl: "330 80% 60%",
      badgeText: "AURA 1.0",
      borderColor: "border-pink-500/25",
      features: [
        "Complete AURA 1.0 Source Code",
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
      ],
    },
    bundle: {
      productId: "source_bundle",
      name: `Jarvis 2.0 + ${myraName}`,
      price: isIndia ? 6999 : 4999,
      originalPrice: isIndia ? 9000 : 6998,
      savings: isIndia ? 2001 : 1999,
      gradient: "from-amber-400 to-orange-500",
      accentHsl: "38 92% 55%",
      badgeText: "BEST VALUE",
      borderColor: "border-amber-500/30",
      features: [
        "Complete Jarvis 2.0 Source Code",
        `Complete ${myraName} Source Code`,
        "Python & Automation Scripts",
        "Full Documentation",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
        "Commercial License",
      ],
    },
    triple: {
      productId: "source_triple",
      name: `All 3 AI Source Codes`,
      price: isIndia ? 9999 : 7999,
      originalPrice: isIndia ? 13500 : 10497,
      savings: isIndia ? 3501 : 2498,
      gradient: "from-emerald-400 via-cyan-400 to-violet-500",
      accentHsl: "160 70% 50%",
      badgeText: "MEGA BUNDLE",
      borderColor: "border-emerald-500/30",
      features: [
        "Complete Jarvis 2.0 Source Code",
        `Complete ${myraName} Source Code`,
        "Complete AURA 1.0 Source Code",
        "All Python & Automation Scripts",
        "Full Documentation for All 3",
        "Customization Guide",
        "Future Code Updates",
        "Developer Support",
        "Commercial License",
      ],
    },
  };

  const c = config[variant];
  const isFeatured = variant === "bundle" || variant === "triple";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="relative group rounded-[2rem] overflow-hidden h-full backdrop-blur-2xl transition-all duration-500"
      style={{
        background: `linear-gradient(165deg, hsla(${c.accentHsl}, 0.06) 0%, hsla(220, 20%, 6%, 0.95) 40%, hsla(220, 20%, 4%, 0.98) 100%)`,
        border: isFeatured ? '2px solid transparent' : '1px solid transparent',
        borderImage: `linear-gradient(135deg, hsla(${c.accentHsl}, ${isFeatured ? '0.5' : '0.25'}), transparent 70%) 1`,
        boxShadow: `0 0 0 1px hsla(${c.accentHsl}, 0.08), 0 20px 50px -15px hsla(${c.accentHsl}, 0.12)`,
      }}
    >
      {/* Glow */}
      <div className="absolute -top-28 -right-28 w-56 h-56 rounded-full blur-[100px] opacity-15 group-hover:opacity-30 transition-all duration-700" style={{ background: `radial-gradient(circle, hsla(${c.accentHsl}, 0.5), transparent 70%)` }} />
      <div className="absolute -bottom-28 -left-28 w-56 h-56 rounded-full blur-[100px] opacity-10" style={{ background: `radial-gradient(circle, hsla(${c.accentHsl}, 0.3), transparent 70%)` }} />

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

      {/* Top Badge */}
      {isFeatured && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20">
          <div className={`bg-gradient-to-r ${c.gradient} px-6 py-1.5 rounded-b-2xl shadow-lg`}>
            <div className="flex items-center gap-1.5">
              <Gem size={11} className="text-white" />
              <span className="text-[10px] font-display font-black text-white tracking-[0.2em]">{c.badgeText}</span>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 p-7 md:p-8">
        {/* Code Badge (non-featured) */}
        {!isFeatured && (
          <div className="absolute top-0 right-0">
            <div className={`bg-gradient-to-r ${c.gradient} text-white px-4 py-1.5 rounded-bl-2xl rounded-tr-[2rem] font-display text-[10px] font-black flex items-center gap-1.5 tracking-wider`}>
              <Code size={10} />
              {c.badgeText}
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-2xl p-4`} style={{ width: '4.5rem', height: '4.5rem' }}>
            <FileCode className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className={`font-display text-xl md:text-2xl font-black mb-1.5 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent tracking-tight`}>
            {c.name}
          </h3>
          <p className="text-muted-foreground text-xs tracking-wider font-display">SOURCE CODE</p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-muted-foreground line-through text-sm">{formatPrice(c.originalPrice)}</span>
            <span className={`font-display text-4xl md:text-5xl font-black bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent tracking-tight`}>
              {formatPrice(c.price)}
            </span>
          </div>
          <p className="text-xs text-emerald-400 mt-1.5 font-bold">Save {formatPrice(c.savings)}!</p>
          <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent to-transparent mb-6" style={{ backgroundImage: `linear-gradient(to right, transparent, hsla(${c.accentHsl}, 0.3), transparent)` }} />

        {/* Features */}
        <div className="space-y-3 mb-7">
          {c.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <div className={`w-4.5 h-4.5 rounded-md bg-gradient-to-r ${c.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`} style={{ width: '1.125rem', height: '1.125rem' }}>
                <Star className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-foreground/80 text-xs md:text-sm leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>

        {/* What You Can Do */}
        <div className="rounded-2xl p-3.5 mb-6" style={{ background: `hsla(${c.accentHsl}, 0.05)`, border: `1px solid hsla(${c.accentHsl}, 0.1)` }}>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Settings, label: "Customize" },
              { icon: GitBranch, label: "Extend" },
              { icon: Layers, label: "Integrate" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-foreground/70"
                style={{ background: `hsla(${c.accentHsl}, 0.08)`, border: `1px solid hsla(${c.accentHsl}, 0.12)` }}
              >
                <item.icon size={11} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Buy Button */}
        <Button
          onClick={() => setShowPaymentSelector(true)}
          className={`w-full h-13 text-sm font-display font-black bg-gradient-to-r ${c.gradient} hover:opacity-90 text-white shadow-xl transition-all duration-300 rounded-2xl group/btn tracking-wide`}
          style={{ height: '3.25rem' }}
        >
          <Code className="mr-2 w-4 h-4" />
          Get Source Code
          <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>

        <p className="text-center text-[10px] text-muted-foreground mt-4 tracking-wide">
          Instant delivery • Lifetime access
        </p>
      </div>

      <PaymentGatewaySelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        productId={c.productId}
      />
    </motion.div>
  );
};

export default SourceCodeCard;
