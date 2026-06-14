import { useState, useEffect, useMemo, useRef } from "react";
import { Copy, Sparkles, RefreshCw, ChevronLeft, ArrowRight, Eye, ClipboardCheck, Edit3, Check, Brain, Share2, Clapperboard, Layers, Sliders, Play, Smile } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeneratedScriptPayload } from "../types";
import GlowCard from "../components/GlowCard";
import { trackCopyAction, trackReadingDuration, trackEditAction, getPreferenceProfileString, logAnalyticsEvent } from "../utils/preferences";

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  emoji?: string;
  delay: number;
}

interface ScriptScreenProps {
  payload: GeneratedScriptPayload;
  prompt: string;
  onBack: () => void;
  onNavigateToNext: () => void; // Proceed to post-script hub
  onOpenCreatorDirector: () => void; // Open the dedicated director screen
  onRegenerate: () => void;
  isRegenerating: boolean;
  mood?: string;
  contentType?: string;
  language?: string;
  duration?: string;
  onEditScriptText?: (tab: "hook" | "body" | "cta", newText: string) => void;
}

// Global script section card component with local state
function ScriptSectionCard({
  tab,
  badge,
  text,
  action,
  mood = "Confident 😎",
  contentType = "Talking Head",
  prompt = "",
  onEdit
}: {
  tab: "hook" | "body" | "cta";
  badge: string;
  text: string;
  action: string;
  mood?: string;
  contentType?: string;
  prompt?: string;
  onEdit?: (tab: "hook" | "body" | "cta", newText: string) => void;
}) {
  const [editText, setEditText] = useState(text);
  const [isEditing, setIsEditing] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showPolish, setShowPolish] = useState(false);
  const [polishedVariations, setPolishedVariations] = useState<string[] | null>(null);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditText(text);
  }, [text]);

  const handleApply = () => {
    if (onEdit && text !== editText) {
      onEdit(tab, editText);
    }
    setIsEditing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      trackCopyAction({ prompt, mood, contentType });
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handlePolish = async () => {
    setIsPolishing(true);
    setPolishError(null);
    setPolishedVariations(null);
    setShowPolish(true);

    try {
      const prefsStr = getPreferenceProfileString();
      const rawApiUrl = (import.meta.env.VITE_API_URL || "");
      const apiBase = (rawApiUrl === "MY_APP_URL" || !rawApiUrl.startsWith("http")) ? "" : rawApiUrl.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/polish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentText: text,
          preferences: prefsStr,
          prompt,
          contentType,
          mood
        })
      });

      const responseText = await res.text();
      if (!res.ok) {
        throw new Error(`Failed to load suggestions: ${res.status}`);
      }

      const data = JSON.parse(responseText);
      if (data && Array.isArray(data.variations)) {
        setPolishedVariations(data.variations);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.warn("Polish failed. Falling back to dynamic client options.");
      const fallback = [
        `Adjusted Tone (Punchy Style): "${text.substring(0, Math.min(text.length, 30))}... Let's cut straight to the point!"`,
        `Alternative Conversational Hook: "Here is the exact truth on how I solved ${prompt || "this problem"}."`,
        `High-Retention Dynamic Format: "If you want to achieve results, stop doing things the hard way."`
      ];
      setPolishedVariations(fallback);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <GlowCard glowColor="none" className="p-5.5 bg-[#111111]/95 border-white/5 shadow-xl relative min-h-[190px] flex flex-col justify-between mb-4">
      {/* Top action bar of the section card */}
      <div className="flex items-center justify-between mb-3.5 border-b border-white/[0.03] pb-2.5">
        <span className="text-[9px] font-mono tracking-widest uppercase bg-white/5 col-glow-green px-2 py-0.75 rounded border border-white/5 text-[#A1A1AA] font-bold">
          {badge}
        </span>
        <button
          onClick={copyToClipboard}
          className="p-1 px-2.5 rounded-lg bg-white/5 border border-white/5 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-[9px] font-mono font-black"
        >
          {copied ? <ClipboardCheck size={11} className="text-[#C8FF5A]" /> : <Copy size={11} />}
          <span>{copied ? "COPIED" : "COPY SECTION"}</span>
        </button>
      </div>

      {/* Main body: Spoken Script line & directions */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-mono text-[#555] uppercase tracking-wider font-extrabold">
            Spoken Script Line:
          </h4>
          <button
            onClick={() => {
              if (isEditing) {
                handleApply();
              } else {
                setIsEditing(true);
              }
            }}
            className="text-[10px] font-mono font-bold text-[#FF4FD8] hover:brightness-110 flex items-center gap-1 cursor-pointer transition-all bg-white/5 py-0.5 px-1.5 rounded border border-white/5"
          >
            {isEditing ? (
              <>
                <Check size={11} />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 size={11} />
                <span>Edit Inline</span>
              </>
            )}
          </button>
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleApply}
              autoFocus
              className="w-full min-h-[100px] bg-black/40 text-sm leading-relaxed text-white p-3.5 rounded-xl border border-[#FF4FD8]/40 focus:border-[#FF4FD8]/80 focus:outline-none font-sans resize-none transition-all text-left"
            />
          </div>
        ) : (
          <p
            onClick={() => setIsEditing(true)}
            className="text-sm font-semibold text-white leading-relaxed font-sans cursor-text hover:bg-white/[0.01]/70 p-2 rounded border border-transparent hover:border-white/5 transition-all text-left"
          >
            {text}
          </p>
        )}
      </div>

      {/* Visual Directions / Actions */}
      {action && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.01]/40 border border-white/[0.02]/80 text-left">
          <span className="text-[8px] font-mono text-[#C8FF5A] uppercase tracking-wider block font-black mb-1">VISUAL & SFX DIRECTION:</span>
          <p className="text-xs text-[#A1A1AA]/80 italic leading-normal font-sans pl-1 border-l border-white/5">{action}</p>
        </div>
      )}

      {/* Suggest Polish trigger block */}
      <div>
        <button
          onClick={handlePolish}
          disabled={isPolishing}
          className="w-full py-2.5 px-3 rounded-xl bg-black/30 hover:bg-white/5 border border-white/5 hover:border-white/10 text-white font-black text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-widest font-mono shadow-sm"
        >
          {isPolishing ? (
            <>
              <RefreshCw size={11} className="text-[#C8FF5A] animate-spin" />
              <span className="animate-pulse">Loading AI polish...</span>
            </>
          ) : (
            <>
              <Sparkles size={11} className="text-[#C8FF5A] animate-pulse" />
              <span>Suggest AI voice polish</span>
            </>
          )}
        </button>

        <AnimatePresence>
          {showPolish && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="p-3.5 bg-[#050505]/90 border border-white/5 rounded-xl space-y-2 text-left">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5 mb-1.5">
                  <span className="text-[8px] font-mono text-[#A1A1AA] uppercase tracking-widest font-black">AI Speech Variations</span>
                  <button onClick={() => setShowPolish(false)} className="text-[8px] font-mono text-[#A1A1AA] hover:text-white uppercase leading-none">Close</button>
                </div>

                {isPolishing ? (
                  <div className="py-4 flex flex-col items-center justify-center gap-1.5">
                    <RefreshCw size={12} className="text-[#FF4FD8] animate-spin" />
                    <span className="text-[8px] font-mono text-white/30 tracking-wider">Calibrating filters...</span>
                  </div>
                ) : polishError ? (
                  <p className="text-[10px] text-red-400">{polishError}</p>
                ) : (
                  <div className="space-y-2">
                    {polishedVariations?.map((variant, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          if (onEdit) onEdit(tab, variant);
                          setEditText(variant);
                          setShowPolish(false);
                          trackEditAction({ prompt, mood, contentType });
                        }}
                        className="p-3 bg-[#050505] hover:bg-[#FF4FD8]/5 border border-white/5 hover:border-[#FF4FD8]/20 rounded-lg cursor-pointer transition-all text-left group relative"
                      >
                        <div className="absolute top-2 right-2 border border-white/5 rounded px-1 text-[6.5px] font-mono text-[#FF4FD8] uppercase font-black opacity-0 group-hover:opacity-100 transition-opacity">Select</div>
                        <span className="text-[7.5px] font-mono text-[#FF4FD8] uppercase tracking-wider block font-extrabold mb-1">Variant {index + 1}</span>
                        <p className="text-xs text-[#E1E1E6] font-sans leading-relaxed pr-10">{variant}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlowCard>
  );
}

// Dynamic Creator Action Guide Component
interface CreatorActionGuideProps {
  prompt: string;
  mood: string;
  contentType: string;
  language?: string;
  hookText: string;
  bodyText: string;
  ctaText: string;
}

const CreatorActionGuideDetails = ({
  prompt,
  mood,
  contentType,
  language = "English",
  hookText,
  bodyText,
  ctaText
}: CreatorActionGuideProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(0);
  const [guide, setGuide] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch or generate dynamic guide
  useEffect(() => {
    let active = true;
    const fetchGuide = async () => {
      setIsLoading(true);
      try {
        const rawApiUrl = (import.meta.env.VITE_API_URL || "");
        const apiBase = (rawApiUrl === "MY_APP_URL" || !rawApiUrl.startsWith("http")) ? "" : rawApiUrl.replace(/\/$/, "");

        const res = await fetch(`${apiBase}/api/generate-guide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hook: hookText,
            body: bodyText,
            cta: ctaText,
            language,
            contentType,
            mood,
            prompt
          })
        });

        if (!res.ok) throw new Error();
        const data = await res.json();
        if (active && data && Array.isArray(data.guide)) {
          setGuide(data.guide);
        } else {
          throw new Error("Invalid response format or fallback signal");
        }
      } catch (err) {
        console.warn("Dynamic guide API failed, calculating offline dynamic localized playbook.");
        if (!active) return;

        // HIGH QUALITY NATIVE LANGUAGE FALLBACK GENERATOR
        const topic = prompt || "viral content";
        const isHindi = language === "Hindi";
        const isHinglish = language === "Hinglish";

        let localPlaybook: any[] = [];

        if (isHindi) {
          localPlaybook = [
            {
              title: "१. कैमरा सेटअप (Camera Setup)",
              description: `कैमरे का अलाइनमेंट सीधे आँखों पर रखें। ${contentType} के लिए बिल्कुल सुव्यवस्थित सेट सुनिश्चित करें।`,
              bullets: [
                "चेहरे पर अच्छी रौशनी के लिए रिंग लाइट या खिड़की के सीधे सामने खड़े होकर रिकॉर्ड करें।",
                "फ्रेम को थोड़ा खुला रखें ताकि आपके हाथ के इशारे (gestures) रिकॉर्ड हो सकें।",
                "हमेशा 4K / 30fps या फुलHD 1080p पर रिकॉर्ड करें ताकि सबटाइटल्स एकदम साफ दिखें।"
              ]
            },
            {
              title: "२. अभिनय शैली (Acting & Delivery)",
              description: `शानदार प्रभाव डालने के लिए अपनी बोलने की गती नियंत्रित करें और आत्मविश्वास से भरपूर रहें।`,
              bullets: [
                "मुख्य पॉइंट बताने से ठीक पहले १.५ सेकंड का एक छोटा पॉज (Pause) लेकर उत्सुकता बढ़ाएं।",
                "साधारण बातचीत वाली गहरी फ्रेंडली टोन अपनाएं - जैसे किसी दोस्त से बात कर रहे हों।",
                "Filler शब्द जैसे 'अम', 'उह', 'मतलब' बोलने से पूरी तरह बचें।"
              ]
            },
            {
              title: "३. सीन सुझाव (Scene Suggestions)",
              description: `वीडियो की विज़ुअल मोनोटनी को तोड़ने के लिए बीच-बीच में एंगल बदलने का प्रयास करें।`,
              bullets: [
                "सीन १ (Hook): कैमरा के बिलकुल पास रहें और सीढ़ी नज़र (Eye-Lock) बनाए रखें।",
                "सीन २ (Body): थोड़ा पीछे हटकर या साइड एंगल लेकर अपनी बात विस्तार से स्पष्ट करें।",
                "सीन ३ (CTA): चेहरे पर मुस्कराहट के साथ स्क्रीन के निचले कोने की ओर इशारा करते हुए बात कहें।"
              ]
            },
            {
              title: "४. सहायक फुटेज (B-Roll Ideas)",
              description: `दर्शकों को बोरियत से बचाने के लिए बातचीत के ऊपर सहायक शॉट्स का उपयोग करें।`,
              bullets: [
                "अपने कम्प्यूटर पर टाइप करने या नोट्स लिखने का एक प्यारा क्लोज-अप शॉट लगाएं।",
                "जब आप समस्या की बात कर रहे हों, तब स्क्रीन पर एनिमेटेड की-वर्ड्स फ्लैश करें।",
                "पूरी बातचीत में हल्का रिलैक्स संगीत (वॉल्यूम -२६dB) बैकग्राउंड में जरूर चालू रखें।"
              ]
            },
            {
              title: "५. संपादन ट्रिक्स (Editing Suggestions)",
              description: `जम्प कट्स का उपयोग करके वीडियो से खाली समय और सांस लेने की आवाज़ पूरी तरह अलग करें।`,
              bullets: [
                "वीडियो के खाली हिस्सों (Dead air) को काट कर वीडियो तेज और चुस्त बनाएं।",
                "स्क्रीन के ठीक बीच में बड़े तथा गहरे रंग के सबटाइटल्स (पीला या आसमानी) लगाएं।",
                "अंत के शब्द को पहले शब्द से मिला दें ताकि वीडियो एक अंतहीन लूप (infinite rewind loop) जैसा दिखे।"
              ]
            },
            {
              title: "६. रिटेंशन टिप्स (Retention Tips)",
              description: `शुरुआती कुछ सेकंड्स में अत्यधिक एनर्जी दिखाकर दर्शकों को स्क्रॉल करने से रोकें।`,
              bullets: [
                "वीडियो की शुरुआत कभी भी 'मेरा नाम है' या 'हेलो फ्रेंड्स' से न करें, सीधे मुख्य सवाल पर आएं।",
                "वीडियो के मध्य भाग में लगातार जिज्ञासा (Curiosity Gap) बनाए रखें (जैसे 'लेकिन असली सीक्रेट ये है...)।",
                "सीटीए को बहुत छोटा रखें ताकि लोग बोर होकर वीडियो बीच में ही बंद न करें।"
              ]
            }
          ];
        } else if (isHinglish) {
          localPlaybook = [
            {
              title: "1. Studio Camera Setup",
              description: `Video framing ko clear rakhein. Camera lens exact eye level pe match karein taaki prompt "${topic}" ke liye solid engagement create ho.`,
              bullets: [
                "Face pe solid lighting key-source rakhein, dark circles ya shadows bilkul avoid karein.",
                "Frame thoda open rakhein taaki body language and hand gestures clean capture ho sakein.",
                "Resolution humesha 1080p 60fps ya 4K set rakhein seamless captions display ke liye."
              ]
            },
            {
              title: "2. Voice Acting & Delivery",
              description: `Full energy aur flow ke sath deliver karein. Apni speaking speed normal and impactful rakhein.`,
              bullets: [
                "Sabse important hook line se pehle ek brief 1.5-second ka solid transition pause lein.",
                "Friendly conversational tone use karein, video informative aur authentic lagna chahiye.",
                "Fumble aur repetitive filler words (um, uh, actually) micro-cuts me eliminate karke clear sound karein."
              ]
            },
            {
              title: "3. Interactive Scene Cuts",
              description: `Retention maintain rakhne ke liye humesha dynamic angle adjustments perform karein.`,
              bullets: [
                "Scene 1: Hook bolte time direct center eye-contact and physical close-up use karein.",
                "Scene 2: Detail discussion karte waqt space visual slides side me overlay karein.",
                "Scene 3: Finish direct indicator gesture ke sath smiling face screen hold."
              ]
            },
            {
              title: "4. Aesthetic B-Roll Overlays",
              description: `Screen visual quality enrich karne ke liye talking scene ke sath supplemental detailed clips run kijiye.`,
              bullets: [
                "Laptop typing, drawing table ya direct working environment ka fast macro capture trim karein.",
                "Key points explain karte time floating bright highlighted fonts drop kijiye.",
                "Studio high value build karne ke liye low volume ambient b-roll sound effects (whoosh, hit) select karein."
              ]
            },
            {
              title: "5. High Retention Editing",
              description: `Sharp jump-cuts, rapid zoom triggers aur visual pops compile karein.`,
              bullets: [
                "Speech ke gaps aur breathing pauses ko aggressive trim lagayein.",
                "Screen center me yellow, cyan ya white bold subtitle text drop karein.",
                "Rewind logic follow kijiye loop optimization ke liye taaki repeat watch sessions increase ho sku."
              ]
            },
            {
              title: "6. Advanced Retention Tips",
              description: `Audience session span maintain rkhne ke liye metrics-backed triggers use karein.`,
              bullets: [
                "Intro ya formal naming block drop karein seedhe main target lines se start karein.",
                "Mid section me curiosity gap release kijiye taaki drop-off curves clear out ho sakein.",
                "CTA lines ko instant action trigger se direct sync rakhein comments loop increase krne ke liye."
              ]
            }
          ];
        } else {
          // English Fallback
          localPlaybook = [
            {
              title: "1. Camera Setup",
              description: `Establish premium short-form framing. Set up your camera lens precisely at eye level for "${topic}".`,
              bullets: [
                "Arrange a beautiful main light offset 45 degrees for classic, premium shading.",
                "Configure framing using the standard 'Rule of Thirds' line grids with eyes in upper third.",
                "Ensure subtle background blur to separate you cleanly from background noise."
              ]
            },
            {
              title: "2. Acting & Delivery",
              description: `Command digital authority and speak with natural pacing. Adapt your voice warmth to the content mood.`,
              bullets: [
                "Use intentional 1.5-second pauses directly before delivering critical plot twists.",
                "Maintain positive posture, keeping an encouraging smile explained in detail.",
                "Speak at approximately 150-160 words-per-minute for modern short-form sweet-spot."
              ]
            },
            {
              title: "3. Scene Suggestions",
              description: `Break the visual monotony with alternating setups that support the progression of "${topic}".`,
              bullets: [
                "Scene 1: Main studio area with a soft ambient background for opening hook lines.",
                "Scene 2: Shift to 30-degree side profile shot or screen screengrabs showing blueprint metrics.",
                "Scene 3: Direct close-up with intense camera gaze to close the story outline."
              ]
            },
            {
              title: "4. B-Roll & Visual Ideas",
              description: `Maintain high short-form visual velocity using aesthetic macro detail clips.`,
              bullets: [
                "Cinematic close-up of keyboard typing or scratching notes on clean aesthetic papers.",
                "Micro screen captures navigating dashboards or graphics overlays.",
                "Bold animated keyword tags floating in the center of the video canvas."
              ]
            },
            {
              title: "5. Editing Suggestions",
              description: `Modern high-converting video styling using jump cuts, SFX, and zoom-ins.`,
              bullets: [
                "Micro-crop all speech gaps, deep breaths, and empty air frames immediately.",
                "Style central auto-captions in high-contrast yellow or glowing green fonts.",
                "Sync sound effects (whooshes, page turns) precisely along the graphic shifts."
              ]
            },
            {
              title: "6. Retention Tips",
              description: `Proven hooks and curiosity metrics to keep retention curves high.`,
              bullets: [
                "Skip standard self-introducing frames completely. Hit hard triggers inside the first 2 seconds.",
                "Establish visual loops and curiosity gaps before providing answers.",
                "Keep close interactions light and end immediately on the last spoken syllable to capture loops."
              ]
            }
          ];
        }

        setGuide(localPlaybook);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchGuide();
    return () => { active = false; };
  }, [hookText, bodyText, ctaText, language, contentType, mood, prompt]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between p-4.5 bg-[#111111] border border-white/5 rounded-2xl cursor-pointer text-[#A1A1AA] hover:text-white transition-all font-mono text-xs uppercase"
      >
        <span>Show Creator Action Guide</span>
        <Sliders size={15} />
      </button>
    );
  }

  return (
    <GlowCard id="creator-guide-card" glowColor="purple" className="p-5 bg-gradient-to-tr from-[#111111]/95 via-[#111111]/90 to-transparent border-white/5 select-none relative z-10 text-left mt-6">
      {/* Header controls inside card */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <span className="text-[10px] font-mono font-black tracking-wider text-white uppercase flex items-center gap-1.5 label-glow">
          🎬 AI Dynamic Creator Action Guide
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[9px] font-mono text-[#71717A] hover:text-[#A1A1AA] uppercase font-bold cursor-pointer"
        >
          Hide Guide
        </button>
      </div>

      <p className="text-[10px] text-[#A1A1AA] leading-normal font-sans mb-4">
        Analyze script language ({language}) and tone to generate tailored directives for camera, performance, and video editing.
      </p>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2">
          <RefreshCw size={20} className="text-[#C8FF5A] animate-spin" />
          <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-widest animate-pulse">
            Formulating playbook formulas...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* List panel */}
          <div className="md:col-span-4 flex flex-col gap-1.5 border-r border-white/[0.03] pr-2.5">
            {guide?.map((sec, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={`py-2 px-3 rounded-lg text-[9px] font-bold font-mono uppercase text-left transition-all border ${
                  activeSection === i
                    ? "bg-[#C8FF5A]/10 border-[#C8FF5A]/40 text-[#C8FF5A]"
                    : "bg-transparent border-transparent hover:bg-white/5 text-[#A1A1AA] hover:text-white"
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          {/* Details viewport */}
          <div className="md:col-span-8">
            {activeSection !== null && guide && guide[activeSection] && (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-3"
              >
                <div className="bg-white/[0.01]/70 p-3 rounded-lg border border-white/[0.03] pl-3.5 border-l-2 border-[#FF4FD8]">
                  <p className="text-[11px] text-[#E1E1E6] leading-relaxed italic font-sans">
                    {guide[activeSection].description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-1 text-left">
                  {guide[activeSection].bullets.map((bulletStr: string, idx: number) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className="w-4 h-4 bg-[#C8FF5A]/10 border border-[#C8FF5A]/35 text-[#C8FF5A] flex items-center justify-center shrink-0 rounded text-[9px] font-mono font-bold mt-0.5">
                        ✓
                      </div>
                      <span className="text-[11px] font-sans text-[#71717A]/95 group-hover:text-[#A1A1AA] transition-colors leading-relaxed select-text font-medium text-left text-[#A1A1AA]/90">
                        {bulletStr}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </GlowCard>
  );
};

export default function ScriptScreen({
  payload,
  prompt,
  onBack,
  onNavigateToNext,
  onOpenCreatorDirector,
  onRegenerate,
  isRegenerating,
  mood = "Confident 😎",
  contentType = "Talking Head",
  language = "English",
  duration = "45 sec",
  onEditScriptText
}: ScriptScreenProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const [celebrate, setCelebrate] = useState(true);

  // Helper formatter
  const formatSecondsToDurationStringLocal = (sec: number): string => {
    if (sec < 60) {
      return `${sec} sec`;
    }
    const mins = Math.floor(sec / 60);
    const leftSecs = sec % 60;
    if (leftSecs === 0) {
      return `${mins} min`;
    }
    return `${mins}m ${leftSecs.toString().padStart(2, "0")}s`;
  };

  // Live word-count-based Speaking Time calculation
  const estSpeakingTimeSeconds = useMemo(() => {
    const combinedText = `${payload.script.hook.text} ${payload.script.body.text} ${payload.script.cta.text}`;
    const wordCount = combinedText.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(wordCount / 2.35));
  }, [payload.script.hook.text, payload.script.body.text, payload.script.cta.text]);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Background Reading Timer is kept here
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = Math.round(elapsedMs / 1000);
      if (elapsedSec > 0) {
        trackReadingDuration(elapsedSec, { prompt, mood, contentType });
      }
    };
  }, [prompt, mood, contentType]);

  // Dismiss celebrate confetti particle burst after 3.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setCelebrate(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const confettiParticles = useMemo(() => {
    const colors = ["#FF4FD8", "#A855F7", "#C8FF5A", "#3B82F6", "#F59E0B"];
    const emojis = ["✨", "🔥", "🎉", "⚡", "🚀", "🤫", "🎓", "🌟"];

    return Array.from({ length: 42 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 150 + 50;
      const destinationX = Math.cos(angle) * distance;
      const destinationY = Math.sin(angle) * distance + (Math.random() * 70 + 30);

      return {
        id: i,
        x: destinationX,
        y: destinationY,
        rotation: Math.random() * 720 - 360,
        color: colors[i % colors.length],
        size: Math.random() * 6 + 4,
        emoji: i % 8 === 0 ? emojis[Math.floor(Math.random() * emojis.length)] : undefined,
        delay: Math.random() * 0.1
      };
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex flex-col flex-1 pb-4 relative"
    >
      {/* Celebration Confetti */}
      <AnimatePresence>
        {celebrate && (
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.4, 2] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#FF4FD8]/20 via-[#A855F7]/10 to-[#C8FF5A]/10 blur-3xl pointer-events-none"
            />

            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0, 1.3, 0.8, 0],
                  rotate: p.rotation,
                  opacity: [0, 1, 0.8, 0],
                }}
                transition={{
                  duration: 2.2,
                  ease: "easeOut",
                  delay: p.delay,
                }}
                className="absolute flex items-center justify-center"
              >
                {p.emoji ? (
                  <span className="text-xl leading-none select-none">{p.emoji}</span>
                ) : (
                  <div
                    className="rounded-full shadow-md"
                    style={{
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.color,
                      boxShadow: `0 0 10px ${p.color}`,
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Header controls */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-mono text-[#A1A1AA] hover:text-white cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>BACK TO EDITOR</span>
        </button>

        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1 text-xs font-mono text-[#FF4FD8] hover:text-[#FF4FD8]/80 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
          <span>REGENERATE SCRIPT</span>
        </button>
      </div>

      {/* Screen Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-black font-sans tracking-tight text-white uppercase">Your Script is Live</h2>
          <p className="text-xs text-[#A1A1AA] font-sans">
            Refine your continuous script layout, then proceed to the Creator Hub dashboard.
          </p>
        </div>
      </div>

      {/* Duration Accuracy Validation HUD Card */}
      <div className="grid grid-cols-2 gap-4 mb-6 select-none">
        <div className="p-4 bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col justify-between text-left">
          <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-widest block mb-1">
            ⏱️ Selected Duration
          </span>
          <span className="text-xs font-mono font-black text-white hover:text-[#C8FF5A] transition-colors uppercase">
            {duration}
          </span>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col justify-between text-left">
          <span className="text-[9px] font-mono text-[#A1A1AA] uppercase tracking-widest block mb-1">
            🗣️ Estimated Speaking Time
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono font-black text-[#C8FF5A] uppercase">
              {formatSecondsToDurationStringLocal(estSpeakingTimeSeconds)}
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#C8FF5A]/10 text-[#C8FF5A] border border-[#C8FF5A]/30 shrink-0 font-bold">
              ±10% Target
            </span>
          </div>
        </div>
      </div>

      {payload.isFallback && (
        <div className="mb-5 p-3.5 bg-gradient-to-r from-[#FFBE1A]/10 via-[#FFBE1A]/5 to-transparent border-l-2 border-[#FFBE1A] rounded-r-xl select-none animate-pulse text-left">
          <p className="text-xs font-black text-[#FFBE1A] font-sans flex items-center gap-1.5 uppercase tracking-wide">
            <span>⚠️ DEMO GENERATOR ACTIVE</span>
          </p>
          <p className="text-[10px] text-white/70 font-sans mt-0.5 leading-relaxed">
            API key missing or rate-limited. Nannu's local high-fidelity creator brain has crafted this custom script with Hinglish/Hindi dialect support.
          </p>
        </div>
      )}

      {/* Continuous Document Flow: HOOK -> BODY -> CTA */}
      <div className="space-y-4">
        {/* HOOK Card */}
        <ScriptSectionCard
          tab="hook"
          badge="HOOK (3-SEC RETENTION)"
          text={payload.script.hook.text}
          action={payload.script.hook.action}
          mood={mood}
          contentType={contentType}
          prompt={prompt}
          onEdit={onEditScriptText}
        />

        {/* BODY Card */}
        <ScriptSectionCard
          tab="body"
          badge="BODY (RETAINER ENGINE)"
          text={payload.script.body.text}
          action={payload.script.body.action}
          mood={mood}
          contentType={contentType}
          prompt={prompt}
          onEdit={onEditScriptText}
        />

        {/* CTA Card */}
        <ScriptSectionCard
          tab="cta"
          badge="CTA (CONVERSION ANCHOR)"
          text={payload.script.cta.text}
          action={payload.script.cta.action}
          mood={mood}
          contentType={contentType}
          prompt={prompt}
          onEdit={onEditScriptText}
        />
      </div>

      {/* Script Action Center */}
      <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3.5 text-center sm:text-left select-none">
        <div>
          <span className="text-[9px] font-mono font-black uppercase text-[#FF4FD8] tracking-widest block">Script Tools</span>
          <h4 className="text-xs font-bold font-sans text-white tracking-tight mt-0.5 font-sans">Production & Practice Control Panel</h4>
        </div>
        
        <div className="grid grid-cols-1 pb-1">
          {/* Action: Open Creator Director */}
          <button
            onClick={onOpenCreatorDirector}
            className="flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-white/5 hover:border-[#FF4FD8]/30 rounded-2xl text-[10px] font-black font-sans uppercase tracking-wider text-white transition-all duration-300 cursor-pointer active:scale-95 shadow-md"
          >
            <Sliders size={13} className="text-[#FF4FD8]" />
            <span>Director Mode</span>
          </button>
        </div>
      </div>

      {/* The Requested NEXT Workflow Proceed Trigger */}
      <div className="mt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            logAnalyticsEvent("Navigated to creator action hub", { prompt, mood, contentType });
            onNavigateToNext();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-[#C8FF5A] hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase font-sans tracking-widest shadow-[0_0_30px_rgba(200,255,90,0.25)] hover:shadow-[0_0_40px_rgba(200,255,90,0.45)] cursor-pointer flex items-center justify-center gap-2.5 border border-black/10 transition-all font-mono"
        >
          <span>PROCEED TO CREATOR HUB</span>
          <ArrowRight size={18} />
        </motion.button>
      </div>



      {/* Custom Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 bg-[#C8FF5A] text-black py-3 px-5 rounded-xl text-xs font-bold font-sans flex items-center gap-2.5 shadow-[0_8px_30px_rgba(200,255,90,0.35)] z-50 border border-black/10"
          >
            <ClipboardCheck size={15} className="shrink-0 text-black animate-pulse" />
            <span className="leading-tight uppercase font-mono tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
