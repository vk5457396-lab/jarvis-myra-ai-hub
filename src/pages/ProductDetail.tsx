import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import SourceCodeCard from "@/components/SourceCodeCard";
import { ArrowLeft, Monitor, FileCode, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ariaFeatures } from "@/data/features";
import thumbJarvis from "@/assets/thumb-jarvis.png";
import thumbMyra from "@/assets/thumb-myra.png";
import thumbAura from "@/assets/thumb-aura.png";
import thumbAria from "@/assets/thumb-aria.png";

type SourceVariant = "jarvis" | "myra" | "aura" | "aria";

const sourceList: { variant: SourceVariant; thumb: string; hsl: string }[] = [
  { variant: "jarvis", thumb: thumbJarvis, hsl: "188 100% 50%" },
  { variant: "myra", thumb: thumbMyra, hsl: "263 70% 58%" },
  { variant: "aura", thumb: thumbAura, hsl: "330 80% 60%" },
  { variant: "aria", thumb: thumbAria, hsl: "160 70% 50%" },
];

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  // Map legacy individual product ids to the source category
  const view = (() => {
    if (productId === "exe" || productId === "aria") return "exe";
    if (productId === "source" || productId === "jarvis" || productId === "myra" || productId === "aura") return "source";
    return null;
  })();

  if (!view) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Navbar />
        <p className="text-muted-foreground">Category not found</p>
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
            <ArrowLeft size={16} /> Back to Categories
          </Button>

          {view === "source" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-yellow-400 font-display text-sm tracking-wider mb-4">
                <FileCode size={16} /> SOURCE CODE
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">All AI Source Codes</span>
              </h1>
              <p className="text-lg text-muted-foreground">Pick any AI source code, or save more with bundles below.</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-12">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass font-display text-sm tracking-wider mb-4" style={{ color: 'hsla(160, 70%, 50%, 1)' }}>
                <Monitor size={16} /> READY TO USE .EXE
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 bg-clip-text text-transparent">Available .exe AIs</span>
              </h1>
              <p className="text-lg text-muted-foreground">No coding required. Download, install, and start using.</p>
            </motion.div>
          )}
        </div>
      </section>

      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          {view === "source" && (
            <>
              {/* Individual AI source code cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
                {sourceList.map((s) => (
                  <div key={s.variant} className="relative">
                    <div className="absolute -top-3 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border" style={{ background: `hsla(${s.hsl}, 0.15)`, borderColor: `hsla(${s.hsl}, 0.4)` }}>
                      <img src={s.thumb} alt={s.variant} loading="lazy" width={20} height={20} className="w-5 h-5 rounded" />
                      <span className="text-[10px] font-display font-bold tracking-wider uppercase" style={{ color: `hsla(${s.hsl}, 1)` }}>{s.variant}</span>
                    </div>
                    <SourceCodeCard variant={s.variant} />
                  </div>
                ))}
              </div>

              {/* Save More with Bundles */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-yellow-400 font-display text-sm tracking-wider mb-4">
                  <Code size={16} /> SOURCE CODE BUNDLES
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  Save More with <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Bundles</span>
                </h2>
                <p className="text-muted-foreground">Get multiple source codes at a discounted price</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <SourceCodeCard variant="bundle" />
                <SourceCodeCard variant="triple" />
              </div>
            </>
          )}

          {view === "exe" && (
            <div className="grid grid-cols-1 max-w-lg mx-auto">
              <div className="relative">
                <div className="absolute -top-3 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border" style={{ background: 'hsla(160, 70%, 50%, 0.15)', borderColor: 'hsla(160, 70%, 50%, 0.4)' }}>
                  <img src={thumbAria} alt="ARIA" loading="lazy" width={20} height={20} className="w-5 h-5 rounded" />
                  <span className="text-[10px] font-display font-bold tracking-wider uppercase" style={{ color: 'hsla(160, 70%, 50%, 1)' }}>ARIA 1.0</span>
                </div>
                <ProductCard
                  name="ARIA 1.0"
                  tagline="AI Music Creator for smart audio workflows"
                  price={899}
                  features={ariaFeatures}
                  variant="aria"
                />
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
