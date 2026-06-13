import React, { useState, useRef } from "react";
import { ChevronLeft, Share2, Bookmark, Clapperboard, Sparkles, Copy, ClipboardCheck, Heading, Image, Trash2, Eye, LayoutGrid, AlertTriangle, ArrowRight, UploadCloud, RefreshCw, Smile, Camera, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GlowCard from "../components/GlowCard";
import TeleprompterOverlay from "../components/TeleprompterOverlay";
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

interface PromptResult {
  title: string;
  concept: string;
  composition: string;
  expression: string;
  lighting: string;
  textOverlay: string;
  imagePrompt: string;
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
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  // Captions
  const [activeCaptionIdx, setActiveCaptionIdx] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Original Thumbnails Carousel
  const [selectedThumbIdx, setSelectedThumbIdx] = useState(0);
  const [copiedThumb, setCopiedThumb] = useState<string | null>(null);

  // Draft Save State
  const [draftName, setDraftName] = useState(prompt || "");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveTuner, setShowSaveTuner] = useState(false);

  // --- New Thumbnail Prompt Generator States ---
  const [withRefImages, setWithRefImages] = useState(false);
  const [userInstructions, setUserInstructions] = useState("");
  const [uploadedImages, setUploadedImages] = useState<{ file?: File; data: string; name: string }[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptResults, setPromptResults] = useState<PromptResult[] | null>(null);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<number | null>(null);
  const [activePromptIdx, setActivePromptIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setTimeout(() => {
      onSaveDraft(draftName);
      setIsSaving(false);
      setIsSaved(true);
      setShowSaveTuner(false);
      showToast("✓ DRAFT RETRIVED & BACKED UP!");
      setTimeout(() => setIsSaved(false), 3500);
    }, 800);
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

  const handleCopyThumbText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedThumb(key);
      showToast("✓ THUMBNAIL TEXT COPIED!");
      setTimeout(() => setCopiedThumb(null), 1500);
    }).catch(() => {
      setCopiedThumb(key);
      showToast("✓ COPIED!");
      setTimeout(() => setCopiedThumb(null), 1500);
    });
  };

  const handleCopyPayloadPrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPromptIdx(idx);
      showToast("✓ AI PROMPT COPIED!");
      setTimeout(() => setCopiedPromptIdx(null), 1800);
    }).catch(() => {
      setCopiedPromptIdx(idx);
      showToast("✓ COPIED!");
      setTimeout(() => setCopiedPromptIdx(null), 1100);
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processImageFiles(Array.from(files));
  };

  const processImageFiles = (files: File[]) => {
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        showToast("✓ PLEASE UPLOAD IMAGES ONLY");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setUploadedImages((prev) => [
            ...prev,
            { file, data: dataUrl, name: file.name }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerGeneratePrompts = async () => {
    setIsGeneratingPrompts(true);
    setPromptsError(null);
    setPromptResults(null);

    try {
      const rawApiUrl = (import.meta.env.VITE_API_URL || "");
      const apiBase = (rawApiUrl === "MY_APP_URL" || !rawApiUrl.startsWith("http")) ? "" : rawApiUrl.replace(/\/$/, "");

      const reqBody = {
        hook: payload.script.hook.text,
        body: payload.script.body.text,
        cta: payload.script.cta.text,
        instructions: userInstructions,
        images: withRefImages ? uploadedImages.map((img) => ({ data: img.data, mimeType: img.file?.type })) : []
      };

      const res = await fetch(`${apiBase}/api/generate-thumbnail-prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) {
        throw new Error(`Failed to generate high-quality thumbnail prompts with status code ${res.status}`);
      }

      const data = await res.json();
      if (data && Array.isArray(data.prompts)) {
        setPromptResults(data.prompts);
        showToast("✓ PROMPTS GENERATED SUCCESSFULLY!");
      } else {
        throw new Error("Invalid response format received from prompt engineer system.");
      }
    } catch (err: any) {
      console.error(err);
      setPromptsError(err.message || "An unexpected system-level error occurred during prompt generation.");
      // Standard local fallback so the system is robust
      const localFallback: PromptResult[] = [
        {
          title: "Ultimate Retention Formula",
          concept: "Dark sleek slate background, centered high contrast floating glowing key graphic",
          composition: "Symmetrical medium shot, absolute focus on glowing typography",
          expression: "Bold confident stare holding the camera's focus completely",
          lighting: "Cyber neon purple from sides, soft white key illuminating front",
          textOverlay: "Top center bold white: 'THIS WORKS IN 3 SECONDS'",
          imagePrompt: "A sleek luxury workspace, dark granite table, glowing neon rods, cinematic look, shallow depth of field, 8k hyperrealism"
        },
        {
          title: "The Creator Breakthrough",
          concept: "Minimal concrete wall with neon lighting bars illuminating text from underneath",
          composition: "Rule of thirds, concrete beam positioned in upper section with raw textures",
          expression: "Calm, deeply visionary look pointing directly at key metrics",
          lighting: "Dramatic warm summer afternoon key light throwing geometric shadows on wall",
          textOverlay: "Slightly offset yellow: 'QUIT COMPLICATING STUFF'",
          imagePrompt: "Architectural concrete block environment, golden hour dynamic rays, minimalist luxury studio aesthetic, professional photography style"
        },
        {
          title: "The Silent Loop Game",
          concept: "Split screen: left side holds retro abstract sketches, right side has clean minimal mockups",
          composition: "Split layout 50-50, sharp division lines",
          expression: "Expressive shock, hands at cheeks looking directly at contrast line",
          lighting: "High brightness flat daylight studio profile",
          textOverlay: "Bottom yellow stripe: 'THE REAL LOOP REVEALED'",
          imagePrompt: "Graphic design clean workspace board, collage style framing, hand holding vintage markers, aesthetic stationery, soft workspace backlight"
        }
      ];
      setPromptResults(localFallback);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const mockCovers = [
    "from-[#FF4FD8]/15 via-[#111111] to-[#050505]",
    "from-[#A855F7]/15 via-[#111111] to-[#050505]",
    "from-[#C8FF5A]/5 via-[#111111] to-[#050505]"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col flex-1 pb-24 relative text-left"
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

      {/* Screen Title */}
      <div className="mb-6 border-b border-white/5 pb-4">
        <h2 className="text-2xl font-black font-sans tracking-tight text-white uppercase">Creator Action Hub</h2>
        <p className="text-xs text-[#A1A1AA] font-sans">
          Finalize distribution assets, polish copy, practice speaking, and prepare viral visual prompts.
        </p>
      </div>

      {/* Primary Production Toolkit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Teleprompter Practicing Option Block */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowTeleprompter(true)}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FF4FD8]/15 to-transparent border border-[#FF4FD8]/20 hover:border-[#FF4FD8]/40 hover:from-[#FF4FD8]/25 rounded-2xl cursor-pointer text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FF4FD8] to-violet-600 text-white shadow-md">
              <Clapperboard size={18} />
            </div>
            <div>
              <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">Start Teleprompter</h4>
              <p className="text-[10px] text-[#A1A1AA] mt-0.5">Practice delivery with dynamic glass</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-[#A1A1AA]" />
        </motion.button>

        {/* Share combined Full script block */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleShareFullScript}
          className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mb-6">
        {/* LEFT COLUMN: Captions & Original Thumbnails (7 cols) */}
        <div className="lg:col-span-6 space-y-5">
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

          {/* 2. Original script-generated Thumbnail Concepts (Showcase) */}
          <GlowCard glowColor="green" className="p-5.5 bg-[#111111]/90 border-white/5">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
              <span className="text-[10px] font-mono font-black tracking-wider text-white uppercase flex items-center gap-1.5 label-glow">
                💡 Base Thumbnail Concepts
              </span>
              <LayoutGrid size={14} className="text-[#C8FF5A]" />
            </div>

            {/* Showcase Visual Cover Panel */}
            <div className="relative h-44 rounded-2xl overflow-hidden border border-white/5 bg-[#050505] p-5 flex flex-col justify-between mb-4">
              <div className={`absolute inset-0 bg-gradient-to-b ${mockCovers[selectedThumbIdx % mockCovers.length]} pointer-events-none transition-all duration-500`} />
              <div className="relative flex justify-between items-center text-[7px] font-mono tracking-widest text-[#71717A] uppercase font-bold">
                <span>NANNU SYSTEMS</span>
                <span>LAYOUT #{selectedThumbIdx + 1}</span>
              </div>
              <div className="relative text-left my-auto px-3 py-2 border-l border-[#C8FF5A] z-10 bg-black/40 backdrop-blur-sm rounded-r-xl">
                <span className="text-[8px] font-mono text-[#C8FF5A] tracking-wider uppercase block mb-0.5">TEXT LAYOUT</span>
                <p className="text-xs font-sans font-bold text-white uppercase leading-snug">
                  {payload.thumbnails[selectedThumbIdx]?.title || "Viral content secret unlocked"}
                </p>
              </div>
              <div className="relative flex justify-between items-center text-[8px] font-mono text-[#71717A] z-10">
                <span className="bg-black/50 px-1.5 py-0.5 rounded border border-white/5">DESIGN: CLEAN SLATE</span>
                <span>9:16</span>
              </div>
            </div>

            {/* Concepts List Picker */}
            <div className="space-y-2">
              {payload.thumbnails.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedThumbIdx(idx)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    selectedThumbIdx === idx
                      ? "bg-[#111111] border-[#C8FF5A]/40"
                      : "bg-[#050505] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="max-w-[78%]">
                    <span className="text-[8px] font-mono uppercase text-[#A1A1AA] block mb-1">Concept {idx + 1}</span>
                    <strong className="text-xs text-white uppercase block leading-snug mb-1">"{t.title}"</strong>
                    <p className="text-[10px] text-[#71717A] leading-normal">{t.description}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyThumbText(t.title, `t-${idx}`);
                    }}
                    className="p-1 px-2 rounded-md bg-white/5 hover:bg-white/10 text-[8px] font-mono text-white tracking-wider"
                  >
                    {copiedThumb === `t-${idx}` ? "COPIED" : "COPY TEXT"}
                  </button>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>

        {/* RIGHT COLUMN: AI Thumbnail Prompt Generator (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          <GlowCard glowColor="purple" className="p-5.5 bg-[#111111]/90 border-white/5 relative">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
              <span className="text-[10px] font-mono font-black tracking-wider text-white uppercase flex items-center gap-1.5 label-glow">
                ⚡ Creator Advanced Prompt Generator
              </span>
              <Sparkles size={14} className="text-[#A855F7] animate-pulse" />
            </div>
            
            <p className="text-[11px] text-[#A1A1AA] leading-normal mb-4 font-sans">
              Instantly engineer 3 detailed visual prompts custom-tailored for Midjourney/Imagen based on your script, reference images, and optional style guidance.
            </p>

            <div className="space-y-4">
              {/* Toggle: Generate with Reference Images */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <h4 className="text-xs font-mono font-extrabold text-white uppercase tracking-wider">Reference Image Input</h4>
                  <p className="text-[10px] text-[#71717A] leading-none mt-0.5">Analyze personal style, likeness, and setting</p>
                </div>
                <button
                  onClick={() => setWithRefImages(!withRefImages)}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-all outline-none flex ${
                    withRefImages ? "bg-[#C8FF5A] justify-end" : "bg-white/10 justify-start"
                  }`}
                >
                  <motion.div layout className="w-5.5 h-5.5 rounded-full bg-black shadow" />
                </button>
              </div>

              {/* Collapsible reference uploader */}
              {withRefImages && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 bg-black/20 p-3.5 rounded-xl border border-white/5 overflow-hidden"
                >
                  {/* Drag-and-drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-white/10 hover:border-[#C8FF5A]/30 rounded-xl py-5 px-3 flex flex-col items-center justify-center gap-1.5 bg-black/30 cursor-pointer transition-all hover:bg-black/50 text-center"
                  >
                    <UploadCloud size={20} className="text-[#A855F7]" />
                    <span className="text-[10px] font-mono font-black uppercase text-white tracking-widest leading-none">Upload Reference Images</span>
                    <span className="text-[8px] text-[#71717A] leading-none">Supports PNG, JPG, WebP. Click or Drag Here</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Previews panel */}
                  {uploadedImages.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider block">Uploaded references ({uploadedImages.length}):</span>
                      <div className="flex flex-wrap gap-2">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 group">
                            <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeUploadedImage(idx)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Text Instructions */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider">Style Instructions (Optional):</label>
                <textarea
                  value={userInstructions}
                  onChange={(e) => setUserInstructions(e.target.value)}
                  placeholder="e.g., Cyberpunk noir theme, high depth of field, model looking extremely surprised, luxury orange studio elements..."
                  className="w-full bg-[#050505] rounded-xl border border-white/5 focus:border-[#A855F7]/40 focus:outline-none p-3.5 text-xs text-white font-sans placeholder-[#444] min-h-[75px] resize-none transition-all duration-300"
                />
              </div>

              {/* Action trigger button */}
              <button
                onClick={triggerGeneratePrompts}
                disabled={isGeneratingPrompts || (withRefImages && uploadedImages.length === 0)}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-[#A855F7] to-[#FF4FD8] hover:brightness-110 active:scale-[0.99] text-white font-mono font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] flex items-center justify-center gap-2.5 ${
                  isGeneratingPrompts || (withRefImages && uploadedImages.length === 0) ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isGeneratingPrompts ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-[#C8FF5A]" />
                    <span className="animate-pulse">Analyzing references & writing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-[#C8FF5A] animate-pulse" />
                    <span>Generate Thumbnail Prompts</span>
                  </>
                )}
              </button>
            </div>

            {/* Interactive Loading and Skeleton State */}
            {isGeneratingPrompts && (
              <div className="mt-5 p-5 bg-black/40 border border-[#A855F7]/20 rounded-2xl flex flex-col items-center justify-center text-center py-8">
                <RefreshCw size={24} className="text-[#C8FF5A] animate-spin mb-3" />
                <span className="text-xs font-mono uppercase font-bold text-white tracking-widest animate-pulse">Running Visual Engine</span>
                <p className="text-[10px] text-[#71717A] leading-normal max-w-xs mt-1.5 font-sans">
                  Analyzing scripts, merging reference likeness indices, and formulating high-conversion prompt markers. This might take up to 2 seconds.
                </p>
              </div>
            )}

            {/* Error Indicator */}
            {promptsError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-sans text-red-400 flex items-start gap-1.5">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{promptsError}</span>
              </div>
            )}

            {/* Prompts Results displays */}
            {promptResults && (
              <div className="mt-5 space-y-4 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#C8FF5A] uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                    🎯 Engineer Prompts Generated
                  </span>
                  <span className="text-[8px] font-mono bg-white/5 px-2 py-0.5 rounded text-[#71717A]">PROMPTS FOR IMAGEN / MIDJOURNEY</span>
                </div>

                {/* Sub-selector tabs */}
                <div className="flex gap-1">
                  {promptResults.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePromptIdx(idx)}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold font-mono uppercase border transition-colors ${
                        activePromptIdx === idx
                          ? "bg-[#A855F7]/10 border-[#A855F7] text-white"
                          : "bg-[#050505] border-white/5 text-[#71717A]"
                      }`}
                    >
                      PROPOSAL {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Selected Prompt detail card */}
                {promptResults[activePromptIdx] && (
                  <motion.div
                    key={activePromptIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-[#050505]/40 border border-white/[0.03] space-y-3 font-sans text-left"
                  >
                    <div>
                      <span className="text-[8px] font-mono text-[#A855F7] uppercase tracking-widest font-black block">Title / Concept Accent</span>
                      <h4 className="text-xs font-bold text-white uppercase mt-0.5">"{promptResults[activePromptIdx].title}"</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-[10px] leading-relaxed select-text mt-1">
                      <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.02]">
                        <span className="text-[7.5px] font-mono text-[#71717A] uppercase tracking-wider block font-bold">Concept</span>
                        <p className="text-white/80 mt-0.5">{promptResults[activePromptIdx].concept}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.02]">
                        <span className="text-[7.5px] font-mono text-[#71717A] uppercase tracking-wider block font-bold">Composition</span>
                        <p className="text-white/80 mt-0.5">{promptResults[activePromptIdx].composition}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.02]">
                        <span className="text-[7.5px] font-mono text-[#71717A] uppercase tracking-wider block font-bold">Expression</span>
                        <p className="text-white/80 mt-0.5">{promptResults[activePromptIdx].expression}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.02]">
                        <span className="text-[7.5px] font-mono text-[#71717A] uppercase tracking-wider block font-bold">Lighting</span>
                        <p className="text-white/80 mt-0.5">{promptResults[activePromptIdx].lighting}</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/[0.01] border border-white/[0.02] text-[10px]">
                      <span className="text-[7.5px] font-mono text-[#71717A] uppercase tracking-wider block font-bold">Overlay Text suggestion</span>
                      <p className="text-xs font-bold text-[#C8FF5A] uppercase mt-0.5">{promptResults[activePromptIdx].textOverlay}</p>
                    </div>

                    {/* Copyable prompt box */}
                    <div className="p-3 bg-black rounded-xl border border-white/5 relative group select-text mt-2 hover:border-[#A855F7]/30 transition-all">
                      <span className="text-[7.5px] font-mono text-white/30 uppercase tracking-widest block font-bold">Full Image Generation Prompt</span>
                      <p className="text-[10px] text-white/90 leading-relaxed font-sans pr-14 mt-1 italic">
                        {promptResults[activePromptIdx].imagePrompt}
                      </p>
                      <button
                        onClick={() => handleCopyPayloadPrompt(promptResults[activePromptIdx].imagePrompt, activePromptIdx)}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] hover:text-white transition-all cursor-pointer flex items-center justify-center"
                        title="Copy prompt"
                      >
                        {copiedPromptIdx === activePromptIdx ? <ClipboardCheck size={12} className="text-[#C8FF5A]" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </GlowCard>
        </div>
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

      {/* Teleprompter practices panel overlay */}
      <AnimatePresence>
        {showTeleprompter && (
          <TeleprompterOverlay
            hook={payload.script.hook.text}
            body={payload.script.body.text}
            cta={payload.script.cta.text}
            title={draftName || "My Viral Creation"}
            onClose={() => setShowTeleprompter(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
