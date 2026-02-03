import { motion } from "framer-motion";
import { ExternalLink, Key, Sparkles, Video, Bot, Code, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const apiResources = [
  {
    name: "Google Gemini API",
    description: "Get your free Gemini API key for AI-powered features",
    icon: Sparkles,
    url: "https://aistudio.google.com/apikey",
    buttonText: "Get Gemini API",
    color: "text-blue-400",
    bgColor: "from-blue-500/20 to-blue-500/5",
    borderColor: "border-blue-500/30",
  },
  {
    name: "Mem0 API",
    description: "Memory layer for AI applications and agents",
    icon: Brain,
    url: "https://app.mem0.ai/",
    buttonText: "Get Mem0 API",
    color: "text-pink-400",
    bgColor: "from-pink-500/20 to-pink-500/5",
    borderColor: "border-pink-500/30",
  },
  {
    name: "LiveKit API",
    description: "Real-time audio/video communication platform",
    icon: Video,
    url: "https://livekit.io/",
    buttonText: "Get LiveKit API",
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/30",
  },
  {
    name: "OpenAI API",
    description: "Access GPT models for advanced AI capabilities",
    icon: Bot,
    url: "https://platform.openai.com/api-keys",
    buttonText: "Get OpenAI API",
    color: "text-emerald-400",
    bgColor: "from-emerald-500/20 to-emerald-500/5",
    borderColor: "border-emerald-500/30",
  },
  {
    name: "ElevenLabs API",
    description: "AI voice generation and text-to-speech",
    icon: Code,
    url: "https://elevenlabs.io/",
    buttonText: "Get ElevenLabs API",
    color: "text-orange-400",
    bgColor: "from-orange-500/20 to-orange-500/5",
    borderColor: "border-orange-500/30",
  },
];

const ApiResourcesSection = () => {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-primary font-display text-sm tracking-wider mb-4">
            <Key size={16} />
            API RESOURCES
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Get Your <span className="gradient-text">API Keys</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Jarvis and MYRA use various AI APIs for their advanced features. Get your API keys from these platforms to unlock full functionality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {apiResources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`glass-card rounded-xl p-6 border ${resource.borderColor} bg-gradient-to-b ${resource.bgColor} transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center mb-4`}>
                <resource.icon className={`w-6 h-6 ${resource.color}`} />
              </div>
              
              <h3 className="font-display text-lg font-bold mb-2">{resource.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{resource.description}</p>
              
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`w-full group border-border/50 hover:border-border`}
                >
                  <span>{resource.buttonText}</span>
                  <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            💡 <strong className="text-foreground">Tip:</strong> Most APIs offer free tiers perfect for personal use. 
            Follow our setup guides to configure these APIs in Jarvis and MYRA.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ApiResourcesSection;
