import { useState } from "react";
import { ChevronLeft, Sparkles, Video, BookOpen, Layers, Camera, ListOrdered, Smile, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import GlowCard from "../components/GlowCard";

interface TypeScreenProps {
  onNext: (type: string) => void;
  onBack: () => void;
  savedType: string;
  onTypeChange: (type: string) => void;
  prompt: string;
}

export default function TypeScreen({
  onNext,
  onBack,
  savedType,
  onTypeChange,
  prompt
}: TypeScreenProps) {
  // All 13 Curated Content Formats with matching aesthetic configurations
  const formats = [
    { name: "Talking Head", emoji: "🎙️", color: "#FF4FD8", desc: "Aesthetic lens focus, bold headers, raw punchy lines" },
    { name: "Storytelling", emoji: "📖", color: "#A855F7", desc: "Hero journey, vulnerability curve, filmic cues" },
    { name: "POV", emoji: "🎥", color: "#C8FF5A", desc: "First-person immersive view, relatable commentary bubble" },
    { name: "Carousel", emoji: "📱", color: "#3B82F6", desc: "10-slide high retention swipe graphic concepts & hooks" },
    { name: "Opinion", emoji: "💬", color: "#10B981", desc: "Unpopular perspective, spicy pattern interrupt" },
    { name: "Educational", emoji: "💡", color: "#F59E0B", desc: "Step-by-step breakdown, high value density" },
    { name: "List Style", emoji: "📊", color: "#EF4444", desc: "Curated value resources, rapid sequence ticks" },
    { name: "Case Study", emoji: "🔍", color: "#EC4899", desc: "Before/after stats, direct evidence, teardowns" },
    { name: "Personal Brand", emoji: "🤝", color: "#6366F1", desc: "Unfiltered lesson, founder mindset shifts" },
    { name: "Authority Building", emoji: "👑", color: "#8B5CF6", desc: "Credibility cues, expert high-status language" },
    { name: "Product Pitch", emoji: "💸", color: "#C8FF5A", desc: "Problem, bottleneck, solution, call to action" },
    { name: "Viral Hook", emoji: "🔥", color: "#FF4FD8", desc: "Instant pattern interrupt, high-pacing split" },
    { name: "Podcast Style", emoji: "🎧", color: "#3B82F6", desc: "Conversational audio, micro-mic simulation" }
  ];

  const [selected, setSelected] = useState(savedType || "Talking Head");

  const handleSelect = (formatName: string) => {
    setSelected(formatName);
    onTypeChange(formatName);
  };

  const handleProceed = () => {
    onNext(selected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 pb-24 font-sans"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-5 text-xs font-mono text-[#A1A1AA]">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold select-none">
          <ChevronLeft size={16} />
          <span>BACK</span>
        </button>
        <span className="text-[#A855F7] font-bold uppercase tracking-widest bg-[#A855F7]/10 px-2.5 py-1 rounded-full border border-[#A855F7]/20 select-none">
          STEP 2 OF 4
        </span>
      </div>

      <div className="mb-5 text-left">
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-1">
          Select Content Format
        </h2>
        <p className="text-xs text-[#A1A1AA]">
          Nannu AI optimizes hook mechanics per format structural limits.
        </p>
      </div>

      {/* In-context Topic Preview Banner */}
      <div className="mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3 items-center select-none text-left">
        <div className="p-2 rounded-lg bg-[#FF4FD8]/10 text-[#FF4FD8] shrink-0">
          <Sparkles size={16} className="animate-pulse" />
        </div>
        <div className="overflow-hidden">
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Tuning Topic Focus</span>
          <span className="text-xs text-white/90 font-medium truncate block mt-0.5">
            "{prompt || "Custom Topic Generation"}"
          </span>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="flex-1 select-none overflow-y-auto mb-6 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
          {formats.map((t) => {
            const isActive = selected === t.name;

            return (
              <button
                key={t.name}
                id={`format-btn-${t.name.toLowerCase().replace(" ", "-")}`}
                type="button"
                onClick={() => handleSelect(t.name)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer ${
                  isActive
                    ? "bg-[#FF4FD8]/10 border-[#FF4FD8] shadow-[0_0_12px_rgba(255,79,216,0.15)]"
                    : "bg-[#111111]/80 border-white/5 hover:border-white/10 hover:bg-[#151515]"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg select-none shrink-0 border border-white/5">
                    {t.emoji}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-xs font-bold text-white tracking-wide">{t.name}</h3>
                    <p className="text-[10px] text-[#A1A1AA] truncate mt-0.5 leading-tight">{t.desc}</p>
                  </div>
                </div>
                {isActive && (
                  <span className="text-[9px] font-mono text-[#FF4FD8] font-bold bg-[#FF4FD8]/10 px-2 py-0.5 rounded border border-[#FF4FD8]/25 shrink-0 ml-1">
                    ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA to next step */}
      <motion.button
        id="format-next-cta"
        whileTap={{ scale: 0.96 }}
        onClick={handleProceed}
        className="w-full mt-auto py-4 px-6 rounded-2xl bg-[#C8FF5A] text-black font-extrabold font-sans flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_25px_rgba(200,255,90,0.35)] cursor-pointer"
      >
        <span>Next: Choose Tone</span>
        <ArrowRight size={16} />
      </motion.button>
    </motion.div>
  );
}
