import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SourceCodeCard from "@/components/SourceCodeCard";
import { ArrowLeft, Monitor, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jarvisFeatures, myraFeatures, auraFeatures, ariaFeatures } from "@/data/features";

const productConfig: Record<string, {
  name: string;
  tagline: string;
  price: number;
  features: string[];
  variant: "jarvis" | "myra" | "aura" | "aria";
  sourceVariant?: "jarvis" | "myra" | "aura";
  hasExe: boolean;
  hasSource: boolean;
  gradient: string;
}> = {
  jarvis: {
    name: "Jarvis 2.0",
    tagline: "AI System Assistant for power users",
    price: 899,
    features: jarvisFeatures,
    variant: "jarvis",
    sourceVariant: "jarvis",
    hasExe: false,
    hasSource: true,
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
  },
  myra: {
    name: "MYRA 2.0",
    tagline: "AI Personal Voice Assistant for daily life",
    price: 899,
    features: myraFeatures,
    variant: "myra",
    sourceVariant: "myra",
    hasExe: false,
    hasSource: true,
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
  },
  aura: {
    name: "AURA 1.0",
    tagline: "Your AI Girlfriend - Smart & Caring Companion",
    price: 899,
    features: auraFeatures,
    variant: "aura",
    sourceVariant: "aura",
    hasExe: false,
    hasSource: true,
    gradient: "from-pink-400 via-rose-500 to-red-500",
  },
  aria: {
    name: "ARIA 1.0",
    tagline: "AI Music Creator for smart audio workflows",
    price: 899,
    features: ariaFeatures,
    variant: "aria",
    hasExe: true,
    hasSource: false,
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
          {/* .exe File Section */}
          {config.hasExe && (
            <div className="mb-16">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass font-display text-sm tracking-wider mb-3" style={{ color: 'hsla(160, 70%, 50%, 0.9)' }}>
                  <Monitor size={16} /> READY TO USE
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  <span className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>.exe File</span> — Download & Run
                </h2>
                <p className="text-muted-foreground text-sm mt-2">No coding required. Just download, install, and start using.</p>
              </motion.div>
              <div className="max-w-lg mx-auto">
                <ProductCard
                  name={config.name}
                  tagline={config.tagline}
                  price={config.price}
                  features={config.features}
                  variant={config.variant}
                />
              </div>
            </div>
          )}

          {/* Source Code Section */}
          {config.hasSource && config.sourceVariant && (
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-yellow-400 font-display text-sm tracking-wider mb-3">
                  <FileCode size={16} /> FOR DEVELOPERS
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Source Code</span> — Build & Customize
                </h2>
                <p className="text-muted-foreground text-sm mt-2">Get the complete source code. Modify, extend, and make it your own.</p>
              </motion.div>
              <div className="max-w-lg mx-auto">
                <SourceCodeCard variant={config.sourceVariant} />
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductDetail;
