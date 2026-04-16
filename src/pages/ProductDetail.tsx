import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SourceCodeCard from "@/components/SourceCodeCard";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jarvisFeatures, myraFeatures, auraFeatures, ariaFeatures } from "@/data/features";

const productConfig: Record<string, { name: string; tagline: string; price: number; features: string[]; variant: "jarvis" | "myra" | "aura" | "aria"; sourceVariant: "jarvis" | "myra" | "aura"; hasExe: boolean; gradient: string; }> = {
  jarvis: {
    name: "Jarvis 2.0",
    tagline: "AI System Assistant for power users",
    price: 899,
    features: jarvisFeatures,
    variant: "jarvis",
    sourceVariant: "jarvis",
    hasExe: false,
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
  },
  myra: {
    name: "MYRA 2.0",
    tagline: "AI Personal Voice Assistant for daily life",
    price: 899,
    features: myraFeatures,
    variant: "myra",
    sourceVariant: "myra",
    hasExe: true,
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
  },
  aura: {
    name: "AURA 1.0",
    tagline: "Your AI Girlfriend - Smart & Caring Companion",
    price: 899,
    features: auraFeatures,
    variant: "aura",
    sourceVariant: "aura",
    hasExe: true,
    gradient: "from-pink-400 via-rose-500 to-red-500",
  },
  aria: {
    name: "ARIA 1.0",
    tagline: "AI Music Creator for smart audio workflows",
    price: 899,
    features: ariaFeatures,
    variant: "aria",
    sourceVariant: "jarvis", // placeholder, ARIA doesn't have separate source
    hasExe: true,
    gradient: "from-emerald-400 via-teal-500 to-cyan-600",
  },
};

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const config = productId ? productConfig[productId] : null;

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const showExeCard = config.variant === "aria";
  const showSourceCode = config.variant !== "aria";

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-8 md:pt-36 md:pb-12 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="mb-6 text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft size={16} /> Back to Pricing
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h1 className={`font-display text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              {config.name}
            </h1>
            <p className="text-lg text-muted-foreground">{config.tagline}</p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          {showExeCard && (
            <div className="max-w-lg mx-auto mb-12">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <ProductCard
                  name={config.name}
                  tagline={config.tagline}
                  price={config.price}
                  features={config.features}
                  variant={config.variant}
                />
              </motion.div>
            </div>
          )}

          {showSourceCode && (
            <div className="max-w-lg mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <SourceCodeCard variant={config.sourceVariant} />
              </motion.div>
            </div>
          )}

          {!showExeCard && !showSourceCode && (
            <p className="text-center text-muted-foreground">Coming soon...</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductDetail;
