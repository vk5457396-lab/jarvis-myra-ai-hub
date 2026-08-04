"use client";

import { motion } from "framer-motion";
import { Send, Globe, Code2, Rocket, Sparkles, Smartphone, Palette, ShieldCheck, Clock, MessageCircle, Headphones, Layers, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const telegramLink = "https://t.me/codeninjavik1?text=" + encodeURIComponent(
  "🌐 Service Inquiry\n\nHi, I'm interested in your development services. Please share more details about pricing and timeline."
);

const websiteFeatures = [
  { icon: Globe, text: "Custom Responsive Design" },
  { icon: Code2, text: "Modern Tech Stack (React, Next.js, etc.)" },
  { icon: Rocket, text: "Fast Delivery (7-14 Days)" },
  { icon: Sparkles, text: "SEO Optimized" },
  { icon: ShieldCheck, text: "Secure & Scalable" },
  { icon: Palette, text: "Custom UI/UX Design" },
  { icon: Layers, text: "Admin Dashboard Included" },
  { icon: Headphones, text: "Post-Launch Support" },
];

const mobileFeatures = [
  { icon: Smartphone, text: "Android & iOS Apps" },
  { icon: Code2, text: "React Native / Flutter" },
  { icon: Zap, text: "Fast Performance" },
  { icon: Sparkles, text: "Modern UI Design" },
  { icon: ShieldCheck, text: "Secure Authentication" },
  { icon: Layers, text: "API Integration" },
  { icon: Clock, text: "Timely Delivery" },
  { icon: Headphones, text: "Maintenance & Updates" },
];

const websiteTypes = [
  "Portfolio / Personal Website",
  "Business / Corporate Website",
  "E-Commerce Store",
  "Landing Pages",
  "SaaS Dashboard",
  "Blog / News Website",
  "Educational Platform",
  "Custom Web Application",
];

const mobileAppTypes = [
  "AI Chatbot / Voice Assistant App",
  "E-Commerce Mobile App",
  "Social Media App",
  "Fitness / Health App",
  "Food Delivery App",
  "Education / Learning App",
  "Business Management App",
  "Custom Mobile Application",
];

const Services = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full glass text-secondary font-display text-sm tracking-wider mb-4">
              OUR SERVICES
            </span>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
              Professional <span className="gradient-text">Development</span> Services
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Need a stunning website or mobile app? We build high-quality, modern digital products for your business or personal brand.
            </p>
          </motion.div>

          {/* Website Development */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 md:p-12 mb-12 border border-primary/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-primary/30 mb-6">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-xs font-display text-primary tracking-wider">WEBSITE DEVELOPMENT</span>
              </div>

              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                Get a <span className="text-primary text-glow-cyan">Professional Website</span> Built
              </h2>
              <p className="text-muted-foreground mb-8 max-w-3xl text-lg">
                We create stunning, fast, and fully responsive websites using the latest technologies. 
                Whether it's a portfolio, business site, or a full e-commerce store — we deliver pixel-perfect results.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {websiteFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 text-sm glass rounded-lg px-3 py-2"
                  >
                    <feature.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Website Types */}
              <h3 className="font-display text-lg font-bold mb-4 text-primary">What We Build:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {websiteTypes.map((type, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{type}</span>
                  </motion.div>
                ))}
              </div>

              <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                <Button variant="neonCyan" size="xl" className="gap-2 group">
                  <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  DM on Telegram for Website Quote
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Mobile App Development */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 md:p-12 mb-12 border border-secondary/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-secondary/30 mb-6">
                <Smartphone className="w-4 h-4 text-secondary" />
                <span className="text-xs font-display text-secondary tracking-wider">MOBILE APP DEVELOPMENT</span>
              </div>

              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                Get a <span className="text-secondary text-glow-purple">Mobile App</span> Developed
              </h2>
              <p className="text-muted-foreground mb-8 max-w-3xl text-lg">
                We build modern, high-performance mobile applications for Android and iOS. 
                From AI chatbots to e-commerce — your app idea, brought to life with cutting-edge technology.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {mobileFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 text-sm glass rounded-lg px-3 py-2"
                  >
                    <feature.icon className="w-4 h-4 text-secondary shrink-0" />
                    <span className="text-foreground">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* App Types */}
              <h3 className="font-display text-lg font-bold mb-4 text-secondary">What We Build:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {mobileAppTypes.map((type, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                    <span className="text-muted-foreground">{type}</span>
                  </motion.div>
                ))}
              </div>

              <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                <Button variant="neonPurple" size="xl" className="gap-2 group">
                  <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  DM on Telegram for App Quote
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Why Choose Us */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
              Why Choose <span className="gradient-text">CodeNinjaVik</span>?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Zap,
                title: "Fast Delivery",
                description: "We deliver projects on time, every time. Most websites are ready in 7-14 days.",
              },
              {
                icon: ShieldCheck,
                title: "Quality Guaranteed",
                description: "Clean code, modern design, and fully responsive — no compromises on quality.",
              },
              {
                icon: MessageCircle,
                title: "Direct Communication",
                description: "Talk directly with the developer. No middlemen, no delays. DM on Telegram anytime.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center glass-card rounded-xl p-8"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-neon flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-background" />
                </div>
                <h3 className="font-display text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-8 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to <span className="gradient-text">Start Your Project</span>?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                DM us on Telegram with your project idea and get a free quote within 24 hours!
              </p>
              <a href={telegramLink} target="_blank" rel="noopener noreferrer">
                <Button variant="hero" size="xl" className="gap-2 group">
                  <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  Contact on Telegram
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;