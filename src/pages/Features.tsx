import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import MyraFeaturesShowcase from "@/components/MyraFeaturesShowcase";
import { features } from "@/data/features";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

// Dynamic MYRA name based on date
const isMyra2 = new Date() >= new Date('2025-02-01');
const myraName = isMyra2 ? "MYRA 2.0" : "MYRA";

const Features = () => {
  return (
    <div className="min-h-screen">
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
            <span className="inline-block px-4 py-2 rounded-full glass text-primary font-display text-sm tracking-wider mb-6">
              ALL FEATURES
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Powerful <span className="gradient-text">AI Features</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Discover all the incredible capabilities that make Jarvis and MYRA the most advanced AI voice assistants for your PC.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                variant={feature.variant}
                delay={index * 0.05}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="text-primary">Jarvis</span> vs <span className="text-secondary">{myraName}</span>
            </h2>
            <p className="text-muted-foreground">Choose the perfect assistant for your needs</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Jarvis */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 border border-primary/30"
            >
              <h3 className="font-display text-2xl text-primary text-glow-cyan mb-4">
                Jarvis
              </h3>
              <p className="text-muted-foreground mb-6">
                Designed for power users who need complete system control and automation.
              </p>
              <ul className="space-y-3">
                {[
                  "Advanced System Automation",
                  "Full Windows Control",
                  "Developer-Friendly Commands",
                  "Performance Monitoring",
                  "Multi-App Management",
                  "Custom Script Execution",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground/80">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* {myraName} */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-8 border border-secondary/30"
            >
              <h3 className="font-display text-2xl text-secondary text-glow-purple mb-4">
                {myraName}
              </h3>
              <p className="text-muted-foreground mb-6">
                Perfect for everyday users who want a personal AI companion.
              </p>
              <ul className="space-y-3">
                {[
                  "Human-like Conversations",
                  "Daily Life Automation",
                  "Entertainment Control",
                  "Smart Reminders",
                  "News & Information",
                  "Personalized Responses",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-foreground/80">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/pricing">
              <Button variant="hero" size="xl" className="group">
                <span>Get Your Assistant Now</span>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* MYRA Features Showcase */}
      <MyraFeaturesShowcase />

      <Footer />
    </div>
  );
};

export default Features;
