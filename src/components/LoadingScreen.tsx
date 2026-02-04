import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loadingText, setLoadingText] = useState("Initializing");

  const loadingStages = [
    "Initializing",
    "Loading Assets",
    "Connecting AI",
    "Almost Ready",
    "Welcome"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onLoadingComplete, 500);
          }, 300);
          return 100;
        }
        return prev + Math.random() * 20 + 8;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  useEffect(() => {
    const stageIndex = Math.min(
      Math.floor(progress / 25),
      loadingStages.length - 1
    );
    setLoadingText(loadingStages[stageIndex]);
  }, [progress]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, hsl(240 25% 12%) 0%, hsl(240 20% 4%) 70%, hsl(240 20% 2%) 100%)"
          }}
        >
          {/* Animated Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(hsl(185 100% 50% / 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, hsl(185 100% 50% / 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          {/* Animated Gradient Orbs */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(185 100% 50% / 0.3) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(265 100% 65% / 0.3) 0%, transparent 70%)" }}
          />

          {/* Rotating Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              border: "1px dashed hsl(185 100% 50% / 0.2)",
            }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              border: "1px dashed hsl(265 100% 65% / 0.2)",
            }}
          />

          {/* Pulsing Rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 2.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeOut",
              }}
              className="absolute w-32 h-32 rounded-full border-2"
              style={{
                borderColor: i % 2 === 0 ? "hsl(185 100% 50% / 0.4)" : "hsl(265 100% 65% / 0.4)",
              }}
            />
          ))}

          {/* Logo Container with Glow */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", type: "spring", stiffness: 100 }}
            className="relative z-10 mb-8"
          >
            {/* Outer Glow Ring */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 40px hsl(185 100% 50% / 0.4), 0 0 80px hsl(265 100% 65% / 0.2), inset 0 0 30px hsl(185 100% 50% / 0.1)",
                  "0 0 60px hsl(185 100% 50% / 0.6), 0 0 120px hsl(265 100% 65% / 0.4), inset 0 0 50px hsl(185 100% 50% / 0.2)",
                  "0 0 40px hsl(185 100% 50% / 0.4), 0 0 80px hsl(265 100% 65% / 0.2), inset 0 0 30px hsl(185 100% 50% / 0.1)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-full p-1"
            >
              {/* Glass Container */}
              <div 
                className="relative rounded-full p-8"
                style={{
                  background: "linear-gradient(135deg, hsl(240 20% 15% / 0.8) 0%, hsl(240 20% 8% / 0.9) 100%)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid hsl(185 100% 50% / 0.3)",
                }}
              >
                {/* Inner Rotating Border */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "conic-gradient(from 0deg, transparent, hsl(185 100% 50% / 0.5), transparent, hsl(265 100% 65% / 0.5), transparent)",
                    padding: "2px",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "xor",
                    WebkitMaskComposite: "xor",
                  }}
                />
                
                {/* Logo */}
                <motion.img
                  src={logo}
                  alt="Logo"
                  className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10"
                  animate={{
                    filter: [
                      "drop-shadow(0 0 15px hsl(185 100% 50% / 0.6))",
                      "drop-shadow(0 0 30px hsl(185 100% 50% / 0.9))",
                      "drop-shadow(0 0 15px hsl(185 100% 50% / 0.6))",
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* Brand Name with Gradient */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="z-10 mb-2 text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-bold tracking-widest"
              style={{
                background: "linear-gradient(135deg, hsl(185 100% 60%) 0%, hsl(185 100% 50%) 25%, hsl(265 100% 70%) 75%, hsl(265 100% 60%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 0 40px hsl(185 100% 50% / 0.5)",
              }}
            >
              CODENINJAVIK
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-muted-foreground text-sm md:text-base mb-10 tracking-wider z-10"
          >
            AI Solutions Hub
          </motion.p>

          {/* Loading Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="z-10 text-center mb-4"
          >
            <motion.div 
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 justify-center"
            >
              <span className="text-primary text-sm font-medium tracking-wide">{loadingText}</span>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-primary"
              >
                •••
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "280px" }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="z-10 relative"
          >
            {/* Background Track */}
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{
                background: "hsl(240 20% 15%)",
                border: "1px solid hsl(185 100% 50% / 0.2)",
              }}
            >
              {/* Progress Fill */}
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background: "linear-gradient(90deg, hsl(185 100% 50%) 0%, hsl(265 100% 65%) 100%)",
                  boxShadow: "0 0 20px hsl(185 100% 50% / 0.5)",
                }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.4), transparent)",
                  }}
                />
              </motion.div>
            </div>
            
            {/* Percentage */}
            <motion.p
              className="text-center text-primary text-sm mt-3 font-mono font-semibold"
            >
              {Math.min(Math.round(progress), 100)}%
            </motion.p>
          </motion.div>

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + Math.random() * 4,
                height: 4 + Math.random() * 4,
                background: i % 2 === 0 ? "hsl(185 100% 50%)" : "hsl(265 100% 65%)",
                left: `${10 + Math.random() * 80}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [0, -100 - Math.random() * 100],
                x: [0, (Math.random() - 0.5) * 50],
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-secondary/20 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-secondary/20 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/20 rounded-br-3xl" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
