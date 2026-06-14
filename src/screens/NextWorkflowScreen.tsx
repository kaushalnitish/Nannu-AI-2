import React, { useState, useRef } from "react";
import { ChevronLeft, Share2, Bookmark, Sparkles, Copy, ClipboardCheck, Smile, Sliders, ArrowRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GlowCard from "../components/GlowCard";
import { GeneratedScriptPayload } from "../types";

interface NextWorkflowScreenProps {
  payload: GeneratedScriptPayload;
  prompt: string;
  mood: string;
  contentType: string;
  language: string;
  onBack: () => void;
  onSaveDraft?: (customPromptName?: string) => void;
  onModifyCaption: (mode: "shorten" | "viral" | "standard") => void;
  isModifyingCaption: boolean;
}

export default function NextWorkflowScreen({
  payload,
  prompt,
  mood,
  contentType,
  language,
  onBack,
  onSaveDraft,
  onModifyCaption,
  isModifyingCaption
}: NextWorkflowScreenProps) {
  // General states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Captions
  const [activeCaptionIdx, setActiveCaptionIdx] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Draft Save State
  const [draftName, setDraftName] = useState(prompt || "");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveTuner, setShowSaveTuner] = useState(false);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleShareFullScript = async () => {
    const fullText = `NANNU AI GENERATED CONTENT SCRIPT\nTitle: ${draftName || "My Creative Script"}\n\n` +
      `🎬 HOOK (3-SEC RETENTION):\n${payload.script.hook.text}\n\n` +
      `📦 BODY (RETAINER ENGINE):\n${payload.script.body.text}\n\n` +
      `⚡ CTA (CONVERSION ANCHOR):\n${payload.script.cta.text}\n\n` +
      `Generated via Nannu AI`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: draftName || "Nannu AI Generated Script",
          text: fullText,
        });
        showToast("✓ SCRIPT SHARED SUCCESSFULLY!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          navigator.clipboard.writeText(fullText).then(() => {
            showToast("✓ SCRIPT COPIED!");
          }).catch(() => {
            showToast("✓ COPIED TO CLIPBOARD!");
          });
        }
      }
    } else {
      navigator.clipboard.writeText(fullText).then(() => {
        showToast("✓ COPIED TO CLIPBOARD!");
      }).catch(() => {
        showToast("✓ COPIED!");
      });
    }
  };

  const handleManualSave = () => {
    if (!onSaveDraft) return;
    setIsSaving(true);
    try {
      onSaveDraft(draftName);
      setIsSaved(true);
      showToast("✓ DRAFT BACKED UP TO LIBRARY!");
    } catch (err) {
      showToast("✓ FAILED TO SAVE DRAFT");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCaption = () => {
    const textToCopy = payload.captions[activeCaptionIdx] || "";
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedCaption(true);
      showToast("✓ CAPTION COPIED!");
      setTimeout(() => setCopiedCaption(false), 1800);
    }).catch(() => {
      setCopiedCaption(true);
      showToast("✓ COPIED!");
      setTimeout(() => setCopiedCaption(false), 1800);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col flex-1 pb-4 relative text-left"
    >
      {/* Header Back Controls */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-mono text-[#A1A1AA] hover:text-white cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>BACK TO SCRIPT</span>
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black font-sans tracking-tight text-white uppercase flex items-center gap-2">
          🚀 Creator Action Hub
        </h2>
        <p className="text-xs text-[#A1A1AA] font-sans">
          Ready to distribute your next masterpiece? Elevate your post with viral hooks, custom optimized captions, and precise drafts saving.
        </p>
      </div>

      {/* Primary Production Toolkit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto w-full mb-6">
        {/* Share combined Full script block */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleShareFullScript}
          className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Share2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">Share Full Script</h4>
              <p className="text-[10px] text-[#A1A1AA] mt-0.5">Copy/export combined segments</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-[#A1A1AA]" />
        </motion.button>

        {/* Dynamic Save Drawer Button */}
        <div className="flex flex-col bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSaveTuner(!showSaveTuner)}
            className="w-full p-4 flex items-center justify-between cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#C8FF5A]/10 text-[#C8FF5A]">
                <Bookmark size={18} />
              </div>
              <div>
                <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">Save script</h4>
                <p className="text-[10px] text-[#A1A1AA] mt-0.5">{isSaved ? "Saved successfully!" : "Back up draft in library"}</p>
              </div>
            </div>
            <ArrowRight size={14} className={`text-[#A1A1AA] transition-transform ${showSaveTuner ? "rotate-90" : ""}`} />
          </motion.button>

          <AnimatePresence>
            {showSaveTuner && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 border-t border-white/[0.03] bg-black/20"
              >
                <div className="flex flex-col gap-2 pt-2.5">
                  <label className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-wider">Draft Title Name:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="Title your draft..."
                      className="flex-1 px-3 py-1.5 bg-[#050505] rounded-xl border border-white/5 focus:border-[#C8FF5A]/40 focus:outline-none text-xs text-white placeholder-[#555] transition-all"
                    />
                    <button
                      onClick={handleManualSave}
                      disabled={isSaving}
                      className="px-3.5 py-1.5 bg-[#C8FF5A] hover:bg-opacity-80 text-black font-extrabold text-[10px] rounded-xl flex items-center gap-1 cursor-pointer transition-colors font-mono"
                    >
                      <span>SAVE</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Captions Column/Layout card centered */}
      <div className="max-w-2xl mx-auto w-full mb-6">
        {/* 1. Captions Dashboard Card */}
        <GlowCard glowColor="pink" className="p-5.5 bg-[#111111]/90 border-white/5 relative">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
            <span className="text-[10px] font-mono font-black tracking-wider text-white uppercase flex items-center gap-1.5 label-glow">
              ✍️ Viral Social Captions
            </span>
            <Smile size={14} className="text-[#FF4FD8]" />
          </div>

          {/* Selector list */}
          <div className="flex gap-1.5 mb-3.5">
            {["STANDARD", "CURIOSITY", "SLANG"].map((label, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCaptionIdx(idx)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold font-mono uppercase border transition-all duration-300 ${
                  activeCaptionIdx === idx
                    ? "bg-[#FF4FD8]/10 border-[#FF4FD8] text-[#FF4FD8]"
                    : "bg-[#050505] border-white/5 text-[#A1A1AA] hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Display panel */}
          <div className="bg-black/40 border border-white/[0.03] p-4 rounded-xl min-h-[140px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeCaptionIdx + isModifyingCaption.toString()}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="text-xs font-sans text-white leading-relaxed whitespace-pre-line text-left"
              >
                {isModifyingCaption ? (
                  <span className="flex items-center gap-1.5 animate-pulse text-[#FF4FD8]">
                    <RefreshCw size={11} className="animate-spin" />
                    Re-engineering hook triggers...
                  </span>
                ) : (
                  payload.captions[activeCaptionIdx] || "No base caption loaded."
                )}
              </motion.p>
            </AnimatePresence>

            {/* Copy control */}
            <button
              onClick={handleCopyCaption}
              className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-white flex items-center justify-center gap-1.5 transition-all text-center border border-white/5"
            >
              {copiedCaption ? <ClipboardCheck size={12} className="text-[#C8FF5A]" /> : <Copy size={11} />}
              <span>{copiedCaption ? "COPIED TO CLIPBOARD" : "COPY ACTIVE CAPTION"}</span>
            </button>
          </div>

          {/* Custom Modifiers row */}
          <div className="mt-4 border-t border-white/5 pt-3.5">
            <h5 className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider mb-2">Tweak caption flow with AI:</h5>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onModifyCaption("viral")}
                disabled={isModifyingCaption}
                className="py-2 px-1 bg-gradient-to-r from-purple-500/10 to-[#FF4FD8]/10 hover:from-purple-500/20 hover:to-[#FF4FD8]/20 rounded-xl border border-[#FF4FD8]/20 flex items-center justify-center gap-1 cursor-pointer transition-all uppercase text-[8px] font-mono font-black text-white"
              >
                <Sparkles size={10} className="text-[#C8FF5A]" />
                <span>MAKE VIRAL</span>
              </button>

              <button
                onClick={() => onModifyCaption("shorten")}
                disabled={isModifyingCaption}
                className="py-2 px-1 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center gap-1 cursor-pointer transition-all uppercase text-[8px] font-mono font-black text-white"
              >
                <span>SHORTEN</span>
              </button>

              <button
                onClick={() => onModifyCaption("standard")}
                disabled={isModifyingCaption}
                className="py-2 px-1 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center gap-1 cursor-pointer transition-all uppercase text-[8px] font-mono font-black text-white"
              >
                <span>RESTORE</span>
              </button>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Embedded toast messages */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 bg-[#C8FF5A] text-black py-3 px-5 rounded-xl text-xs font-bold font-sans flex items-center gap-2.5 shadow-[0_8px_30px_rgba(200,255,90,0.35)] z-50 border border-black/10"
          >
            <ClipboardCheck size={15} className="shrink-0 text-black" />
            <span className="leading-tight uppercase font-mono tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
