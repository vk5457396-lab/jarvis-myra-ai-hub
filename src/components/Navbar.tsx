import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Features", path: "/features" },
  { name: "Demos", path: "/demos" },
  { name: "Pricing", path: "/pricing" },
  { name: "Services", path: "/services" },
  { name: "Contact", path: "/contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.img src={logo} alt="AI Assistant Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-primary/50 group-hover:border-primary transition-all duration-300" whileHover={{ scale: 1.1, rotate: 5 }} />
            <span className="font-display text-xl md:text-2xl gradient-text font-bold hidden sm:block">codeninjavik</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`font-display text-sm tracking-wider transition-all duration-300 relative group ${location.pathname === link.path ? "text-primary text-glow-cyan" : "text-foreground/70 hover:text-primary"}`}>
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-neon transition-all duration-300 ${location.pathname === link.path ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline" className="rounded-xl border-primary/30 gap-2 font-display">
                  <User size={16} /> Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="glass" className="rounded-xl gap-2 font-display">
                  <LogIn size={16} /> Login
                </Button>
              </Link>
            )}
            <Link to="/pricing">
              <Button variant="hero" size="default">Buy Now</Button>
            </Link>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Close menu" : "Open menu"} aria-expanded={isOpen} className="md:hidden p-2 text-foreground hover:text-primary transition-colors">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="md:hidden glass border-t border-white/10">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link, index) => (
                <motion.div key={link.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                  <Link to={link.path} onClick={() => setIsOpen(false)} className={`block font-display text-lg py-2 ${location.pathname === link.path ? "text-primary text-glow-cyan" : "text-foreground/70"}`}>
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                {user ? (
                  <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl gap-2 font-display border-primary/30">
                      <User size={16} /> Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="glass" className="w-full rounded-xl gap-2 font-display">
                      <LogIn size={16} /> Login
                    </Button>
                  </Link>
                )}
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <Link to="/pricing" onClick={() => setIsOpen(false)}>
                  <Button variant="hero" size="lg" className="w-full">Buy Now</Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
