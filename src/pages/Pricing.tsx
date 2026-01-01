import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { jarvisFeatures, myraFeatures } from "@/data/features";
import { Check, Shield, CreditCard, Zap } from "lucide-react";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-2 rounded-full glass text-secondary font-display text-sm tracking-wider mb-6">
              SIMPLE PRICING
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              One-Time Payment, <span className="gradient-text">Lifetime Access</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              No subscriptions. No hidden fees. Pay once and enjoy your AI assistant forever.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <ProductCard
              name="Jarvis"
              tagline="AI System Assistant for power users"
              price="₹799"
              features={jarvisFeatures}
              variant="jarvis"
              paymentLink="https://rzp.io/l/jarvis-ai"
              delay={0.1}
            />
            <ProductCard
              name="MYRA"
              tagline="AI Personal Voice Assistant for daily life"
              price="₹799"
              features={myraFeatures}
              variant="myra"
              paymentLink="https://rzp.io/l/myra-ai"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What's <span className="gradient-text">Included</span>
            </h2>
            <p className="text-muted-foreground">Everything you need to get started</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Check, title: "Lifetime License", desc: "One-time payment, forever access" },
              { icon: Zap, title: "Instant Download", desc: "Get started within minutes" },
              { icon: Shield, title: "Free Updates", desc: "All future updates included" },
              { icon: CreditCard, title: "Secure Payment", desc: "100% safe Razorpay checkout" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-neon flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-background" />
                </div>
                <h3 className="font-display text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Is this a one-time payment?",
                a: "Yes! You pay ₹799 once and get lifetime access to your chosen AI assistant with all future updates included.",
              },
              {
                q: "How do I download after payment?",
                a: "After successful payment, you'll receive a download link via email along with activation instructions.",
              },
              {
                q: "Can I use both Jarvis and MYRA?",
                a: "Yes! You can purchase both assistants separately and use them on your PC.",
              },
              {
                q: "What payment methods are accepted?",
                a: "We accept all major payment methods through Razorpay including UPI, Credit/Debit cards, Net Banking, and Wallets.",
              },
              {
                q: "Is there a refund policy?",
                a: "We offer a 7-day money-back guarantee if the product doesn't meet your expectations.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-6"
              >
                <h3 className="font-display text-lg text-primary mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
