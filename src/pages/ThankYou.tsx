import { motion } from "framer-motion";
import { CheckCircle, Send, ArrowLeft, MessageCircle, Phone, Mail, Shield, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { toast } from "sonner";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const product = searchParams.get("product") || "AI Assistant";
  const paymentId = searchParams.get("payment_id") || "";
  const amount = searchParams.get("amount") || "";
  const phone = searchParams.get("phone") || "";
  
  const [copied, setCopied] = useState(false);

  const telegramUsername = "codeninjavik1";
  
  // Create verification message for Telegram
  const verificationMessage = encodeURIComponent(
    `🔐 Payment Verification Request\n\n` +
    `📦 Product: ${product}\n` +
    `🆔 Payment ID: ${paymentId}\n` +
    `💰 Amount: ₹${amount}\n` +
    `📱 Phone: ${phone || 'N/A'}\n\n` +
    `Please verify my payment and activate my product.`
  );
  
  const telegramLink = `https://t.me/${telegramUsername}?text=${verificationMessage}`;

  const copyPaymentId = () => {
    navigator.clipboard.writeText(paymentId);
    setCopied(true);
    toast.success("Payment ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <main className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border border-green-500/30">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground"
            >
              Payment{" "}
              <span className="text-glow-cyan text-primary">Successful!</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-lg mb-8"
            >
              Thank you for purchasing <span className="text-primary font-semibold">{product}</span>. 
              Your payment has been received and admin has been notified.
            </motion.p>

            {/* Payment Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card rounded-xl p-6 mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500 font-medium">Payment Verified</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="glass rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Payment ID</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-primary text-sm truncate flex-1">{paymentId}</p>
                    <button 
                      onClick={copyPaymentId}
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="glass rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Product</p>
                  <p className="font-display text-foreground text-sm">{product}</p>
                </div>
                
                {amount && (
                  <div className="glass rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Amount Paid</p>
                    <p className="font-display text-primary text-sm">₹{amount}</p>
                  </div>
                )}
                
                {phone && (
                  <div className="glass rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Contact</p>
                    <p className="font-mono text-foreground text-sm">{phone}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Telegram CTA - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card rounded-2xl p-8 mb-8 border border-primary/20"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Get Your Access Now
                </h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Click the button below to send your payment details to admin on Telegram 
                and receive your <span className="text-primary font-semibold">{product}</span> access instantly.
              </p>
              
              <div className="space-y-4">
                <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="neonCyan" size="xl" className="w-full gap-2 group">
                    <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                    Send Payment Details to Admin
                  </Button>
                </a>
                
                <div className="flex items-center gap-4 justify-center text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Quick Response
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> 24/7 Support
                  </span>
                </div>
              </div>
            </motion.div>

            {/* What happens next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card rounded-xl p-6 mb-8"
            >
              <h3 className="font-display text-lg font-bold mb-4 text-foreground">What happens next?</h3>
              <div className="space-y-3 text-left">
                {[
                  "Admin has been automatically notified of your payment",
                  "Click the Telegram button to verify and get your access",
                  "You'll receive the download link and setup instructions",
                  "Follow the setup guide to install your AI assistant",
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Back to Home */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Link to="/">
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={16} />
                  Back to Home
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;
