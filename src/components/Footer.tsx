import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Github, Twitter, Heart } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="relative border-t border-white/10 bg-background/50 backdrop-blur-lg">
      {/* Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-neon opacity-50" />

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt="Logo"
                className="w-10 h-10 rounded-full border border-primary/50"
              />
              <span className="font-display text-xl gradient-text font-bold">
                codeninjavik
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Future-ready AI voice assistants for complete system automation and daily life management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm text-primary mb-4 tracking-wider">
              QUICK LINKS
            </h4>
            <ul className="space-y-2">
              {["Home", "Features", "Pricing", "Services", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-display text-sm text-primary mb-4 tracking-wider">
              PRODUCTS
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/pricing"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Jarvis - AI System Assistant
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  MYRA - AI Personal Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm text-primary mb-4 tracking-wider">
              CONNECT
            </h4>
            <div className="flex gap-4">
              <motion.a
                href="mailto:support@aiassistants.com"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail size={18} />
              </motion.a>
              <motion.a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle size={18} />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-secondary transition-colors"
              >
                <Twitter size={18} />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg glass flex items-center justify-center text-muted-foreground hover:text-secondary transition-colors"
              >
                <Github size={18} />
              </motion.a>
            </div>
          </div>
        </div>

        {/* Policy Links */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Terms & Conditions
            </Link>
            <Link to="/shipping-policy" className="text-muted-foreground hover:text-primary transition-colors text-sm">
              Shipping & Delivery
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 codeninjavik. All rights reserved.
          </p>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            Made with <Heart size={14} className="text-destructive animate-pulse" /> for the future
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
