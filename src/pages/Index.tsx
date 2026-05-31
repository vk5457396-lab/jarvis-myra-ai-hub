import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureCard from "@/components/FeatureCard";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import VideoThumbnail from "@/components/VideoThumbnail";
import ApiResourcesSection from "@/components/ApiResourcesSection";
import WebsiteServiceCard from "@/components/WebsiteServiceCard";
import MobileAppComingSoon from "@/components/MobileAppComingSoon";
import MyraInstallSection from "@/components/MyraInstallSection";
import { features, jarvisFeatures, myraFeatures } from "@/data/features";
import { ChevronRight, Shield, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Dynamic pricing and naming based on date
const isAfterFeb1 = new Date() >= new Date('2026-02-01');
const myraName = isAfterFeb1 ? "MYRA 2.0" : "MYRA";
const jarvisPrice = 899; // Jarvis is always ₹899
const myraPrice = isAfterFeb1 ? 899 : 799; // MYRA increases on Feb 1st

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* MYRA Desktop Install - Featured at top */}
      <MyraInstallSection />

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
            <Link to="/features">
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
              Two powerful AI assistants designed for different needs. Choose the one that fits your lifestyle.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
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

          {/* Setup Videos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl md:text-3xl font-bold mb-2">
                <span className="gradient-text">Watch Setup Guides</span>
              </h3>
              <p className="text-muted-foreground">
                Click to watch step-by-step tutorials
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Jarvis Setup Video */}
              <div>
                <h4 className="font-display text-xl font-bold mb-4 text-center">
                  <span className="text-primary text-glow-cyan">Jarvis</span> Setup Guide
                </h4>
                <VideoThumbnail
                  videoId="cDaGBD_5AvA"
                  title="Jarvis AI Voice Assistant Setup Guide"
                  variant="jarvis"
                />
              </div>

              {/* MYRA Setup Video */}
              <div>
                <h4 className="font-display text-xl font-bold mb-4 text-center">
                  <span className="text-secondary text-glow-purple">{myraName}</span> Setup Guide
                </h4>
                <VideoThumbnail
                  videoId="xw1IQJGzWI8"
                  title={`${myraName} AI Voice Assistant Setup Guide`}
                  variant="myra"
                />
              </div>
            </div>

            <div className="text-center mt-8">
              <Link to="/demos">
                <Button variant="outline" size="lg" className="group">
                  <span>View All Tutorials</span>
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </motion.div>
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

      {/* Mobile App Coming Soon */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <MobileAppComingSoon />
        </div>
      </section>

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
                <Link to="/pricing">
                  <Button variant="hero" size="xl">
                    Get Started Now
                  </Button>
                </Link>
                <Link to="/features">
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

export default Index;
