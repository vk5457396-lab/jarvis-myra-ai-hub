import { motion } from "framer-motion";
import { Smartphone, Heart, Music, Youtube, MessageCircle, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileAppComingSoon = () => {
  const features = [
    { icon: Heart, text: "Human-like Girlfriend Voice", color: "text-pink-400" },
    { icon: Music, text: "Spotify Music Control", color: "text-green-400" },
    { icon: Youtube, text: "YouTube Playback", color: "text-red-400" },
    { icon: MessageCircle, text: "WhatsApp Messaging", color: "text-emerald-400" },
    { icon: Sparkles, text: "All Tasks Automation", color: "text-yellow-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative glass-card rounded-2xl p-8 overflow-hidden border border-pink-500/30 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-cyan-500/5"
    >
      {/* Animated Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "0.5s" }} />

      <div className="relative z-10">
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-pink-500/40 mb-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
          </span>
          <span className="text-sm font-display text-pink-400 tracking-wider font-semibold">COMING SOON</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <h3 className="font-display text-3xl md:text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                AI Girlfriend
              </span>
              <br />
              <span className="text-foreground">Mobile App</span>
            </h3>
            <p className="text-muted-foreground mb-6 text-lg">
              Your personal AI companion with a human-like voice. Control music, send messages, and automate your daily tasks - all through natural conversation.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 glass rounded-lg px-4 py-3 border border-white/10 hover:border-pink-500/30 transition-colors"
                >
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  <span className="text-foreground text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Notify Button */}
            <Button 
              variant="outline" 
              size="xl" 
              className="gap-2 group border-pink-500/50 text-pink-400 hover:bg-pink-500/10 hover:border-pink-400"
              onClick={() => {
                const message = encodeURIComponent("🎀 AI Girlfriend App Notification\n\nHi! I'm interested in the AI Girlfriend Mobile App. Please notify me when it launches!");
                window.open(`https://t.me/codeninjavik1?text=${message}`, "_blank");
              }}
            >
              <Bell size={20} className="group-hover:animate-bounce" />
              Notify Me on Launch
            </Button>
          </div>

          {/* Right - Phone Mockup */}
          <div className="hidden lg:flex items-center justify-center">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotateZ: [-2, 2, -2]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="relative"
            >
              {/* Phone Frame */}
              <div className="relative w-48 h-80 rounded-[2.5rem] bg-gradient-to-b from-gray-800 to-gray-900 p-2 shadow-2xl shadow-pink-500/20">
                {/* Screen */}
                <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 overflow-hidden flex flex-col items-center justify-center relative">
                  {/* Notch */}
                  <div className="absolute top-2 w-20 h-5 bg-gray-900 rounded-full" />
                  
                  {/* Content */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-4"
                  >
                    <Heart className="w-10 h-10 text-white" />
                  </motion.div>
                  <Smartphone className="w-8 h-8 text-pink-400 mb-2" />
                  <span className="text-xs text-pink-300 font-display">AI Girlfriend</span>
                  
                  {/* Floating Icons */}
                  <motion.div
                    animate={{ y: [-5, 5, -5], x: [-3, 3, -3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-16 right-4"
                  >
                    <Music className="w-4 h-4 text-green-400" />
                  </motion.div>
                  <motion.div
                    animate={{ y: [5, -5, 5], x: [3, -3, 3] }}
                    transition={{ duration: 3.5, repeat: Infinity }}
                    className="absolute bottom-20 left-4"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                </div>
              </div>
              
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-pink-500/30 to-purple-500/30 blur-xl -z-10" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileAppComingSoon;
