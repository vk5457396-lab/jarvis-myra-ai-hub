"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, User, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
  productName: string;
  accentHsl: string;
}

const ContactFormModal = ({ isOpen, onClose, onSubmit, productName, accentHsl }: ContactFormModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Valid email required";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) errs.phone = "Valid phone number required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: `linear-gradient(165deg, hsla(${accentHsl}, 0.08) 0%, hsla(0, 0%, 7%, 0.98) 40%, hsla(0, 0%, 5%, 1) 100%)`,
              border: `1px solid hsla(${accentHsl}, 0.2)`,
              boxShadow: `0 0 80px -20px hsla(${accentHsl}, 0.3), 0 30px 60px -20px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-30" style={{ background: `hsla(${accentHsl}, 0.5)` }} />

            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
              <X size={16} className="text-muted-foreground" />
            </button>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="text-center mb-6">
                <h3 className="font-display text-xl font-black text-foreground mb-1">Complete Your Purchase</h3>
                <p className="text-muted-foreground text-sm">{productName}</p>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <User size={12} /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/25 transition-colors"
                  style={{ borderColor: errors.name ? "hsl(0 84% 60%)" : undefined }}
                />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/25 transition-colors"
                  style={{ borderColor: errors.email ? "hsl(0 84% 60%)" : undefined }}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="mb-6">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/25 transition-colors"
                  style={{ borderColor: errors.phone ? "hsl(0 84% 60%)" : undefined }}
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-13 rounded-2xl font-display font-black text-sm tracking-wide"
                style={{
                  height: "3.25rem",
                  background: `linear-gradient(135deg, hsla(${accentHsl}, 1), hsla(${accentHsl}, 0.7))`,
                  color: "hsl(0, 0%, 4%)",
                  boxShadow: `0 0 30px hsla(${accentHsl}, 0.3)`,
                }}
              >
                Proceed to Payment
                <ArrowRight size={16} className="ml-2" />
              </Button>

              <p className="text-center text-[10px] text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <Shield size={10} /> Your info is secure & used only for order delivery
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContactFormModal;