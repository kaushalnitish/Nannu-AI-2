import { useEffect, useState, useRef } from "react";
import { Brain, Sparkles, Check, Play, User, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GeneratingScreenProps {
  isGenerating?: boolean;
  payloadReady?: boolean;
  onComplete: () => void;
}

export default function GeneratingScreen({ isGenerating = true, payloadReady = false, onComplete }: GeneratingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(Date.now());

  // Performance timer tick
  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTime.current);
    }, 47);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  // Coordinated Progress Bar & Completion Flow
  useEffect(() => {
    if (payloadReady) {
      // Server-side response has arrived! Fast-forward to 100% immediately
      if (timerRef.current) clearInterval(timerRef.current);
      
      const accelTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(accelTimer);
            setTimeout(() => {
              onComplete();
            }, 500); // Small, elegant buffer to show the checkmarks complete!
            return 100;
          }
          return Math.min(prev + 12, 100);
        });
      }, 50);

      return () => clearInterval(accelTimer);
    } else {
      // API is still loading: tick realistically but decelerate as we get closer to 95%
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            // Wait right there until server payload is ready
            return 95;
          }
          // Fast-tick in early stages then slow down to feel authentic
          const speedFactor = prev < 40 ? 5 : prev < 75 ? 3 : 1;
          const step = Math.floor(Math.random() * 4) + speedFactor;
          return Math.min(prev + step, 95);
        });
      }, 150);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [payloadReady, onComplete]);

  // Checklist Items mapping directly to physical progress landmarks
  const checklist = [
    { label: "Generating Hook...", percent: 20, icon: Sparkles },
    { label: "Generating Main Script...", percent: 45, icon: Play },
    { label: "Generating CTA...", percent: 68, icon: Brain },
    { label: "Generating Creator Directions...", percent: 85, icon: User },
    { label: "Generating Captions...", percent: 100, icon: MessageSquare },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-between px-6 py-8 select-none overflow-y-auto"
    >
      {/* Upper Status Metadata Box */}
      <div className="w-full max-w-md flex items-center justify-between mt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#555] uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#FF4FD8] animate-ping" />
          <span>Nannu Engine Coordinated Link</span>
        </div>
        <div className="font-mono text-[10px] text-[#A1A1AA] bg-white/5 px-2 py-0.5 rounded border border-white/5">
          ELAPSED <span className="text-[#C8FF5A] font-bold">{(elapsedTime / 1000).toFixed(2)}s</span>
        </div>
      </div>

      {/* Main Grid: Interactive Console Layout */}
      <div className="w-full max-w-md flex flex-col items-center justify-center my-auto gap-6 transition-all">
        
        {/* Core Pulsing Brain Circular Indicator */}
        <div className="relative">
          {/* Neon Glow Pink Loop */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border border-dashed border-[#FF4FD8]/25 border-t-[#FF4FD8] filter blur-[1px] shadow-[0_0_40px_rgba(255,79,216,0.1)]"
          />

          {/* Core Sparkle Center */}
          <div className="absolute inset-2 rounded-full bg-[#0D0D11] border border-white/5 flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: [0.93, 1.07, 0.93] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain size={28} className="text-[#C8FF5A] drop-shadow-[0_0_12px_#C8FF5A]" />
            </motion.div>
            <span className="text-[10px] font-mono font-bold text-white/40 mt-1">{progress}%</span>
          </div>
        </div>

        {/* Optimistic Status Display Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
            Creating your script...
          </h2>
          <p className="text-xs text-[#71717A] mt-1">
            Analyzing style markers, vocal presets and brand hooks
          </p>
        </div>

        {/* Coordinated Interactive Checklist Console */}
        <div className="w-full bg-[#08080C] rounded-2xl border border-white/5 p-4 space-y-3.5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FF4FD8]/5 to-transparent rounded-full pointer-events-none" />
          
          {checklist.map((step, idx) => {
            const isDone = progress >= step.percent;
            const isActive = progress >= (checklist[idx - 1]?.percent || 0) && progress < step.percent;
            const ProgressIcon = step.icon;

            return (
              <div 
                key={step.label}
                className={`flex items-center justify-between text-left transition-all duration-300 ${
                  isDone ? "opacity-100" : isActive ? "opacity-90 scale-[1.01]" : "opacity-30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg border transition-all ${
                    isDone 
                      ? "bg-[#C8FF5A]/10 border-[#C8FF5A]/20 text-[#C8FF5A]" 
                      : isActive 
                        ? "bg-[#FF4FD8]/10 border-[#FF4FD8]/20 text-[#FF4FD8] animate-pulse" 
                        : "bg-white/5 border-white/5 text-[#555]"
                  }`}>
                    <ProgressIcon size={14} />
                  </div>
                  <span className={`text-xs font-medium font-sans tracking-tight transition-colors ${
                    isDone ? "text-white/80 line-through decoration-white/10" : isActive ? "text-[#C8FF5A]" : "text-[#888]"
                  }`}>
                    {step.label}
                  </span>
                </div>

                <div className="flex items-center justify-center">
                  {isDone ? (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 bg-[#C8FF5A] rounded-full flex items-center justify-center"
                    >
                      <Check size={11} className="text-black stroke-[3px]" />
                    </motion.div>
                  ) : isActive ? (
                    <span className="text-[11px] text-[#FF4FD8] font-mono animate-bounce font-bold">⏳</span>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Shimmer Skeleton Script Preview Panel */}
        <div className="w-full bg-[#0E0E14]/40 rounded-2xl border border-white/5 p-4 shadow-xl text-left shimmer-active relative">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#FF4FD8]/60 uppercase tracking-widest block mb-1">
                Live Composing Hook
              </span>
              <div 
                className="h-3.5 bg-white/10 rounded-full transition-all duration-500" 
                style={{ width: progress > 20 ? '90%' : '30%', opacity: progress > 10 ? 1 : 0.2 }} 
              />
            </div>
            
            <div>
              <span className="text-[9px] font-mono font-bold text-[#A855F7]/60 uppercase tracking-widest block mb-1">
                Body Draft Stream
              </span>
              <div className="space-y-1.5">
                <div 
                  className="h-3 bg-white/15 rounded-full transition-all duration-500" 
                  style={{ width: progress > 45 ? '95%' : '45%', opacity: progress > 30 ? 1 : 0.2 }} 
                />
                <div 
                  className="h-3 bg-white/15 rounded-full transition-all duration-500" 
                  style={{ width: progress > 60 ? '80%' : '20%', opacity: progress > 45 ? 1 : 0.2 }} 
                />
              </div>
            </div>

            <div>
              <span className="text-[9px] font-mono font-bold text-[#C8FF5A]/60 uppercase tracking-widest block mb-1">
                CTA Conversion Anchor
              </span>
              <div 
                className="h-3 bg-[#C8FF5A]/25 rounded-full transition-all duration-500" 
                style={{ width: progress > 75 ? '70%' : '25%', opacity: progress > 65 ? 1 : 0.2 }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Track Controller */}
      <div className="w-full max-w-sm mb-4 flex flex-col gap-2">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-[#FF4FD8] via-[#A855F7] to-[#C8FF5A] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono text-[#71717A]">
          <span>SERVER AI SYNCHRONIZATION</span>
          <span>{payloadReady ? "DATA RECEIVED SUCCESSFULLY" : "STREAMING AI MATRIX..."}</span>
        </div>
      </div>
    </motion.div>
  );
}
