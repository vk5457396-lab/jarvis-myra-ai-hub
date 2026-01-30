import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onLoadingComplete, 400);
          }, 200);
          return 100;
        }
        // Faster progress - complete in ~2 seconds
        return prev + Math.random() * 25 + 10;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
          style={{
            background: "radial-gradient(ellipse at 50% 50%, hsl(240 20% 8%) 0%, hsl(240 20% 2%) 100%)"
          }}
        >
          {/* Circuit pattern overlay */}
          <div className="absolute inset-0 circuit-pattern opacity-30" />
          
          {/* Animated glow rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-64 h-64 rounded-full border border-primary/30"
              style={{ boxShadow: "0 0 60px hsl(185 100% 50% / 0.2)" }}
            />
            <motion.div
              animate={{
                scale: [1.2, 1.8, 1.2],
                opacity: [0.2, 0.05, 0.2],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              className="absolute w-80 h-80 rounded-full border border-secondary/20"
              style={{ boxShadow: "0 0 80px hsl(265 100% 65% / 0.15)" }}
            />
          </div>

          {/* Logo container */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 mb-4"
          >
            {/* Logo glow effect */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 30px hsl(185 100% 50% / 0.4), 0 0 60px hsl(265 100% 65% / 0.2)",
                  "0 0 50px hsl(185 100% 50% / 0.6), 0 0 80px hsl(265 100% 65% / 0.3)",
                  "0 0 30px hsl(185 100% 50% / 0.4), 0 0 60px hsl(265 100% 65% / 0.2)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="rounded-full p-1"
            >
              <div className="glass-card rounded-full p-6">
                <motion.img
                  src={logo}
                  alt="Logo"
                  className="w-20 h-20 md:w-28 md:h-28 object-contain"
                  animate={{
                    filter: [
                      "drop-shadow(0 0 10px hsl(185 100% 50% / 0.5))",
                      "drop-shadow(0 0 20px hsl(185 100% 50% / 0.8))",
                      "drop-shadow(0 0 10px hsl(185 100% 50% / 0.5))",
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

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="z-10 mb-6 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold gradient-text text-glow-cyan tracking-wider">
              CODENINJAVIK
            </h1>
            <p className="text-muted-foreground text-sm mt-1">AI Solutions Hub</p>
          </motion.div>

          {/* Loading text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="z-10 text-center mb-4"
          >
            <div className="flex items-center gap-1 justify-center">
              <span className="text-muted-foreground text-sm">Initializing</span>
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-primary"
              >
                ...
              </motion.span>
            </div>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "240px" }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="z-10"
          >
            <Progress 
              value={Math.min(progress, 100)} 
              className="h-1.5 bg-muted/50"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-primary text-xs mt-2 font-mono"
            >
              {Math.min(Math.round(progress), 100)}%
            </motion.p>
          </motion.div>

          {/* Floating particles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full"
              initial={{
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
                opacity: 0,
              }}
              animate={{
                y: [0, -80, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
              style={{
                left: `${25 + i * 15}%`,
                top: `${45 + Math.random() * 15}%`,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
