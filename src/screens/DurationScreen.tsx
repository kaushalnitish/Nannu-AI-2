import { useState, useEffect } from "react";
import { ChevronLeft, Sparkles, Clock, ArrowRight, Minus, Plus } from "lucide-react";
import { motion } from "motion/react";
import GlowCard from "../components/GlowCard";

interface DurationScreenProps {
  onBack: () => void;
  onGenerate: (type: string) => void;
  savedDuration: string;
  onDurationChange: (dur: string) => void;
  savedContentType: string;
  onContentTypeChange: (type: string) => void;
  savedMood: string;
  onMoodChange: (mood: string) => void;
  prompt: string;
}

// Highly robust parsing helper
const parseDurationStringToSeconds = (dur: string): number => {
  if (!dur) return 45; // Default 45s
  const clean = dur.toLowerCase().trim();
  
  // Try pattern: "22m 45s" or "3m 17s"
  const minSecMatch = clean.match(/^(\d+)\s*m\s*(\d+)\s*s$/);
  if (minSecMatch) {
    return parseInt(minSecMatch[1], 10) * 60 + parseInt(minSecMatch[2], 10);
  }
  
  // Try pattern: "5m" or "15m" or "90m"
  const minMatch = clean.match(/^(\d+)\s*m$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10) * 60;
  }
  
  // Try pattern: "15 seconds" or "45 seconds" or "74 seconds" or "15s"
  const secMatch = clean.match(/^(\d+)\s*(?:seconds|second|s)?$/);
  if (secMatch) {
    return parseInt(secMatch[1], 10);
  }
  
  // Older presets
  if (clean.includes("minute")) {
    const num = parseInt(clean, 10);
    return isNaN(num) ? 45 : num * 60;
  }
  
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 45 : parsed;
};

const formatSecondsToDurationString = (sec: number): string => {
  if (sec < 60) {
    return `${sec} seconds`;
  }
  const mins = Math.floor(sec / 60);
  const leftSecs = sec % 60;
  if (leftSecs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${leftSecs}s`;
};

export default function DurationScreen({
  onBack,
  onGenerate,
  savedDuration,
  onDurationChange,
  savedContentType,
  onContentTypeChange,
  savedMood,
  onMoodChange,
  prompt
}: DurationScreenProps) {
  // Initialize continuous seconds state
  const [seconds, setSeconds] = useState<number>(() => parseDurationStringToSeconds(savedDuration));

  // Sync state upward when seconds value changes
  useEffect(() => {
    const durString = formatSecondsToDurationString(seconds);
    onDurationChange(durString);
  }, [seconds]);

  // Handle fine-tuning increments
  const handleDecrement = () => {
    setSeconds(prev => {
      if (prev <= 10) return 10;
      if (prev <= 60) return prev - 1; // 1s steps below 1m
      if (prev <= 180) return prev - 5; // 5s steps below 3m
      if (prev <= 900) return prev - 15; // 15s steps below 15m
      return prev - 60; // 1m steps above
    });
  };

  const handleIncrement = () => {
    setSeconds(prev => {
      const maxSecs = 5400; // 90m
      if (prev >= maxSecs) return maxSecs;
      if (prev < 60) return prev + 1;
      if (prev < 180) return prev + 5;
      if (prev < 900) return prev + 15;
      return prev + 60;
    });
  };

  // Custom presets as requested
  const presets = [
    { label: "39 seconds", secs: 39 },
    { label: "74 seconds", secs: 74 },
    { label: "3m 17s", secs: 197 },
    { label: "22m 45s", secs: 1365 },
    { label: "15s Short", secs: 15 },
    { label: "90s Detailed", secs: 90 },
    { label: "5m YouTube", secs: 300 },
    { label: "90m Master", secs: 5400 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 pb-24 font-sans text-left"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-5 text-xs font-mono text-[#A1A1AA]">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold select-none">
          <ChevronLeft size={16} />
          <span>BACK</span>
        </button>
        <span className="text-[#A855F7] font-bold uppercase tracking-widest bg-[#A855F7]/10 px-2.5 py-1 rounded-full border border-[#A855F7]/20 select-none">
          STEP 4 OF 4
        </span>
      </div>

      {/* Title */}
      <div className="mb-5 text-left">
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-1">
          Configure Script Duration
        </h2>
        <p className="text-xs text-[#A1A1AA]">
          Slide, fine-tune, or tap presets to customize content timing exactly down to the second.
        </p>
      </div>

      {/* In-context Topic & Preview Info */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-2 text-left select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#C8FF5A]/10 text-[#C8FF5A] shrink-0">
            <Clock size={16} className="animate-pulse" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Tuned Recipe</span>
            <span className="text-xs text-white/90 font-medium truncate block">
              {savedContentType || "Talking Head"} with {savedMood || "Confident 😎"} Tone
            </span>
          </div>
        </div>
      </div>

      {/* Live Duration Readout */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-white/60">Selected Pacing Target</span>
          <span className="text-[#C8FF5A] text-sm font-mono font-black uppercase tracking-wider bg-[#C8FF5A]/10 px-3 py-1 rounded-full border border-[#C8FF5A]/25 shadow-[0_0_12px_rgba(200,255,90,0.15)]">
            {formatSecondsToDurationString(seconds)}
          </span>
        </div>

        {/* Snapping Continuous Slider Glow Card */}
        <GlowCard id="continuous-slider-glow-card" glowColor="green" className="p-6 bg-[#0c0c0c]/95 border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="flex items-center justify-between gap-4 mb-4 select-none">
            <button
              onClick={handleDecrement}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer shadow-sm"
              title="Fine-tune minus"
            >
              <Minus size={14} />
            </button>
            
            <div className="flex-1 px-1">
              {/* Range input 10s (10) to 90m (5400) */}
              <input
                id="duration-continuous-range"
                type="range"
                min="10"
                max="5400"
                step="1"
                value={seconds}
                onChange={(e) => setSeconds(parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-lg appearance-none cursor-ew-resize outline-none transition-all duration-150"
                style={{
                  background: `linear-gradient(to right, #C8FF5A 0%, #A855F7 ${((seconds - 10) / (5400 - 10)) * 100}%, rgba(255,255,255,0.06) ${((seconds - 10) / (5400 - 10)) * 100}%, rgba(255,255,255,0.06) 100%)`
                }}
              />
            </div>

            <button
              onClick={handleIncrement}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer shadow-sm"
              title="Fine-tune plus"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-white/30 tracking-wider select-none font-bold">
            <span>10 seconds</span>
            <span className="text-white/15">|</span>
            <span>15 minutes</span>
            <span className="text-white/15">|</span>
            <span>90 minutes</span>
          </div>
        </GlowCard>
      </div>

      {/* Selection presetting buttons */}
      <div className="mb-8">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2.5">Preset Values</span>
        <div className="grid grid-cols-4 gap-1.5 select-none">
          {presets.map((p) => {
            const isSelected = seconds === p.secs;
            return (
              <button
                key={p.secs}
                type="button"
                onClick={() => setSeconds(p.secs)}
                className={`text-[10px] py-2 px-1 text-center truncate rounded-lg border transition-all duration-300 font-mono tracking-tight font-semibold cursor-pointer ${
                  isSelected
                    ? "bg-white text-black border-white font-extrabold shadow-[0_0_12px_rgba(255,255,255,0.3)] scale-[1.02]"
                    : "bg-[#111111]/60 border-white/5 text-white/70 hover:border-white/10 hover:text-white"
                }`}
              >
                {p.label.replace(" YouTube", "").replace(" Master", "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Action Call */}
      <motion.button
        id="duration-generate-cta"
        whileTap={{ scale: 0.96 }}
        onClick={() => onGenerate(savedContentType)}
        className="w-full mt-auto py-4 px-6 rounded-2xl bg-[#C8FF5A] text-black font-extrabold font-sans flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_25px_rgba(200,255,90,0.35)] cursor-pointer"
      >
        <span>Generate AI Script</span>
        <Sparkles size={18} className="animate-pulse" />
      </motion.button>
    </motion.div>
  );
}
