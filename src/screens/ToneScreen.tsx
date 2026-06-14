import { useState } from "react";
import { 
  ChevronLeft, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Drama, 
  HeartHandshake, 
  Activity, 
  BookOpen, 
  Flame, 
  Gem, 
  BrainCircuit 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GlowCard from "../components/GlowCard";

interface ToneScreenProps {
  onNext: (tone: string) => void;
  onBack: () => void;
  savedTone: string;
  onToneChange: (tone: string) => void;
  prompt: string;
}

export default function ToneScreen({
  onNext,
  onBack,
  savedTone,
  onToneChange,
  prompt
}: ToneScreenProps) {
  // Exactly 9 beautifully isolated premium vibe cards with high-quality Lucide icons
  const tones = [
    {
      name: "Confident 😎",
      simpleName: "Confident",
      icon: ShieldCheck,
      color: "#10B981", 
      glowColor: "emerald",
      description: "Bold, self-assured and authoritative delivery.",
      examples: ["Strong opinions", "Leadership content", "Personal insights", "Founder mindset"]
    },
    {
      name: "Funny 😂",
      simpleName: "Funny",
      icon: Drama,
      color: "#FBBF24",
      glowColor: "amber",
      description: "Humorous, entertaining and relatable content.",
      examples: ["Jokes", "Observational humor", "Relatable situations", "Light-hearted commentary"]
    },
    {
      name: "Emotional ❤️",
      simpleName: "Emotional",
      icon: HeartHandshake,
      color: "#EF4444",
      glowColor: "pink",
      description: "Personal, heartfelt and emotionally driven communication.",
      examples: ["Life lessons", "Personal stories", "Vulnerable moments", "Meaningful experiences"]
    },
    {
      name: "High Energy 🚀",
      simpleName: "High Energy",
      icon: Activity,
      color: "#F97316",
      glowColor: "orange",
      description: "Fast-paced, exciting and highly engaging delivery.",
      examples: ["Attention-grabbing hooks", "Dynamic content", "Viral-style videos", "High momentum storytelling"]
    },
    {
      name: "Educational 🧠",
      simpleName: "Educational",
      icon: BookOpen,
      color: "#14B8A6",
      glowColor: "teal",
      description: "Teach, explain and simplify valuable information.",
      examples: ["Tutorials", "Frameworks", "Guides", "Step-by-step breakdowns"]
    },
    {
      name: "Controversial 🔥",
      simpleName: "Controversial",
      icon: Sparkles,
      color: "#EA580C",
      glowColor: "orange",
      description: "Challenge common beliefs and create strong audience reactions.",
      examples: ["Hot takes", "Contrarian opinions", "Industry myths", "Debate-worthy topics"]
    },
    {
      name: "Roast 🌶️",
      simpleName: "Roast",
      icon: Flame,
      color: "#DC2626",
      glowColor: "red",
      description: "Sharp observations, witty criticism and entertaining call-outs.",
      examples: ["Industry roasts", "Trend roasts", "Creator roasts", "Brutally honest takes"]
    },
    {
      name: "Luxury 💎",
      simpleName: "Luxury",
      icon: Gem,
      color: "#6366F1",
      glowColor: "indigo",
      description: "Premium, aspirational and high-status communication style.",
      examples: ["Luxury brands", "Premium lifestyle", "Exclusive experiences", "Prestige-focused content"]
    },
    {
      name: "Deep 🌌",
      simpleName: "Deep",
      icon: BrainCircuit,
      color: "#8B5CF6",
      glowColor: "purple",
      description: "Thought-provoking, reflective and philosophical content.",
      examples: ["Mindset shifts", "Life observations", "Self-awareness", "Big ideas"]
    }
  ];

  // Robust parsing to preserve historical saved states
  const parseSelected = () => {
    if (!savedTone) return tones[0];
    const cleanLower = savedTone.toLowerCase();
    const found = tones.find(t => 
      cleanLower.includes(t.simpleName.toLowerCase()) || 
      cleanLower.includes(t.name.toLowerCase())
    );
    return found || tones[0];
  };

  const [activeTone, setActiveTone] = useState(parseSelected());

  const handleSelect = (t: typeof tones[0]) => {
    setActiveTone(t);
    onToneChange(t.name);
  };

  const handleProceed = () => {
    onNext(activeTone.name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 pb-4 font-sans text-left"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-5 text-xs font-mono text-[#A1A1AA]">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold select-none font-sans">
          <ChevronLeft size={16} />
          <span>BACK</span>
        </button>
        <span className="text-[#A855F7] font-bold uppercase tracking-widest bg-[#A855F7]/10 px-2.5 py-1 rounded-full border border-[#A855F7]/20 select-none font-mono">
          STEP 3 OF 4
        </span>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-1">
          Select Delivery Vibe
        </h2>
        <p className="text-xs text-[#A1A1AA]">
          Choose your content's core tone of voice. Secondary qualities like motivational cues or personal storytelling are automatically infused.
        </p>
      </div>

      {/* Grid Layout of 9 Cards in a clean 3x3 layout */}
      <div className="mb-4 select-none">
        <div className="grid grid-cols-3 gap-2">
          {tones.map((t) => {
            const isActive = activeTone.name === t.name;
            const IconComponent = t.icon;

            return (
              <button
                key={t.name}
                id={`vibe-btn-${t.simpleName.toLowerCase()}`}
                type="button"
                onClick={() => handleSelect(t)}
                className="relative block rounded-xl overflow-hidden transition-all duration-300 cursor-pointer text-center group"
              >
                <div
                  className={`p-3 bg-[#111111]/90 border transition-all duration-300 flex flex-col items-center justify-center h-22 ${
                    isActive 
                      ? "border-white/10" 
                      : "border-white/5 hover:border-white/15 hover:bg-[#141414]/90"
                  }`}
                  style={{
                    boxShadow: isActive ? `0 0 15px ${t.color}15` : ""
                  }}
                >
                  {/* Glow accent behind active icon */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 opacity-10 blur-md pointer-events-none transition-all duration-300 animate-pulse"
                      style={{ backgroundColor: t.color }}
                    />
                  )}

                  {/* Icon Area */}
                  <div className="mb-2 group-hover:scale-110 transition-transform duration-300 shrink-0">
                    <IconComponent 
                      size={22} 
                      strokeWidth={1.75} 
                      className="transition-all duration-300"
                      style={{
                        color: isActive ? t.color : "#A1A1AA",
                        filter: isActive ? `drop-shadow(0 0 6px ${t.color}60)` : "none"
                      }}
                    />
                  </div>

                  <span 
                    className={`text-[9.5px] font-bold tracking-tight uppercase transition-colors duration-300 ${
                      isActive ? "text-white" : "text-[#A1A1AA]"
                    }`}
                    style={{ color: isActive ? t.color : "" }}
                  >
                    {t.simpleName}
                  </span>

                  {/* Absolute subtle dot for active indicator */}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="w-1.5 h-1.5 rounded-full block animate-pulse" style={{ backgroundColor: t.color }} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Selection Preview Card to avoid cluttered mini-cards \& keep grid consistent */}
      <div className="mb-5 select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTone.name}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <GlowCard 
              glowColor={activeTone.glowColor as any}
              className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${activeTone.color}15`, border: `1px solid ${activeTone.color}30` }}
                >
                  {(() => {
                    const PreviewIcon = activeTone.icon;
                    return (
                      <PreviewIcon 
                        size={18} 
                        strokeWidth={1.75} 
                        style={{ 
                          color: activeTone.color,
                          filter: `drop-shadow(0 0 4px ${activeTone.color}50)`
                        }} 
                      />
                    );
                  })()}
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Configured Vibe</span>
                  <p className="text-xs font-black text-white uppercase tracking-tight" style={{ color: activeTone.color }}>
                    {activeTone.name}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-white/80 leading-relaxed">
                {activeTone.description}
              </p>

              {/* Real-world usage examples */}
              <div className="mt-3 bg-black/40 p-3 rounded-xl border border-white/5 font-sans">
                <span className="text-[8.5px] font-mono text-white/40 uppercase tracking-widest block mb-2 font-bold select-none">
                  Tailored For
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeTone.examples.map((item, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-[#A1A1AA] border border-white/5 inline-block"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </GlowCard>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA forward */}
      <motion.button
        id="tone-next-cta"
        whileTap={{ scale: 0.96 }}
        onClick={handleProceed}
        className="w-full mt-auto py-3.5 px-6 rounded-xl bg-[#C8FF5A] text-black font-extrabold font-sans flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_25px_rgba(200,255,90,0.25)] cursor-pointer uppercase text-xs tracking-wider font-mono"
      >
        <span>Next: Configure Duration</span>
        <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  );
}

