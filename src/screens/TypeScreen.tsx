import { useState } from "react";
import { ChevronLeft, Sparkles, ArrowRight } from "lucide-react";
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
  // Exactly 4 structured premium formats with descriptions, examples and explicit purpose
  const formats = [
    {
      name: "Talking Head",
      emoji: "🎤",
      color: "#FF4FD8",
      glowColor: "pink",
      description: "Direct camera-to-camera content where the creator speaks directly to the audience.",
      examples: ["Opinions", "Personal Brand", "Educational Content", "Motivation", "Insights", "Lessons Learned"],
      purpose: "Best for sharing thoughts, expertise, stories or personal perspectives directly with your viewers."
    },
    {
      name: "Cinematic",
      emoji: "🎬",
      color: "#F59E0B",
      glowColor: "orange",
      description: "Story-driven high production format combining multiple angles, movement, and visual pacing.",
      examples: ["Personal Journey", "Transformation Stories", "Lifestyle Vlog", "Documentary Style", "Brand Films", "Atmospheric Content"],
      purpose: "Best for emotional, highly immersive and visually rich storytelling that captures viewer curiosity."
    },
    {
      name: "Product Pitch",
      emoji: "📦",
      color: "#C8FF5A",
      glowColor: "lime",
      description: "A conversion-primed format engineered to present, demonstrate, or pitch a product or business.",
      examples: ["SaaS & App Demos", "Local Business Promo", "Agency Services", "Features Teardown", "Special Offers", "Product Launches"],
      purpose: "Best for digital marketing, qualified lead generation, audience acquisition, and conversion optimization."
    },
    {
      name: "Podcast Clip",
      emoji: "🎙️",
      color: "#3B82F6",
      glowColor: "blue",
      description: "Conversation-driven extracts focused on interview moments, shared dialogues, and quick-fire knowledge.",
      examples: ["Rapid Q&A Clips", "Guest Interviews", "Debate & Arguments", "Co-host Dialogues", "Expert Conversations", "Studio Repurposing"],
      purpose: "Best for turning long-form podcasts or verbal interviews into addictive, viral short-form clips."
    }
  ];

  // Map any legacy types gracefully to one of the 4 valid ones
  const validFormats = ["Talking Head", "Cinematic", "Product Pitch", "Podcast Clip"];
  const initialSelected = validFormats.includes(savedType) ? savedType : "Talking Head";

  const [selected, setSelected] = useState(initialSelected);

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
      className="flex flex-col flex-1 pb-4 font-sans text-left"
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

      <div className="mb-5">
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-1">
          Select Content Format
        </h2>
        <p className="text-xs text-[#A1A1AA]">
          Choose the production format. Nannu's AI engine automatically implements optimized style frameworks based on your selection.
        </p>
      </div>

      {/* In-context Topic Preview Banner */}
      <div className="mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3 items-center select-none">
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

      {/* Grid of 4 Cards */}
      <div className="mb-6 select-none">
        <div className="flex flex-col gap-3.5">
          {formats.map((t) => {
            const isActive = selected === t.name;

            return (
              <button
                key={t.name}
                id={`format-btn-${t.name.toLowerCase().replace(" ", "-")}`}
                type="button"
                onClick={() => handleSelect(t.name)}
                className="w-full relative text-left rounded-2xl block overflow-hidden transition-all duration-300 cursor-pointer"
              >
                <GlowCard 
                  glowColor={isActive ? (t.glowColor as any) : "none"} 
                  className={`p-4 bg-[#111111]/90 border transition-all duration-300 relative ${
                    isActive 
                      ? "border-white/10" 
                      : "border-white/5 hover:border-white/15 hover:bg-[#141414]/90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Header: Icon & Title & Active Badge */}
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: `${t.color}15`, border: `1px solid ${t.color}25` }}
                      >
                        {t.emoji}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                          <span>{t.name}</span>
                        </h3>
                      </div>
                    </div>

                    {isActive && (
                      <span 
                        className="text-[8.5px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border shrink-0"
                        style={{ color: t.color, backgroundColor: `${t.color}15`, borderColor: `${t.color}30` }}
                      >
                        Selected
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mt-3">
                    {t.description}
                  </p>

                  {/* Bulleted Examples */}
                  <div className="mt-3 bg-white/[0.015] p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mb-1.5 font-semibold">
                      Ideal For
                    </span>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#A1A1AA]">
                      {t.examples.map((ex, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="truncate">{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Highlighted Purpose */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-start gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/30 shrink-0 mt-0.5 font-bold">
                      Tone Purpose:
                    </span>
                    <p className="text-[10px] text-white/70 italic leading-snug">
                      {t.purpose}
                    </p>
                  </div>
                </GlowCard>
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
        className="w-full mt-auto py-3.5 px-6 rounded-xl bg-[#C8FF5A] text-black font-extrabold font-sans flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_25px_rgba(200,255,90,0.25)] cursor-pointer uppercase text-xs tracking-wider font-mono"
      >
        <span>Next: Choose Tone</span>
        <ArrowRight size={14} />
      </motion.button>
    </motion.div>
  );
}
