"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import ApiResourcesSection from "@/components/ApiResourcesSection";
import WebsiteServiceCard from "@/components/WebsiteServiceCard";

import MyraInstallSection from "@/components/MyraInstallSection";
import MyraAndroidDownload from "@/components/MyraAndroidDownload";
import { features, jarvisFeatures, myraFeatures } from "@/data/features";
import { ChevronRight, Shield, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Dynamic pricing and naming based on date
const isAfterFeb1 = new Date() >= new Date('2026-02-01');
const myraName = isAfterFeb1 ? "MYRA 2.0" : "MYRA";
const jarvisPrice = 899; // Jarvis is always ₹899
const myraPrice = isAfterFeb1 ? 899 : 799; // MYRA increases on Feb 1st

const IndexPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* MYRA Desktop Install - Featured at top */}
      <MyraInstallSection />

      {/* MYRA Android APK download */}
      <MyraAndroidDownload className="py-16 md:py-24" />

      {/* Features Overview */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full glass text-primary font-display text-sm tracking-wider mb-4">
              POWERFUL FEATURES
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="gradient-text">Complete Control</span> at Your Voice
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the future of PC automation with advanced AI voice recognition and intelligent command processing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.slice(0, 8).map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                variant={feature.variant}
                delay={index * 0.1}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/features">
              <Button variant="outline" size="lg" className="group">
                <span>View All Features</span>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full glass text-secondary font-display text-sm tracking-wider mb-4">
              CHOOSE YOUR ASSISTANT
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Meet <span className="text-primary text-glow-cyan">Jarvis</span> & <span className="text-secondary text-glow-purple">{myraName}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Two desktop assistants for your PC. Pick the one that fits how you work.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ProductCard
              name="Jarvis"
              tagline="AI System Assistant for power users"
              price={jarvisPrice}
              features={jarvisFeatures}
              variant="jarvis"
              delay={0.1}
            />
            <ProductCard
              name={myraName}
              tagline="AI Personal Voice Assistant for daily life"
              price={myraPrice}
              features={myraFeatures}
              variant="myra"
              delay={0.2}
            />
          </div>

          <div className="text-center mt-12">
            <Link href="/demos">
              <Button variant="outline" size="lg" className="group">
                <span>Watch Setup Tutorials</span>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure Payments",
                description: "100% secure payment processing through Razorpay with bank-grade encryption.",
              },
              {
                icon: Zap,
                title: "Instant Activation",
                description: "Get started immediately after purchase. No waiting, no complex setup required.",
              },
              {
                icon: Clock,
                title: "24/7 Support",
                description: "Our dedicated support team is always ready to help you with any questions.",
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
        </div>
      </section>

      {/* API Resources Section */}
      <ApiResourcesSection />


      {/* Website Service Promotion */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <WebsiteServiceCard />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative glass-card rounded-3xl p-8 md:p-16 text-center overflow-hidden"
          >
            {/* Glow Effects */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Ready to <span className="gradient-text">Transform</span> Your PC Experience?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Join thousands of users who have already upgraded to AI-powered voice control.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing">
                  <Button variant="hero" size="xl">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/features">
                  <Button variant="glass" size="xl">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndexPage;
