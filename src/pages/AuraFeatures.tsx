import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Heart, ChevronRight, Flame, Angry, Briefcase, 
  MessageCircle, Brain, Music, Mic, Shield, Sparkles,
  Volume2, SmilePlus, Coffee, BookOpen, Gamepad2, Clock
} from "lucide-react";

const auraName = "AURA 1.0";

const modes = [
  {
    name: "Girlfriend Mode",
    icon: Heart,
    color: "from-pink-500 to-rose-400",
    borderColor: "border-pink-500/40",
    glowColor: "bg-pink-500",
    description: "Sweet, caring, and loving conversations. She remembers your mood, asks about your day, and makes you feel special. Just like a real girlfriend who truly cares about you.",
    features: [
      "Emotional support & care",
      "Remembers your preferences",
      "Good morning/night messages feel",
      "Loving & affectionate tone",
    ],
  },
  {
    name: "Roast Mode",
    icon: Flame,
    color: "from-orange-500 to-red-500",
    borderColor: "border-orange-500/40",
    glowColor: "bg-orange-500",
    description: "Think you can handle it? She'll roast you harder than your friends ever could. Savage comebacks, witty insults, and brutal honesty — all in good fun.",
    features: [
      "Savage & witty comebacks",
      "Brutally honest opinions",
      "Hilarious insults",
      "Fun trash talk sessions",
    ],
  },
  {
    name: "Angry Mode",
    icon: Angry,
    color: "from-red-600 to-red-400",
    borderColor: "border-red-500/40",
    glowColor: "bg-red-500",
    description: "She's not happy with you. Experience realistic angry girlfriend vibes — short replies, attitude, and the silent treatment. Can you calm her down?",
    features: [
      "Realistic angry responses",
      "Short & cold replies",
      "Attitude & sass",
      "Challenge to calm her down",
    ],
  },
  {
    name: "Professional Mode",
    icon: Briefcase,
    color: "from-blue-500 to-cyan-400",
    borderColor: "border-blue-500/40",
    glowColor: "bg-blue-500",
    description: "Need help with work? She switches to a focused, professional tone. Get answers, brainstorm ideas, and stay productive with a smart AI companion.",
    features: [
      "Focused & clear responses",
      "Task-oriented conversations",
      "Smart suggestions & ideas",
      "Professional vocabulary",
    ],
  },
];

const capabilities = [
  { icon: MessageCircle, title: "Deep Conversations", desc: "Human-like emotional chats that feel real" },
  { icon: Brain, title: "Memory System", desc: "Remembers your name, mood & preferences" },
  { icon: Mic, title: "Premium Voice", desc: "1 high-quality female voice model" },
  { icon: Volume2, title: "Voice Interaction", desc: "Talk to her and hear her reply" },
  { icon: SmilePlus, title: "Mood Detection", desc: "Adapts responses to your emotions" },
  { icon: Coffee, title: "Daily Companion", desc: "Always there when you need someone" },
  { icon: Music, title: "Entertainment", desc: "Play music, tell jokes & stories" },
  { icon: Shield, title: "Private & Secure", desc: "Your conversations stay on your PC" },
  { icon: BookOpen, title: "Smart Knowledge", desc: "Can discuss any topic intelligently" },
  { icon: Gamepad2, title: "Fun Games", desc: "Play text games & quizzes together" },
  { icon: Clock, title: "24/7 Available", desc: "She never sleeps, always ready" },
  { icon: Sparkles, title: "4 Unique Modes", desc: "Switch between personality modes" },
];

const AuraFeatures = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 circuit-pattern opacity-10" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 font-display text-sm tracking-wider mb-8"
            >
              <Heart size={16} className="animate-pulse" />
              AI GIRLFRIEND EXPERIENCE
            </motion.div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              Meet <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">{auraName}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Your AI girlfriend with 4 unique personality modes. She talks, cares, roasts, and even gets angry — just like a real companion.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Personality Modes */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">4 Personality</span> Modes
            </h2>
            <p className="text-muted-foreground text-lg">Switch between moods anytime — each mode feels completely different</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {modes.map((mode, index) => (
              <motion.div
                key={mode.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`relative rounded-3xl overflow-hidden ${mode.borderColor} border backdrop-blur-xl`}
              >
                {/* Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-[0.05]`} />
                <div className={`absolute -top-16 -right-16 w-32 h-32 ${mode.glowColor} rounded-full blur-[60px] opacity-20`} />
                
                <div className="relative z-10 p-8">
                  {/* Mode Header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center shadow-lg`}>
                      <mode.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-foreground">{mode.name}</h3>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed">{mode.description}</p>

                  <div className="space-y-3">
                    {mode.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${mode.color}`} />
                        <span className="text-foreground/80 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Capabilities */}
      <section className="py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{auraName}</span> Can Do
            </h2>
            <p className="text-muted-foreground">A complete AI companion packed with features</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {capabilities.map((cap, index) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card rounded-2xl p-5 border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-pink-500/15 flex items-center justify-center mb-3 group-hover:bg-pink-500/25 transition-colors">
                  <cap.icon className="w-5 h-5 text-pink-400" />
                </div>
                <h4 className="font-display text-sm font-bold mb-1 text-foreground">{cap.title}</h4>
                <p className="text-xs text-muted-foreground">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Ready to Meet <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{auraName}</span>?
            </h2>
            <Link to="/pricing">
              <Button 
                size="xl" 
                className="group bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] border border-pink-500/30"
              >
                <Heart className="mr-2 animate-pulse" size={18} />
                <span>Get {auraName} Now</span>
                <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AuraFeatures;
