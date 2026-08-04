"use client";

import { motion } from "framer-motion";
import { 
  Search, Clock, Cloud, AppWindow, X, Power, Folder, Play, Settings,
  Phone, MessageSquare, Brain, Save, History, Plus, Camera, 
  Move, MousePointer, ArrowUpDown, Type, Keyboard, Headphones, Hand,
  FileImage, FileText, Image, Pencil, Eye, EyeOff, Scan, ScanText,
  Battery, Cpu, Sun, Volume2, Wallpaper, FileStack, BookOpen, Merge,
  File, FolderOpen, Minimize2, XCircle, Monitor, Moon, Timer, Wifi,
  ToggleLeft, LayoutGrid, Trash2, Palette, Music, ZoomIn, FolderOpen as FolderIcon,
  Maximize2, Command, Layers, Edit, LayoutDashboard, Move3d, AlignCenter
} from "lucide-react";

const myraFeatures = [
  // Core Features
  { icon: Search, name: "Google Search", category: "Core" },
  { icon: Clock, name: "Get Date/Time", category: "Core" },
  { icon: Cloud, name: "Weather Info", category: "Core" },
  
  // Window & App Control
  { icon: AppWindow, name: "Open App", category: "Window Control" },
  { icon: X, name: "Close App", category: "Window Control" },
  { icon: Power, name: "Shutdown PC", category: "Window Control" },
  { icon: Folder, name: "File/Folder Manager", category: "Window Control" },
  { icon: Play, name: "Play Files", category: "Window Control" },
  { icon: Settings, name: "App Automation", category: "Window Control" },
  
  // WhatsApp Automation
  { icon: Phone, name: "WhatsApp Call", category: "WhatsApp" },
  { icon: MessageSquare, name: "WhatsApp Message", category: "WhatsApp" },
  
  // Memory Tools
  { icon: Brain, name: "Load Memory", category: "Memory" },
  { icon: Save, name: "Save Memory", category: "Memory" },
  { icon: History, name: "Recent Conversations", category: "Memory" },
  { icon: Plus, name: "Add Memory Entry", category: "Memory" },
  
  // Utils
  { icon: Camera, name: "Screenshot Tool", category: "Utils" },
  
  // Mouse & Keyboard
  { icon: Move, name: "Move Cursor", category: "Mouse & Keyboard" },
  { icon: MousePointer, name: "Mouse Click", category: "Mouse & Keyboard" },
  { icon: ArrowUpDown, name: "Scroll Cursor", category: "Mouse & Keyboard" },
  { icon: Type, name: "Type Text", category: "Mouse & Keyboard" },
  { icon: Keyboard, name: "Press Key", category: "Mouse & Keyboard" },
  { icon: Command, name: "Press Hotkey", category: "Mouse & Keyboard" },
  { icon: Volume2, name: "Control Volume", category: "Mouse & Keyboard" },
  { icon: Hand, name: "Swipe Gesture", category: "Mouse & Keyboard" },
  
  // Image Tools
  { icon: FileImage, name: "Image to PDF", category: "Image Tools" },
  { icon: FileText, name: "Extract Text (OCR)", category: "Image Tools" },
  { icon: Image, name: "Batch Image to PDF", category: "Image Tools" },
  
  // Drawing
  { icon: Pencil, name: "Make Drawing", category: "Creative" },
  
  // Screen Reader
  { icon: Eye, name: "Start Screen Reader", category: "Screen Reader" },
  { icon: EyeOff, name: "Stop Screen Reader", category: "Screen Reader" },
  { icon: Scan, name: "Get Screen Text", category: "Screen Reader" },
  { icon: ScanText, name: "Get Selected Text", category: "Screen Reader" },
  
  // System Status
  { icon: Battery, name: "Battery Status", category: "System" },
  { icon: Cpu, name: "System Status", category: "System" },
  { icon: Sun, name: "Adjust Brightness", category: "System" },
  { icon: Volume2, name: "System Volume", category: "System" },
  
  // Desktop Features
  { icon: Wallpaper, name: "Change Wallpaper", category: "Desktop" },
  { icon: FileStack, name: "Folder to PDF", category: "PDF Tools" },
  { icon: BookOpen, name: "Read PDF", category: "PDF Tools" },
  { icon: Merge, name: "Merge PDFs", category: "PDF Tools" },
  { icon: File, name: "Active PDF Reader", category: "PDF Tools" },
  { icon: FolderOpen, name: "Scan Folder", category: "PDF Tools" },
  
  // Window Management
  { icon: Layers, name: "Switch Window", category: "Window Manager" },
  { icon: Minimize2, name: "Minimize Window", category: "Window Manager" },
  { icon: XCircle, name: "Close Window", category: "Window Manager" },
  { icon: Monitor, name: "Show Desktop", category: "Window Manager" },
  { icon: Moon, name: "Sleep System", category: "System" },
  { icon: Timer, name: "System Uptime", category: "System" },
  { icon: Wifi, name: "Network Info", category: "System" },
  
  // Extra Desktop
  { icon: ToggleLeft, name: "Toggle Icons", category: "Desktop" },
  { icon: LayoutGrid, name: "Toggle Taskbar", category: "Desktop" },
  { icon: Trash2, name: "Empty Recycle Bin", category: "Desktop" },
  { icon: Palette, name: "Set Theme", category: "Desktop" },
  { icon: Music, name: "Media Control", category: "Desktop" },
  { icon: ZoomIn, name: "Zoom Screen", category: "Desktop" },
  { icon: FolderIcon, name: "Open System Folder", category: "Desktop" },
  { icon: Maximize2, name: "Snap Window", category: "Window Manager" },
  { icon: Command, name: "Windows Shortcuts", category: "Desktop" },
  { icon: Layers, name: "Virtual Desktop", category: "Desktop" },
  { icon: Edit, name: "Edit Selection", category: "Utils" },
  
  // Window Manager by Title
  { icon: LayoutDashboard, name: "Get Open Windows", category: "Window Manager" },
  { icon: Move3d, name: "Activate by Title", category: "Window Manager" },
  { icon: Minimize2, name: "Minimize by Title", category: "Window Manager" },
  { icon: Maximize2, name: "Maximize by Title", category: "Window Manager" },
  { icon: XCircle, name: "Close by Title", category: "Window Manager" },
  { icon: AlignCenter, name: "Center Window", category: "Window Manager" },
];

const categories = [...new Set(myraFeatures.map(f => f.category))];

const categoryColors: Record<string, string> = {
  "Core": "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "Window Control": "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "WhatsApp": "from-green-500/20 to-emerald-500/20 border-green-500/30",
  "Memory": "from-violet-500/20 to-purple-500/20 border-violet-500/30",
  "Utils": "from-orange-500/20 to-yellow-500/20 border-orange-500/30",
  "Mouse & Keyboard": "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  "Image Tools": "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  "Creative": "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30",
  "Screen Reader": "from-teal-500/20 to-green-500/20 border-teal-500/30",
  "System": "from-red-500/20 to-orange-500/20 border-red-500/30",
  "Desktop": "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
  "PDF Tools": "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  "Window Manager": "from-sky-500/20 to-blue-500/20 border-sky-500/30",
};

const MyraFeaturesShowcase = () => {
  // Check if it's after Feb 1, 2025
  const isMyra2 = new Date() >= new Date('2025-02-01');
  
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full glass text-secondary font-display text-sm tracking-wider mb-6">
            {isMyra2 ? "MYRA 2.0 FEATURES" : "ALL MYRA FEATURES"}
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-secondary text-glow-purple">{isMyra2 ? "MYRA 2.0" : "MYRA"}</span> Can Do{" "}
            <span className="gradient-text">Everything</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isMyra2 
              ? "Introducing MYRA 2.0 with 70+ powerful features to control your entire PC with just your voice!"
              : "70+ powerful features to control your entire PC with just your voice!"
            }
          </p>
        </motion.div>

        {/* Feature count badge */}
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="glass-card rounded-full px-6 py-3 border border-secondary/30">
            <span className="font-display text-3xl font-bold text-secondary">{myraFeatures.length}+</span>
            <span className="text-muted-foreground ml-2">Features</span>
          </div>
        </motion.div>

        {/* Categories */}
        {categories.map((category, catIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: catIndex * 0.1 }}
            className="mb-8"
          >
            <h3 className="font-display text-lg text-muted-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              {category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {myraFeatures
                .filter(f => f.category === category)
                .map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`glass-card rounded-xl p-4 border bg-gradient-to-br ${categoryColors[category] || "from-secondary/10 to-primary/10 border-secondary/30"} cursor-pointer group`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                        <feature.icon className="w-5 h-5 text-secondary" />
                      </div>
                      <span className="text-xs text-foreground/80 font-medium leading-tight">
                        {feature.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default MyraFeaturesShowcase;