import { useState } from "react";
import { ChevronLeft, Sparkles, Smile, Check, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
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
  const tones = [
    { name: "Confident 😎", style: "border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300" },
    { name: "Funny 😂", style: "border-yellow-500/20 hover:border-yellow-500/40 text-yellow-300" },
    { name: "Emotional 🥺", style: "border-sky-500/20 hover:border-sky-500/40 text-sky-300" },
    { name: "Motivational ⚡", style: "border-amber-500/20 hover:border-amber-500/40 text-amber-300" },
    { name: "Inspirational ✨", style: "border-fuchsia-500/20 hover:border-fuchsia-500/40 text-fuchsia-300" },
    { name: "Storyteller 📖", style: "border-purple-500/20 hover:border-purple-500/40 text-purple-300" },
    { name: "Savage 🌶️", style: "border-rose-500/20 hover:border-rose-500/40 text-rose-300" },
    { name: "Roast 🔥", style: "border-red-500/20 hover:border-red-500/40 text-red-300" },
    { name: "Educational 💡", style: "border-teal-500/20 hover:border-teal-500/40 text-teal-300" },
    { name: "Luxury 💎", style: "border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300" },
    { name: "Casual 👟", style: "border-neutral-500/20 hover:border-neutral-500/40 text-neutral-300" },
    { name: "High Energy 🚀", style: "border-orange-500/20 hover:border-orange-500/40 text-orange-300" },
    { name: "Authority ⚖️", style: "border-blue-500/20 hover:border-blue-500/40 text-blue-300" },
    { name: "Friendly 🤝", style: "border-green-500/20 hover:border-green-500/40 text-green-300" },
    { name: "Controversial 💥", style: "border-red-500/30 hover:border-red-500/50 text-red-400" },
    { name: "Deep 🧠", style: "border-violet-500/20 hover:border-violet-500/40 text-violet-300" },
    { name: "Reflective 💭", style: "border-pink-500/20 hover:border-pink-500/40 text-pink-300" }
  ];

  const [selected, setSelected] = useState(savedTone || "Confident 😎");

  const handleSelect = (tone: string) => {
    setSelected(tone);
    onToneChange(tone);
  };

  const handleProceed = () => {
    onNext(selected);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 pb-4 font-sans"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-5 text-xs font-mono text-[#A1A1AA]">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold select-none">
          <ChevronLeft size={16} />
          <span>BACK</span>
        </button>
        <span className="text-[#A855F7] font-bold uppercase tracking-widest bg-[#A855F7]/10 px-2.5 py-1 rounded-full border border-[#A855F7]/20 select-none">
          STEP 3 OF 4
        </span>
      </div>

      <div className="mb-5 text-left">
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-1">
          Select Delivery Tone
        </h2>
        <p className="text-xs text-[#A1A1AA]">
          Choose the vocal attitude, emotional triggers, and personality blend.
        </p>
      </div>

      {/* In-context Topic Preview Banner */}
      <div className="mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-3 items-center select-none text-left">
        <div className="p-2 rounded-lg bg-[#A855F7]/10 text-[#A855F7] shrink-0">
          <Smile size={16} className="animate-pulse" />
        </div>
        <div className="overflow-hidden">
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Active Topic</span>
          <span className="text-xs text-white/90 font-medium truncate block mt-0.5">
            "{prompt || "Custom Topic Generation"}"
          </span>
        </div>
      </div>

      {/* Bento style Tone Selector */}
      <div className="mb-6 select-none">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {tones.map((t) => {
            const isActive = selected === t.name;

            return (
              <button
                key={t.name}
                id={`tone-pill-${t.name.split(" ")[0].toLowerCase()}`}
                type="button"
                onClick={() => handleSelect(t.name)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-300 relative flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.25)] scale-[1.02]"
                    : "bg-[#111111]/80 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className={`text-sm font-bold font-sans ${isActive ? "text-black" : "text-white"}`}>
                    {t.name}
                  </span>
                  {isActive && (
                    <span className="p-0.5 rounded-full bg-black text-white">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-mono mt-1 font-semibold block uppercase tracking-wide opacity-80 ${isActive ? "text-neutral-500" : "text-[#A1A1AA]"}`}>
                  {isActive ? "Configured Vibe" : "Select Model"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue Action */}
      <motion.button
        id="tone-next-cta"
        whileTap={{ scale: 0.96 }}
        onClick={handleProceed}
        className="w-full mt-auto py-4 px-6 rounded-2xl bg-[#C8FF5A] text-black font-extrabold font-sans flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_25px_rgba(200,255,90,0.35)] cursor-pointer"
      >
        <span>Next: Configure Duration</span>
        <ArrowRight size={16} />
      </motion.button>
    </motion.div>
  );
}
