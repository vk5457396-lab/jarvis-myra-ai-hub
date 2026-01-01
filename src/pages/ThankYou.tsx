import { motion } from "framer-motion";
import { CheckCircle, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const product = searchParams.get("product") || "AI Assistant";
  const paymentId = searchParams.get("payment_id") || "";

  const telegramUsername = "codeninjavik1";
  const telegramMessage = encodeURIComponent(
    `✅ Payment Successful!\n\nProduct: ${product}\nPayment ID: ${paymentId}\n\nPlease provide my access.`
  );
  const telegramLink = `https://t.me/${telegramUsername}?text=${telegramMessage}`;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
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
              Your payment has been received successfully.
            </motion.p>

            {/* Payment ID */}
            {paymentId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card rounded-xl p-4 mb-8 inline-block"
              >
                <p className="text-sm text-muted-foreground">Payment ID</p>
                <p className="font-mono text-primary">{paymentId}</p>
              </motion.div>
            )}

            {/* Telegram CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card rounded-2xl p-8 mb-8"
            >
              <h2 className="font-display text-2xl font-bold mb-4 text-foreground">
                Get Your Access Now
              </h2>
              <p className="text-muted-foreground mb-6">
                Click the button below to send us your payment confirmation on Telegram 
                and receive your {product} access instantly.
              </p>
              <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                <Button variant="neonCyan" size="xl" className="gap-2">
                  <Send size={20} />
                  Send Confirmation on Telegram
                </Button>
              </a>
            </motion.div>

            {/* Back to Home */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
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
