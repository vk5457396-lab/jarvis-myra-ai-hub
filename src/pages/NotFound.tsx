import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 circuit-pattern opacity-20" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center px-4"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-full glass mb-8"
        >
          <AlertTriangle className="w-12 h-12 text-secondary" />
        </motion.div>

        <h1 className="font-display text-7xl md:text-9xl font-bold gradient-text mb-4">
          404
        </h1>
        <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
          Page Not Found
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved to another dimension.
        </p>
        <Link to="/">
          <Button variant="hero" size="xl" className="group">
            <Home className="w-5 h-5" />
            <span>Return Home</span>
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
