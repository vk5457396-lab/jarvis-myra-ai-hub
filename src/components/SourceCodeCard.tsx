"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Code, FileCode, GitBranch, Layers, Settings, Star, ArrowRight, Gem, Shield } from "lucide-react";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import ContactFormModal from "@/components/ContactFormModal";
import { useCurrency } from "@/hooks/useCurrency";
import CurrencySelector from "@/components/CurrencySelector";

interface SourceCodeCardProps {
  variant: "jarvis" | "myra" | "aria" | "bundle";
}

const SourceCodeCard = ({ variant }: SourceCodeCardProps) => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "" });
  const { formatPrice, isIndia, currency, countryCode, setSelectedCountry } = useCurrency();
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 25 });
  const rotateX = useTransform(springY, [0, 1], [4, -4]);
  const rotateY = useTransform(springX, [0, 1], [-4, 4]);

  const isAfterFeb1 = new Date() >= new Date('2026-02-01');
  const myraName = isAfterFeb1 ? "MYRA 2.0" : "MYRA";

  const config = {
    jarvis: { productId: "source_jarvis", name: "Jarvis 2.0", price: isIndia ? 3900 : 3499, originalPrice: isIndia ? 5999 : 4999, savings: isIndia ? 2099 : 1500, gradient: "from-cyan-400 via-blue-500 to-indigo-600", hsl: "188 100% 50%", badgeText: "JARVIS 2.0", features: ["Complete Jarvis 2.0 Source Code", "Python & Automation Scripts", "Full Documentation", "Customization Guide", "Future Code Updates", "Developer Support"] },
    myra: { productId: "source_myra", name: myraName, price: isIndia ? 3900 : 3499, originalPrice: isIndia ? 5999 : 4999, savings: isIndia ? 2099 : 1500, gradient: "from-violet-400 via-purple-500 to-fuchsia-600", hsl: "263 70% 58%", badgeText: myraName.toUpperCase(), features: [`Complete ${myraName} Source Code`, "Python & Automation Scripts", "Full Documentation", "Customization Guide", "Future Code Updates", "Developer Support"] },
    aria: { productId: "source_aria", name: "ARIA 1.0", price: isIndia ? 3900 : 3499, originalPrice: isIndia ? 5999 : 4999, savings: isIndia ? 2099 : 1500, gradient: "from-emerald-400 via-teal-500 to-cyan-600", hsl: "160 70% 50%", badgeText: "ARIA 1.0", features: ["Complete ARIA 1.0 Source Code", "Music & Audio Engine Code", "Python & Automation Scripts", "Full Documentation", "Customization Guide", "Future Code Updates", "Developer Support"] },
    bundle: { productId: "source_bundle", name: `Jarvis 2.0 + ${myraName}`, price: isIndia ? 6999 : 5999, originalPrice: isIndia ? 7800 : 6998, savings: isIndia ? 801 : 999, gradient: "from-amber-400 via-orange-500 to-red-500", hsl: "38 92% 55%", badgeText: "BEST VALUE", features: ["Complete Jarvis 2.0 Source Code", `Complete ${myraName} Source Code`, "Python & Automation Scripts", "Full Documentation", "Customization Guide", "Future Code Updates", "Developer Support", "Commercial License"] },
  };

  const c = config[variant];
  const isFeatured = variant === "bundle";

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleContactSubmit = (data: { name: string; email: string; phone: string }) => {
    setCustomerInfo(data);
    setShowContactForm(false);
    setShowPaymentSelector(true);
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
        className="relative group rounded-3xl overflow-hidden h-full transition-all duration-500 will-change-transform hover:-translate-y-2"
      >
        {/* Animated ring */}
        <div className="absolute inset-0 rounded-3xl p-px overflow-hidden">
          <motion.div className="absolute inset-[-300%]" animate={{ rotate: 360 }} transition={{ duration: isFeatured ? 8 : 12, repeat: Infinity, ease: "linear" }}
            style={{ background: `conic-gradient(from 0deg, hsla(${c.hsl}, ${isFeatured ? 0.6 : 0.4}), transparent 35%, hsla(${c.hsl}, ${isFeatured ? 0.6 : 0.4}), transparent 75%)` }} />
        </div>

        {/* Body */}
        <div className="relative rounded-[calc(1.5rem-1px)] overflow-hidden m-px h-full backdrop-blur-xl" style={{ background: `linear-gradient(170deg, hsla(${c.hsl}, 0.07) 0%, hsla(220, 15%, 8%, 0.98) 35%, hsla(220, 20%, 5%, 0.99) 100%)` }}>

          {/* Mesh gradient */}
          <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 0%, hsla(${c.hsl}, 0.12), transparent 50%), radial-gradient(ellipse at 80% 100%, hsla(${c.hsl}, 0.08), transparent 50%)` }} />

          {/* Floating orbs */}
          {[...Array(3)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
              style={{ background: `hsla(${c.hsl}, 0.12)`, width: `${50 + i * 15}px`, height: `${50 + i * 15}px`, left: `${15 + i * 25}%`, top: `${20 + (i % 2) * 35}%` }}
              animate={{ y: [0, -12, 0] }} transition={{ duration: 3.5 + i, repeat: Infinity, delay: i * 0.5 }} />
          ))}

          {/* Badge */}
          {isFeatured ? (
            <div className="absolute -top-px left-1/2 -translate-x-1/2 z-20">
              <motion.div
                animate={{ boxShadow: [`0 4px 20px hsla(${c.hsl}, 0.3)`, `0 4px 40px hsla(${c.hsl}, 0.6)`, `0 4px 20px hsla(${c.hsl}, 0.3)`] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`bg-gradient-to-r ${c.gradient} px-8 py-2.5 rounded-b-2xl`}
              >
                <span className="text-[10px] font-display font-black text-white tracking-[0.25em] flex items-center gap-2">
                  <Gem size={12} /> {c.badgeText}
                </span>
              </motion.div>
            </div>
          ) : (
            <div className="absolute top-0 right-0">
              <div className={`bg-gradient-to-r ${c.gradient} text-white px-5 py-2 rounded-bl-2xl rounded-tr-3xl font-display text-[10px] font-black flex items-center gap-2 tracking-wider`}>
                <Code size={11} /> {c.badgeText}
              </div>
            </div>
          )}

          <div className="relative z-10 p-7 md:p-9">
            {/* Icon */}
            <div className="flex justify-center mb-7">
              <motion.div whileHover={{ scale: 1.15, rotate: 8 }} className={`rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-2xl p-4`} style={{ width: '4.5rem', height: '4.5rem', boxShadow: `0 0 35px hsla(${c.hsl}, 0.3)` }}>
                <FileCode className="w-8 h-8 text-white" />
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center mb-7">
              <h3 className={`font-display text-xl md:text-2xl font-black mb-2 bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent tracking-tight`}>{c.name}</h3>
              <p className="text-muted-foreground text-xs tracking-widest font-display">SOURCE CODE</p>
            </div>

            {/* Price */}
            <div className="text-center mb-7">
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-muted-foreground line-through text-sm">{formatPrice(c.originalPrice)}</span>
                <span className={`font-display text-4xl md:text-5xl font-black bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent tracking-tighter`} style={{ textShadow: `0 0 50px hsla(${c.hsl}, 0.25)` }}>
                  {formatPrice(c.price)}
                </span>
              </div>
              <p className="text-xs text-emerald-400 mt-2 font-bold font-display">Save {formatPrice(c.savings)}!</p>
              <CurrencySelector currentCode={countryCode} onSelect={setSelectedCountry} currency={currency} />
            </div>

            {/* Divider */}
            <div className="h-px w-full mb-7" style={{ background: `linear-gradient(to right, transparent 5%, hsla(${c.hsl}, 0.2) 50%, transparent 95%)` }} />

            {/* Features */}
            <div className="space-y-3 mb-8">
              {c.features.map((feature, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }} className="flex items-start gap-3 text-sm group/item">
                  <motion.div whileHover={{ scale: 1.3, rotate: 10 }} className={`rounded-lg bg-gradient-to-r ${c.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`} style={{ width: '1.125rem', height: '1.125rem', boxShadow: `0 0 10px hsla(${c.hsl}, 0.3)` }}>
                    <Star className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                  <span className="text-foreground/70 text-xs md:text-sm leading-relaxed group-hover/item:text-foreground transition-colors duration-300">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Action badges */}
            <div className="rounded-2xl p-4 mb-7" style={{ background: `hsla(${c.hsl}, 0.03)`, border: `1px solid hsla(${c.hsl}, 0.08)` }}>
              <div className="flex flex-wrap justify-center gap-2">
                {[{ icon: Settings, label: "Customize" }, { icon: GitBranch, label: "Extend" }, { icon: Layers, label: "Integrate" }].map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground/60" style={{ background: `hsla(${c.hsl}, 0.06)`, border: `1px solid hsla(${c.hsl}, 0.1)` }}>
                    <item.icon size={11} /> {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Buy Button */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => setShowContactForm(true)}
                className={`w-full text-sm font-display font-black bg-gradient-to-r ${c.gradient} hover:opacity-90 text-white shadow-xl transition-all duration-300 rounded-2xl group/btn tracking-wide relative overflow-hidden`}
                style={{ height: '3.25rem', boxShadow: `0 0 30px hsla(${c.hsl}, 0.2)` }}
              >
                <motion.div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }} style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", width: "40%" }} />
                <Code className="mr-2 w-4 h-4 relative z-10" />
                <span className="relative z-10">Get Source Code</span>
                <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-2 transition-transform duration-300 relative z-10" />
              </Button>
            </motion.div>

            <p className="text-center text-[10px] text-muted-foreground mt-5 tracking-wider font-display">
              ⚡ Instant delivery • ♾️ Lifetime access
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: `linear-gradient(to top, hsla(${c.hsl}, 0.03), transparent)` }} />
        </div>
      </motion.div>

      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} onSubmit={handleContactSubmit} productName={`${c.name} Source Code`} accentHsl={c.hsl} />
      <PaymentGatewaySelector isOpen={showPaymentSelector} onClose={() => setShowPaymentSelector(false)} productId={c.productId} customerName={customerInfo.name} customerEmail={customerInfo.email} customerPhone={customerInfo.phone} />
    </>
  );
};

export default SourceCodeCard;