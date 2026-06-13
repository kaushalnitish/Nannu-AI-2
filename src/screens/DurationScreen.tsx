import { useState, useEffect } from "react";
import { ChevronLeft, Sparkles, Clock, ArrowRight, Minus, Plus, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

// Robust parsing helper
const parseDurationStringToSeconds = (dur: string): number => {
  if (!dur) return 45; // Default to 45 sec
  const clean = dur.toLowerCase().trim();
  
  let totalSecs = 0;
  
  // Try to match hours: e.g. "1h" or "1 h"
  const hrMatch = clean.match(/(\d+)\s*h/);
  if (hrMatch) {
    totalSecs += parseInt(hrMatch[1], 10) * 3600;
  }
  
  // Try to match minutes: e.g. "12m" or "2 min" or "5m" or "2m"
  const minMatch = clean.match(/(\d+)\s*(?:m|min|minute|minutes)/);
  if (minMatch) {
    totalSecs += parseInt(minMatch[1], 10) * 60;
  }
  
  // Try to match seconds: e.g. "15s" or "15 sec" or "15 seconds" or "45s"
  const secMatch = clean.match(/(\d+)\s*(?:s|sec|second|seconds)(?!\w)/);
  if (secMatch) {
    totalSecs += parseInt(secMatch[1], 10);
  } else {
    // If there are no letters or just a number, treat as seconds
    const pureNumMatch = clean.match(/^(\d+)$/);
    if (pureNumMatch && !hrMatch && !minMatch) {
      totalSecs += parseInt(pureNumMatch[1], 10);
    }
  }

  return totalSecs > 0 ? totalSecs : 45;
};

// Precise duration formatter matching spec
const formatSecondsToDurationString = (sec: number): string => {
  if (sec < 60) {
    return `${sec} sec`;
  }
  const mins = Math.floor(sec / 60);
  const leftSecs = sec % 60;
  
  if (mins < 60) {
    if (leftSecs === 0) {
      return `${mins} min`;
    }
    return `${mins}m ${leftSecs.toString().padStart(2, "0")}s`;
  } else {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0 && leftSecs === 0) {
      return `${hrs}h`;
    }
    if (leftSecs === 0) {
      return `${hrs}h ${remainingMins}m`;
    }
    return `${hrs}h ${remainingMins}m ${leftSecs.toString().padStart(2, "0")}s`;
  }
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
  // Creator-friendly presets
  const presets = [
    { label: "15 sec", secs: 15 },
    { label: "30 sec", secs: 30 },
    { label: "45 sec", secs: 45 },
    { label: "60 sec", secs: 60 },
    { label: "2 min", secs: 120 },
    { label: "5 min", secs: 300 },
    { label: "10 min", secs: 600 }
  ];

  // Initialize continuous seconds state
  const [seconds, setSeconds] = useState<number>(() => parseDurationStringToSeconds(savedDuration));
  
  // Track if custom mode is selected
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => {
    const initialSecs = parseDurationStringToSeconds(savedDuration);
    // If it falls exactly on one of our standard presets, start as preset mode; else start as custom slider mode
    return !presets.some(p => p.secs === initialSecs);
  });

  // Sync state upward when seconds value or custom mode changes
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

  const selectPreset = (secs: number) => {
    setSeconds(secs);
    setIsCustomMode(false);
  };

  const enableCustomMode = () => {
    setIsCustomMode(true);
    // If we were on a preset, keep seconds but let them slide freely
  };

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
          Select a creator-friendly preset or enable Custom Duration mode to unlock precise timings.
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
              {savedContentType || "Talking Head"} • {savedMood || "Confident 😎"} Tone
            </span>
          </div>
        </div>
      </div>

      {/* Selected Duration Live Readout Banner */}
      <div className="mb-5 p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
        <span className="text-xs font-mono uppercase tracking-widest text-[#A1A1AA]">Selected Duration</span>
        <span className="text-[#C8FF5A] text-lg font-mono font-black uppercase tracking-wider bg-[#C8FF5A]/10 px-4.5 py-1.5 rounded-full border border-[#C8FF5A]/25 shadow-[0_0_15px_rgba(200,255,90,0.25)]">
          {formatSecondsToDurationString(seconds)}
        </span>
      </div>

      {/* Quick Select Options */}
      <div className="mb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2.5">Quick-Select Options</span>
        <div className="grid grid-cols-4 gap-1.5 select-none">
          {presets.map((p) => {
            const isSelected = !isCustomMode && seconds === p.secs;
            return (
              <button
                key={p.secs}
                type="button"
                onClick={() => selectPreset(p.secs)}
                className={`text-[10px] py-2.5 px-1 text-center truncate rounded-lg border transition-all duration-300 font-mono tracking-tight font-bold cursor-pointer ${
                  isSelected
                    ? "bg-white text-black border-white font-black shadow-[0_0_12px_rgba(255,255,255,0.3)] scale-[1.02]"
                    : "bg-[#111111]/60 border-white/5 text-white/70 hover:border-white/10 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            );
          })}
          
          {/* Custom Duration Button */}
          <button
            type="button"
            onClick={enableCustomMode}
            className={`text-[10px] py-2.5 px-1 text-center truncate rounded-lg border transition-all duration-300 font-mono tracking-tight font-bold cursor-pointer col-span-1 ${
              isCustomMode
                ? "bg-gradient-to-r from-[#A855F7] to-[#FF4FD8] text-white border-transparent font-black shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[1.02]"
                : "bg-[#111111]/60 border-white/5 text-white/70 hover:border-white/10 hover:text-white"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Duration Slider (Expands Dynamically) */}
      <AnimatePresence>
        {isCustomMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">
              Custom Slider (10 sec to 90 min)
            </span>
            <GlowCard id="continuous-slider-glow-card" glowColor="purple" className="p-6 bg-[#0c0c0c]/95 border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="flex items-center justify-between gap-4 mb-4 select-none">
                <button
                  onClick={handleDecrement}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer shadow-sm"
                  title="Fine-tune minus"
                >
                  <Minus size={14} />
                </button>
                
                <div className="flex-1 px-1">
                  {/* Range input 10s (10) to 90m (5450 - rounded to 5400) */}
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
                      background: `linear-gradient(to right, #A855F7 0%, #FF4FD8 ${((seconds - 10) / (5400 - 10)) * 100}%, rgba(255,255,255,0.06) ${((seconds - 10) / (5400 - 10)) * 100}%, rgba(255,255,255,0.06) 100%)`
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
                <span>10 sec</span>
                <span className="text-white/15">|</span>
                <span>15 min</span>
                <span className="text-white/15">|</span>
                <span>90 min</span>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Action Call */}
      <motion.button
        id="duration-generate-cta"
        whileTap={{ scale: 0.96 }}
        onClick={() => onGenerate(savedContentType)}
        className="w-full mt-auto py-4 px-6 rounded-2xl bg-[#C8FF5A] text-black font-extrabold font-mono tracking-widest uppercase text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-[0_0_25px_rgba(200,255,90,0.35)] cursor-pointer"
      >
        <span>Generate AI Script</span>
        <Sparkles size={14} className="animate-pulse" />
      </motion.button>
    </motion.div>
  );
}
