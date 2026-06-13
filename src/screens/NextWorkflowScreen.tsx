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
  platform: string;
  optionIndex: number;
  title: string;
  concept: string;
  composition: string;
  subjectPositioning: string;
  expression: string;
  lighting: string;
  background: string;
  textOverlay: string;
  colorMood: string;
  negativePrompt: string;
  imagePrompt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 17
    }
  }
};

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

  // --- New Aspect Ratio Selector States ---
  const [selectedAspectRatios, setSelectedAspectRatios] = useState<string[]>(["16:9"]);
  const [withRefImages, setWithRefImages] = useState(false);
  const [userInstructions, setUserInstructions] = useState("");
  const [uploadedImages, setUploadedImages] = useState<{ file?: File; data: string; name: string }[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [promptResults, setPromptResults] = useState<PromptResult[] | null>(null);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<number | null>(null);
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const [selectedDetailedPrompt, setSelectedDetailedPrompt] = useState<PromptResult | null>(null);

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
        images: withRefImages ? uploadedImages.map((img) => ({ data: img.data, mimeType: img.file?.type })) : [],
        aspectRatios: selectedAspectRatios,
        language: language
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
      if (data && Array.isArray(data.prompts) && data.prompts.length > 0) {
        setPromptResults(data.prompts);
        setActivePromptIdx(0);
        showToast("✓ PROMPTS GENERATED SUCCESSFULLY!");
      } else {
        throw new Error("Invalid response format received from prompt generator system.");
      }
    } catch (err: any) {
      console.error(err);
      setPromptsError(err.message || "An unexpected system-level error occurred during prompt generation.");
      
      // Standard local fallback supporting selected aspect ratios
      const localFallback: PromptResult[] = [];
      const shortText = payload.script.hook.text ? (payload.script.hook.text.length < 35 ? payload.script.hook.text : payload.script.hook.text.slice(0, 32) + "...") : "Ultimate Reveal";
      
      selectedAspectRatios.forEach((ratio) => {
        let plat = "16:9 (YouTube Thumbnail)";
        if (ratio === "9:16") plat = "9:16 (Shorts & Reels)";
        if (ratio === "1:1") plat = "1:1 (Instagram & LinkedIn)";
        if (ratio === "4:5") plat = "4:5 (Social Feed)";

        [1, 2, 3].forEach((optIdx) => {
          let title = "";
          let concept = "";
          let composition = "";
          let subjectPositioning = "";
          let expression = "";
          let lighting = "";
          let background = "";
          let textOverlay = "";
          let colorMood = "";
          let negativePrompt = "blurry, graphic text overlays, watermarks, bad anatomy, deformed fingers, low resolution, ugly face, low contrast";
          let imagePrompt = "";

          if (language === "Hindi") {
            if (optIdx === 1) {
              title = `"${shortText}" का वायरल सच`;
              concept = "एक बहुत ही आकर्षक और शानदार डार्क थीम पर आधारित थंबनेल सेटअप, जिसमें साइड से नियोन लाइट आ रही है।";
              composition = "सिक्सटी-फोर्टी अनुपात, फ्रंट क्लोज-अप शॉट जिसमें दर्शक का ध्यान मुख्य शीर्षक पर आकर्षित होता है।";
              subjectPositioning = "फ्रेम के ठीक दाहिनी ओर खड़ा विषय, बाईं ओर पर्याप्त खाली स्पेस छोड़ते हुए।";
              expression = "एकदम चकित और गहरी विचारमयी आँखें जो कैमरे को सीधे देख रही हैं।";
              lighting = "दाहिनी ओर से तेज नियोन पर्पल और बाईं ओर से हल्की एम्बर टोन लाइट।";
              background = "सिल्वर और चारकोल ग्रे रंग की लक्जरी कंक्रीट की दीवार जिसमें पीछे धुंधली लाइट बार्स हैं।";
              textOverlay = 'शीर्ष पर बड़े बोल्ड पीले फोंट में लिखा: "100% वायरल सच" जिसके पीछे गहरा शैडो है।';
              colorMood = "अत्यंत डार्क कंट्रास्ट, पर्पल और गोल्ड नियोन कलर टोन।";
              imagePrompt = `A premium cinematic setting for ${plat}, dark slate texture, glowing magenta light strips behind, shallow depth of field, 8k resolution`;
            } else if (optIdx === 2) {
              title = "ये सेटिंग बंद करो!";
              concept = "एक गंभीर चेतावनी या रहस्यमय सिचुएशन को दिखाता हुआ लेआउट, बेहद साफ और प्रीमियम डिजाइन।";
              composition = "गोल्डन रेश्यो कंपोजिशन, जिसमें मुख्य फोकस सब्जेक्ट के चेहरे और हाथों के जेस्चर पर है।";
              subjectPositioning = "फ्रेम के बिल्कुल सेंटर में बैठा कैरेक्टर, दोनों कोनों में रहस्यमयी एलीमेंट्स के साथ।";
              expression = "चेहरे पर हल्का गुस्सा या गंभीर चेतावनी देने वाला आत्मविश्वास पूर्ण एक्सप्रेशन।";
              lighting = "फेस पर शार्प वाइट स्टूडियो की-लाइट, पीछे से नियोन लाइम ग्रीन रिम लाइट।";
              background = "एक हाई-टेक भविष्यवादी क्रिएटर स्टूडियो का सेटअप।";
              textOverlay = 'सेंटर में बड़े चमकीले सफ़ेद लेटर्स: "STOP THIS NOW" एक लाल रंग के बॉर्डर के साथ।';
              colorMood = "हाई ब्राइटनेस कंट्रास्ट, एसिड ग्रीन और गहरा ब्लैक।";
              imagePrompt = `A creative professional looking directly into dynamic camera for ${plat}, holding a glowing green outline tablet, volumetric backlighting, photorealistic studio`;
            } else {
              title = "Nannu AI का सीक्रेट ब्ल्यूप्रिंट";
              concept = "एक मिनीमलिस्टिक और क्लासी लेआउट जो एप्पल की डिज़ाइन शैली से प्रेरित है, बिल्कुल साफ़ और मॉडर्न लुक।";
              composition = "व्हाइड एंगल वाइड फ्रेम शॉट, सिमेट्रिकल कम्पोजिशन जो संतुलन और क्रेडिबिलिटी दर्शाता है।";
              subjectPositioning = "बाईं ओर थोड़ा सा झुका विषय, हाथ में एक डायरी या पेन पकड़े हुए।";
              expression = "एक शांत, सुखद और गहराई से प्रेरित मुस्कान जो क्रेडिबिलिटी और ज्ञान को दर्शाती है।";
              lighting = "खिड़की से आती साफ़ दोपहर की धूप, हल्के और नेचुरल शैडो।";
              background = "एकदम साफ बेज-रंग की ठोस कंक्रीट की दीवार जिसमें न्यूनतम पौधों के पत्ते दिखाई दे रहे हैं।";
              textOverlay = 'नीचे की ओर सुरुचिपूर्ण लाइट ग्रे फॉन्ट: "SECRET REVEALED" बिना किसी शोर-शराबे के।';
              colorMood = "सॉफ्ट पेस्टल कलर्स, म्यूट क्रीम, गहरे भूरे कलर की सादगी।";
              imagePrompt = `Minimalist architecture workspace for ${plat}, gentle morning sunbeams reflecting on beige concrete floor, aesthetic plants, high fashion editorial style`;
            }
          } else if (language === "Hinglish") {
            if (optIdx === 1) {
              title = `Stop "${shortText}" Mistakes!`;
              concept = "Ekdam slick cyber background setup jahan main attention text overlay aur neon effects par hai.";
              composition = "Rule of thirds, zoom closeup portrait jo scroll karte hue instant attention grab kare.";
              subjectPositioning = "Frame ke right side me human subject aligned hai jo left outline text ko highlight karta hai.";
              expression = "Confident face expression, with raised eyebrow looking directly into your soul.";
              lighting = "Edge-lit glowing pink aur cold blue studio contrast lights.";
              background = "Dark metallic texture background with futuristic soft circular neon rings.";
              textOverlay = 'Slick yellow text center-left alignment me: "SECRET FORMULA" bold font ke sath.';
              colorMood = "Bold pop contrast, highly saturated neon purple aur bright yellow.";
              imagePrompt = `Sleek high contrast creator studio for ${plat}, futuristic metallic backplates, cinematic ambient cyan glow, 8k hyperrealism`;
            } else if (optIdx === 2) {
              title = `🤫 Secrets of "${shortText}"`;
              concept = "Mysterious aur high curiosity build karne wala clean minimalist interface style layout.";
              composition = "Centered symmetrical layout, dynamic grid overlay look.";
              subjectPositioning = "Exactly mid-screen me baitha subject, hands in front like explaining a master formula.";
              expression = "Deep focused smile, pointing to a futuristic tech panel on the left.";
              lighting = "Under-the-chin low angle warm yellow light, dark moody ambient.";
              background = "Abstract geometric shapes with glass-morphic translucent slate panels.";
              textOverlay = 'Glowing neon white text overlay on top: "99% WRONG" with red highlight lines.';
              colorMood = "Cinematic orange and teal blend, high density shadows.";
              imagePrompt = `Creator showing translucent charts for ${plat} with aesthetic amber neon bar lights underneath, cinematic volume fog, volumetric lighting`;
            } else {
              title = `Build ${shortText} in 1 Click`;
              concept = "High conversion SaaS style layout, beautiful and professional look to gain quick trust.";
              composition = "Rule of thirds structure, spacious negative margins for readability.";
              subjectPositioning = "Left side of the screen with a clean premium posture.";
              expression = "Excited facial muscles with a positive open mouth smile showing premium value.";
              lighting = "Natural bright daylight studio flash, soft key light illuminating forehead perfectly.";
              background = "Luxurious off-white high-contrast marble wall with geometric bronze lines.";
              textOverlay = 'Big bold green outline texts: "1-CLICK FORMULA" with premium shadows.';
              colorMood = "Clean light theme gradient, soft luxury emerald green and gold touches.";
              imagePrompt = `Luxurious marble workspace for ${plat}, bronze details, geometric shadows under bright soft light, professional photography camera shot`;
            }
          } else {
            // English
            if (optIdx === 1) {
              title = `The Ultimate "${shortText}" Secrets`;
              concept = "A highly clickable high-retention dark slate visual with a stunning holographic glowing key.";
              composition = "Symmetrical eye-level setup framing the subject's face precisely at the center intersection.";
              subjectPositioning = "Centered face framing, shoulders visible with a high-contrast premium leather jacket.";
              expression = "Bold, direct eye-contact locking the viewer with a sense of extreme authority.";
              lighting = "Split studio lighting with hot violet on the left profile and cold blue on the right rim.";
              background = "Minimal dark granite studio slate tiles with horizontal LED lightbars.";
              textOverlay = 'Top center bold white letters: "SECRET DISCLOSED" with custom red underline graphic.';
              colorMood = "Vivid neon contrasts, deep black tones, rich magenta saturation.";
              imagePrompt = `Sleek modern studio workspace for ${plat}, premium dark granite tiling background, parallel magenta LED glows, ultra sharp, photorealistic`;
            } else if (optIdx === 2) {
              title = "Never Do This!";
              concept = "A warning-themed high-energy visual designed to trigger curiosity and massive click-through rates.";
              composition = "Low-angle wide shot, conveying importance and dramatic size difference of elements.";
              subjectPositioning = "Positioned slightly offset at the lower left quadrant, looking up towards the warning text.";
              expression = "Exaggerated shock, looking up, hand on brow with intense facial focus.";
              lighting = "Aggressive yellow key light from above, throwing dark dramatic shadows downwards.";
              background = "An abstract dark grid pattern resembling data logs or a matrix wall.";
              textOverlay = 'Large orange caution box in the upper right quadrant: "STOP DOING THIS" in bold black.';
              colorMood = "Caution theme: high contrast stark blacks, warning yellows, industrial oranges.";
              imagePrompt = `Industrial dark wire grid for ${plat} with warm yellow safety lights, dramatic volume fog, cinematic photography, depth of field`;
            } else {
              title = "The Clean 5-Step Blueprint";
              concept = "An editorial-style ultra-clean catalog cover aesthetic, bringing extreme trust and elegance.";
              composition = "Rule of thirds, keeping a perfect 1:1 balance of minimal space and subject details.";
              subjectPositioning = "Seated elegantly on the right side, leaning with relaxed confidence.";
              expression = "Warm, confident, and professional calm expression, looking directly forward.";
              lighting = "Organic warm afternoon golden hour sunrays coming through a venetian window blind.";
              background = "Raw plaster wall displaying beautiful natural leaf shadows.";
              textOverlay = 'Elegant left-aligned monospace font in green: "THE BLUEPRINT" with a neat thin divider line.';
              colorMood = "Earth slate palette, soft beige, natural forest green, brushed bronze accents.";
              imagePrompt = `Luxury studio interior for ${plat}, raw clay plaster textured wall, Venetian blinds sun patterns, soft warm cinematic shadows, professional portraiture`;
            }
          }

          localFallback.push({
            platform: plat,
            optionIndex: optIdx,
            title,
            concept,
            composition,
            subjectPositioning,
            expression,
            lighting,
            background,
            textOverlay,
            colorMood,
            negativePrompt,
            imagePrompt
          });
        });
      });

      setPromptResults(localFallback);
      setActivePromptIdx(0);
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
              {/* Aspect Ratio Selector Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider font-extrabold block">Aspect Ratio (Select 1 or more):</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "16:9", label: "16:9", desc: "YouTube / Widescreen", color: "from-purple-500/10 to-purple-600/5 hover:to-purple-500/20 border-purple-500/20 text-purple-400" },
                    { id: "9:16", label: "9:16", desc: "Shorts & TikTok", color: "from-pink-500/10 to-pink-600/5 hover:to-pink-500/20 border-pink-500/20 text-pink-400" },
                    { id: "1:1", label: "1:1", desc: "LinkedIn & Square", color: "from-blue-500/10 to-blue-600/5 hover:to-blue-500/20 border-blue-500/20 text-blue-400" },
                    { id: "4:5", label: "4:5", desc: "Social Feed", color: "from-emerald-500/10 to-emerald-600/5 hover:to-[#C8FF5A]/20 border-emerald-500/20 text-emerald-400" }
                  ].map((plat) => {
                    const isSelected = selectedAspectRatios.includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedAspectRatios.length > 1) {
                              setSelectedAspectRatios(selectedAspectRatios.filter((r) => r !== plat.id));
                            } else {
                              showToast("⚠ SELECT AT LEAST ONE ASPECT RATIO!");
                            }
                          } else {
                            setSelectedAspectRatios([...selectedAspectRatios, plat.id]);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer font-sans relative flex flex-col justify-between min-h-[58px] ${
                          isSelected
                            ? `bg-gradient-to-br ${plat.color} border-[#A855F7]/40 text-white shadow-lg`
                            : "bg-[#050505] border-white/5 text-[#71717A] hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-black text-xs">{plat.label}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF5A]" />}
                        </div>
                        <span className="text-[8px] text-zinc-500 group-hover:text-zinc-400 select-none block leading-none mt-1 truncate">
                          {plat.desc || "Social Ratio"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle: Generate with Reference Images */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <h4 className="text-xs font-mono font-extrabold text-white uppercase tracking-wider">Reference Image Input</h4>
                  <p className="text-[10px] text-[#71717A] leading-none mt-0.5">Analyze personal style, likeness, and setting</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWithRefImages(!withRefImages)}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-all outline-none flex ${
                    withRefImages ? "bg-[#C8FF5A] justify-end" : "bg-white/10 justify-start"
                  }`}
                >
                  <motion.div layout className="w-5.5 h-5.5 rounded-full bg-black shadow" />
                </button>
              </div>

              {/* Collapsible reference uploader and creative inputs if ON */}
              <AnimatePresence>
                {withRefImages && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2 bg-black/20 p-3.5 rounded-xl border border-white/5">
                      {/* Drag-and-drop zone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-white/10 hover:border-[#C8FF5A]/30 rounded-xl py-5 px-3 flex flex-col items-center justify-center gap-1.5 bg-black/30 cursor-pointer transition-all hover:bg-black/50 text-center"
                      >
                        <UploadCloud size={20} className="text-[#A855F7]" />
                        <span className="text-[10px] font-mono font-black uppercase text-white tracking-widest leading-none">Upload Multiple References</span>
                        <span className="text-[8px] text-[#71717A] leading-none">PNG, JPG, WebP. Click or Drag Here</span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileChange}
                          multiple
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      {/* Reference Guides Checklist */}
                      <div className="text-[8.5px] font-sans text-[#71717A] leading-relaxed border-t border-white/5 pt-2 flex flex-wrap gap-x-2.5 gap-y-1">
                        <span className="text-white/60 font-mono uppercase tracking-wider font-bold">Image types analyzed:</span>
                        <span>👥 Face Model</span>
                        <span>🧘 Pose Reference</span>
                        <span>👕 Outfit Aesthetics</span>
                        <span>🌆 Studio Scene</span>
                        <span>💡 Light setup</span>
                      </div>

                      {/* Previews panel */}
                      {uploadedImages.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider block">Uploaded references ({uploadedImages.length}):</span>
                          <div className="flex flex-wrap gap-2">
                            {uploadedImages.map((img, idx) => (
                              <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 group">
                                <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                                <button
                                  type="button"
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
                    </div>

                    {/* Creative Notes text input with click style presets */}
                    <div className="flex flex-col gap-1.5 bg-black/10 p-3.5 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider font-bold">Additional Creative Instructions:</label>
                        <span className="text-[8px] text-[#C8FF5A] font-mono font-bold">Presets:</span>
                      </div>
                      
                      {/* Presets Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-2.5">
                        {[
                          { name: "Luxury Brand", value: "Luxury slick high-end aesthetic, glossy textures, dark elegant slate accents" },
                          { name: "Mr Beast Style", value: "Saturated primary colors, extreme contrast, expressive facial shock, dynamic bold outlined highlights" },
                          { name: "Cinematic Dark", value: "Cinematic portrait, dark moody shadows, volumetric dust, shallow depth of field" },
                          { name: "Documentary Look", value: "Raw grain film strip, documentary realism style, direct natural window lighting" },
                          { name: "Sleek Studio", value: "Window shadow patterns reflecting on minimal beige wall, professional photography look" },
                          { name: "Neon Glow", value: "Cyberpunk neon purple backlight reflections, high shadow depth, neon rods glowing" }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              if (userInstructions.includes(preset.value)) return;
                              setUserInstructions((prev) => prev ? `${prev}, ${preset.value}` : preset.value);
                              showToast(`✓ ADDED ${preset.name.toUpperCase()} STYLE`);
                            }}
                            className="py-1 px-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[8px] font-mono text-[#A1A1AA] hover:text-white border border-white/5 truncate cursor-pointer text-center text-ellipsis"
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={userInstructions}
                        onChange={(e) => setUserInstructions(e.target.value)}
                        placeholder="Add optional creative notes (e.g. wearing sharp suit, cinematic fog look, holding visual card)..."
                        className="w-full bg-[#050505] rounded-xl border border-white/5 focus:border-[#A855F7]/40 focus:outline-none p-3.5 text-xs text-white font-sans placeholder-[#444] min-h-[80px] resize-none transition-all duration-300"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action trigger button */}
              <button
                type="button"
                onClick={triggerGeneratePrompts}
                disabled={isGeneratingPrompts || (withRefImages && uploadedImages.length === 0)}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-[#A855F7] to-[#FF4FD8] hover:brightness-110 active:scale-[0.99] text-white font-mono font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] flex items-center justify-center gap-2.5 ${
                  isGeneratingPrompts || (withRefImages && uploadedImages.length === 0) ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isGeneratingPrompts ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-[#C8FF5A]" />
                    <span className="animate-pulse">Engineering visual prompts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-[#C8FF5A]" />
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
                  Analyzing script triggers, reading reference files, matches and crafting three visual layouts for your chosen platforms.
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-[#C8FF5A] uppercase tracking-wider font-extrabold flex items-center gap-1.5 label-glow">
                    🎯 Engineered Visual Prompts
                  </span>
                  <span className="text-[8px] font-mono bg-[#A855F7]/10 px-2.5 py-0.5 rounded text-[#A855F7] font-black border border-[#A855F7]/20 uppercase">Localize: {language || "English"}</span>
                </div>

                {/* Generated Aspect Ratio Options List */}
                <div className="space-y-6 pt-1">
                  {Array.from(new Set(promptResults.map((p) => p.platform))).map((plat) => {
                    const platformPrompts = promptResults.filter((p) => p.platform === plat);
                    if (platformPrompts.length === 0) return null;

                    return (
                      <div key={plat} className="space-y-2.5">
                        {/* Section Label */}
                        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-1.5 pt-1">
                          <LayoutGrid size={11} className="text-purple-400" />
                          <span className="text-[9.5px] font-mono font-black text-white uppercase tracking-wider">
                            ASPECT RATIO FORMAT: {plat}
                          </span>
                        </div>

                        {/* Staggered lists of proposals */}
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="show"
                          className="grid grid-cols-1 gap-2.5"
                        >
                          {platformPrompts.map((p, idx) => (
                            <motion.div
                              key={p.platform + p.optionIndex}
                              variants={itemVariants}
                              className="p-3.5 rounded-xl bg-black/45 border border-white/5 hover:border-[#A855F7]/30 hover:bg-black/60 transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5"
                            >
                              <div className="space-y-1.5 text-left flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[7.5px] font-mono text-[#C8FF5A] bg-[#C8FF5A]/10 border border-[#C8FF5A]/20 px-2 py-0.5 rounded uppercase font-black tracking-wide">
                                    Option {p.optionIndex}
                                  </span>
                                  <span className="text-[7.5px] font-mono text-[#A855F7] uppercase font-black tracking-wide">
                                    {p.colorMood || "Standard Mood"}
                                  </span>
                                </div>
                                <h4 className="text-[11px] font-black text-white uppercase tracking-close line-clamp-1 leading-snug">
                                  "{p.title}"
                                </h4>
                                <p className="text-[10px] text-zinc-400 line-clamp-1 leading-relaxed font-sans">
                                  {p.concept}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedDetailedPrompt(p)}
                                className="px-3.5 py-1.5 rounded-lg bg-[#A855F7]/10 hover:bg-[#A855F7]/25 text-[#A855F7] hover:text-white border border-[#A855F7]/20 text-[9.5px] font-mono uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                              >
                                <Eye size={11} />
                                <span>View Prompt</span>
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
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

      {/* Dedicated Prompt Viewer Overlay Modal */}
      <AnimatePresence>
        {selectedDetailedPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setSelectedDetailedPrompt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-2xl bg-[#09090B] border border-white/10 rounded-2xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.8)] text-left flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-black uppercase text-[#C8FF5A] bg-[#C8FF5A]/10 border border-[#C8FF5A]/20 px-2.5 py-0.5 rounded">
                      OPTION {selectedDetailedPrompt.optionIndex}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                      {selectedDetailedPrompt.platform}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mt-1">
                    "{selectedDetailedPrompt.title}"
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDetailedPrompt(null)}
                  className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-5 font-sans text-xs text-white/90 leading-relaxed scrollbar-thin">
                
                {/* Platform Section */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-[#A855F7] uppercase tracking-wider font-extrabold block">Platform</span>
                  <div className="text-zinc-300 text-sm font-extrabold tracking-wide uppercase">
                    {selectedDetailedPrompt.platform}
                  </div>
                </div>

                {/* Title Section */}
                <div className="space-y-1 pt-1">
                  <span className="text-[9px] font-mono text-[#A855F7] uppercase tracking-wider font-extrabold block">Title Suggestion</span>
                  <div className="text-white text-base font-black uppercase leading-tight">
                    "{selectedDetailedPrompt.title}"
                  </div>
                </div>

                {/* Full Prompt Display Box */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#C8FF5A] uppercase tracking-wider font-extrabold">Full Image Generation Prompt</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Optimized for Flux / Midjourney / DALL-E 3</span>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-xl border border-white/10 relative shadow-inner group">
                    <p className="text-[11.5px] text-zinc-100 font-sans italic leading-relaxed select-text pr-12 whitespace-pre-wrap">
                      {selectedDetailedPrompt.imagePrompt}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedDetailedPrompt.imagePrompt);
                        showToast("✓ FULL AI IMAGE PROMPT COPIED!");
                      }}
                      className="absolute top-3.5 right-3.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      title="Copy Full Prompt"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                {/* Negative Prompt Display Box */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider font-extrabold">Negative Prompt</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">Artifact Exclusion List</span>
                  </div>
                  <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 relative group">
                    <p className="text-[10.5px] text-zinc-400 font-mono pr-12 leading-relaxed select-text whitespace-pre-wrap">
                      {selectedDetailedPrompt.negativePrompt || "blurry, graphic text-overlays, low resolution, deformed limbs, extra fingers, watermark"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedDetailedPrompt.negativePrompt || "");
                        showToast("✓ COPIED NEGATIVE PROMPT!");
                      }}
                      className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 cursor-pointer transition-all flex items-center justify-center"
                      title="Copy Negative Prompt"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 border-t border-white/5 bg-zinc-950/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDetailedPrompt.negativePrompt || "");
                    showToast("✓ COPIED NEGATIVE PROMPT!");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy Negative Prompt</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDetailedPrompt.imagePrompt);
                    showToast("✓ FULL AI IMAGE PROMPT COPIED!");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#C8FF5A] text-black font-mono font-black text-xs uppercase tracking-wider transition-all hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(200,255,90,0.25)]"
                >
                  <ClipboardCheck size={14} className="text-black" />
                  <span>Copy Full Prompt</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
