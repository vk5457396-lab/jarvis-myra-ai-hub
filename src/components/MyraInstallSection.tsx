import { motion } from "framer-motion";
import { useState } from "react";
import { Copy, Check, Terminal, Download, RefreshCw, Play, Package, Key, Zap, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import ContactFormModal from "@/components/ContactFormModal";


const commands = [
  {
    id: "install",
    label: "Install MYRA",
    description: "First time? Run this command in Command Prompt or PowerShell to install MYRA on your PC.",
    command: "pip install myra-ai-assistant",
    icon: Download,
    accent: "from-neon-cyan to-neon-cyan/70",
    glow: "shadow-neon-cyan",
    border: "border-neon-cyan/40",
  },
  {
    id: "update",
    label: "Update MYRA",
    description: "Already installed? Upgrade to the latest version with newest features and fixes.",
    command: "python -m pip install --upgrade myra-ai-assistant",
    icon: RefreshCw,
    accent: "from-neon-purple to-neon-purple/70",
    glow: "shadow-neon-purple",
    border: "border-neon-purple/40",
  },
  {
    id: "run",
    label: "Run MYRA",
    description: "After install, just type 'myra' in CMD and your AI assistant comes alive.",
    command: "myra",
    icon: Play,
    accent: "from-pink-500 to-rose-500",
    glow: "shadow-[0_0_20px_rgba(236,72,153,0.4)]",
    border: "border-pink-400/40",
  },
];

const CommandBlock = ({ cmd, index }: { cmd: typeof commands[0]; index: number }) => {
  const [copied, setCopied] = useState(false);
  const Icon = cmd.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cmd.command);
    setCopied(true);
    toast.success(`${cmd.label} command copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`glass-card rounded-2xl p-6 border ${cmd.border} hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden`}
    >
      {/* Step Number */}
      <div className="absolute top-4 right-4 text-6xl font-display font-bold text-white/5 group-hover:text-white/10 transition-colors">
        0{index + 1}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${cmd.accent} ${cmd.glow}`}>
          <Icon className="w-5 h-5 text-background" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">{cmd.label}</h3>
          <p className="text-xs text-muted-foreground">Step {index + 1}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4 relative z-10">{cmd.description}</p>

      {/* Terminal Block */}
      <div className="relative bg-black/60 rounded-lg border border-white/10 overflow-hidden group/term">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <Terminal className="w-3 h-3" />
            <span>cmd.exe</span>
          </div>
        </div>

        {/* Command */}
        <div className="flex items-center gap-2 p-4 font-mono text-sm">
          <span className="text-neon-cyan select-none">{">"}</span>
          <code className="text-foreground flex-1 break-all">{cmd.command}</code>
          <button
            onClick={handleCopy}
            className="flex-shrink-0 p-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Copy command"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const MyraInstallSection = () => {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", phone: "" });

  const handleContactSubmit = (data: { name: string; email: string; phone: string }) => {
    setCustomerInfo(data);
    setShowContactForm(false);
    setShowPaymentSelector(true);
  };

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-secondary/30 text-secondary font-display text-sm tracking-wider mb-4">
            <Package className="w-4 h-4" />
            DESKTOP INSTALLATION
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Install <span className="text-secondary text-glow-purple">MYRA</span> on Your PC
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Three simple steps. Copy, paste, and run — your personal AI assistant will be ready in under a minute.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {commands.map((cmd, i) => (
            <CommandBlock key={cmd.id} cmd={cmd} index={i} />
          ))}

          {/* Activation Key Purchase Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="glass-card rounded-2xl p-6 border border-amber-400/40 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
          >
            {/* Step Number */}
            <div className="absolute top-4 right-4 text-6xl font-display font-bold text-white/5 group-hover:text-white/10 transition-colors">
              04
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                <Key className="w-5 h-5 text-background" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Activate MYRA</h3>
                <p className="text-xs text-muted-foreground">Buy License Key</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 relative z-10">
              After install, unlock full features with a lifetime activation key. One-time purchase, forever access.
            </p>

            {/* Price Block */}
            <div className="relative bg-black/60 rounded-lg border border-white/10 overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>LIFETIME LICENSE</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <span className="font-display text-4xl font-black bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  ₹799
                </span>
                <p className="text-xs text-muted-foreground mt-1">One-time • No subscription</p>
              </div>
            </div>

            <Button
              variant="neonCyan"
              size="lg"
              className="w-full group/btn font-bold text-sm tracking-wide relative overflow-hidden rounded-xl"
              onClick={() => setShowContactForm(true)}
            >
              <motion.div
                className="absolute inset-0 opacity-0 group-hover/btn:opacity-100"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", width: "40%" }}
              />
              <Zap size={14} className="mr-2 relative z-10" />
              <span className="relative z-10">Buy Activation Key</span>
              <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform relative z-10" />
            </Button>
          </motion.div>
        </div>

        {/* Requirements note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-3 rounded-full glass border border-white/10 text-xs md:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Windows 10 / 11
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon-cyan" />
              Python 3.8+
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neon-purple" />
              Internet connection
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MyraInstallSection;
