import { useState, useEffect } from "react";
import { ChevronLeft, RefreshCw, Sliders, Layout, Video, Sparkles, Smile, Play, Volume2, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import GlowCard from "../components/GlowCard";
import { GeneratedScriptPayload } from "../types";

interface CreatorDirectorScreenProps {
  payload: GeneratedScriptPayload;
  prompt: string;
  mood: string;
  contentType: string;
  language: string;
  onBack: () => void;
}

export default function CreatorDirectorScreen({
  payload,
  prompt,
  mood,
  contentType,
  language = "English",
  onBack
}: CreatorDirectorScreenProps) {
  const [activeSection, setActiveSection] = useState<number>(0);
  const [guide, setGuide] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
            hook: payload.script.hook.text,
            body: payload.script.body.text,
            cta: payload.script.cta.text,
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
          throw new Error("Invalid format");
        }
      } catch (err) {
        if (!active) return;
        const topic = prompt || "viral content";
        const isHindi = language === "Hindi";
        const isHinglish = language === "Hinglish";

        let localPlaybook: any[] = [];

        if (isHindi) {
          localPlaybook = [
            {
              title: "1. Camera Setup & Framing",
              descShort: "कैमरा और फ्रेमिंग सेटिंग्स की विस्तृत गाइड",
              description: `कैमरे का अलाइनमेंट सीधे आँखों पर रखें। ${contentType} के लिए बिल्कुल सुव्यवस्थित सेट सुनिश्चित करें।`,
              bullets: [
                "चेहरे पर अच्छी रौशनी के लिए रिंग लाइट या खिड़की के सीधे सामने खड़े होकर रिकॉर्ड करें।",
                "फ्रेम को थोड़ा खुला रखें ताकि आपके हाथ के इशारे (gestures) रिकॉर्ड हो सकें।",
                "हमेशा 4K / 30fps या फुलHD 1080p पर रिकॉर्ड करें ताकि सबटाइटल्स एकदम साफ दिखें।"
              ]
            },
            {
              title: "2. Acting & Expression",
              descShort: "प्रदर्शन और बोलने की शैली",
              description: `शानदार प्रभाव डालने के लिए अपनी बोलने की गती नियंत्रित करें और आत्मविश्वास से भरपूर रहें।`,
              bullets: [
                "मुख्य पॉइंट बताने से ठीक पहले १.५ सेकंड का एक छोटा पॉज (Pause) लेकर उत्सुकता बढ़ाएं।",
                "साधारण बातचीत वाली गहरी फ्रेंडली टोन अपनाएं - जैसे किसी दोस्त से बात कर रहे हों।",
                "Filler शब्द जैसे 'अम', 'उह', 'मतलब' बोलने से पूरी तरह बचें।"
              ]
            },
            {
              title: "3. Scene Design",
              descShort: "सीन की सजावट तथा एंगल कट्स",
              description: `वीडियो की विज़ुअल मोनोटनी को तोड़ने के लिए बीच-बीच में एंगल बदलने का प्रयास करें।`,
              bullets: [
                "सीन १ (Hook): कैमरा के बिलकुल पास रहें और सीढ़ी नज़र (Eye-Lock) बनाए रखें।",
                "सीन २ (Body): थोड़ा पीछे हटकर या साइड एंगल लेकर अपनी बात विस्तार से स्पष्ट करें।",
                "सीन ३ (CTA): चेहरे पर मुस्कराहट के साथ स्क्रीन के निचले कोने की ओर इशारा करते हुए बात कहें।"
              ]
            },
            {
              title: "4. B-Roll Planning",
              descShort: "रोचक सहायक फुटेज की प्लानिंग",
              description: `दर्शकों को बोरियत से बचाने के लिए बातचीत के ऊपर सहायक शॉट्स का उपयोग करें।`,
              bullets: [
                "अपने कम्प्यूटर पर टाइप करने या नोट्स लिखने का एक प्यारा क्लोज-अप शॉट लगाएं।",
                "जब आप समस्या की बात कर रहे हों, तब स्क्रीन पर एनिमेटेड की-वर्ड्स फ्लैश करें।",
                "पूरी बातचीत में हल्का रिलैक्स संगीत (वॉल्यूम -२६dB) बैकग्राउंड में जरूर चालू रखें।"
              ]
            },
            {
              title: "5. Editing & Sound Design",
              descShort: "एडिटिंग एवं साउंड इफेक्ट्स",
              description: `जम्प कट्स का उपयोग करके वीडियो से खाली समय और सांस लेने की आवाज़ पूरी तरह अलग करें।`,
              bullets: [
                "वीडियो के खाली हिस्सों (Dead air) को काट कर वीडियो तेज और चुस्त बनाएं।",
                "स्क्रीन के ठीक बीच में बड़े तथा गहरे रंग के सबटाइटल्स (पीला या आसमानी) लगाएं।",
                "अंत के शब्द को पहले शब्द से मिला दें ताकि वीडियो एक अंतहीन लूप (infinite rewind loop) जैसा दिखे।"
              ]
            },
            {
              title: "6. Audience Retention Strategy",
              descShort: "अंतिम रिटेंशन बूस्टर रहस्य",
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
              title: "1. Camera Setup & Framing",
              descShort: "Framing and studio lens placement",
              description: `Video framing ko clear rakhein. Camera lens exact eye level pe match karein taaki prompt "${topic}" ke liye solid engagement create ho.`,
              bullets: [
                "Face pe solid lighting key-source rakhein, dark circles ya shadows bilkul avoid karein.",
                "Frame thoda open rakhein taaki body language and hand gestures clean capture ho sakein.",
                "Resolution humesha 1080p 60fps ya 4K set rakhein seamless captions display ke liye."
              ]
            },
            {
              title: "2. Acting & Expression",
              descShort: "Vocal attitude and emotion blend",
              description: `Full energy aur flow ke sath deliver karein. Apni speaking speed normal and impactful rakhein.`,
              bullets: [
                "Sabse important hook line se pehle ek brief 1.5-second ka solid transition pause lein.",
                "Friendly conversational tone use karein, video informative aur authentic lagna chahiye.",
                "Fumble aur repetitive filler words (um, uh, actually) micro-cuts me eliminate karke clear sound karein."
              ]
            },
            {
              title: "3. Scene Design",
              descShort: "Dynamic visual backdrops structure",
              description: `Retention maintain rakhne ke liye humesha dynamic angle adjustments perform karein.`,
              bullets: [
                "Scene 1: Hook bolte time direct center eye-contact and physical close-up use karein.",
                "Scene 2: Detail discussion karte waqt space visual slides side me overlay karein.",
                "Scene 3: Finish direct indicator gesture ke sath smiling face screen hold."
              ]
            },
            {
              title: "4. B-Roll Planning",
              descShort: "Visual velocity and overlays",
              description: `Screen visual quality enrich karne ke liye talking scene ke sath supplemental detailed clips run kijiye.`,
              bullets: [
                "Laptop typing, drawing table ya direct working environment ka fast macro capture trim karein.",
                "Key points explain karte time floating bright highlighted fonts drop kijiye.",
                "Studio high value build karne ke liye low volume ambient b-roll sound effects (whoosh, hit) select karein."
              ]
            },
            {
              title: "5. Editing & Sound Design",
              descShort: "Jump-cuts and sound enhancement",
              description: `Sharp jump-cuts, rapid zoom triggers aur visual pops compile karein.`,
              bullets: [
                "Speech ke gaps aur breathing pauses ko aggressive trim lagayein.",
                "Screen center me yellow, cyan ya white bold subtitle text drop karein.",
                "Rewind logic follow kijiye loop optimization ke liye taaki repeat watch sessions increase ho."
              ]
            },
            {
              title: "6. Audience Retention Strategy",
              descShort: "Viewer engagement retention curve",
              description: `Audience session span maintain rkhne ke liye metrics-backed triggers use karein.`,
              bullets: [
                "Intro ya formal naming block drop karein seedhe main target lines se start karein.",
                "Mid section me curiosity gap release kijiye taaki drop-off curves clear out ho sakein.",
                "CTA lines ko instant action trigger se direct sync rakhein comments loop increase krne ke liye."
              ]
            }
          ];
        } else {
          localPlaybook = [
            {
              title: "1. Camera Setup & Framing",
              descShort: "Symmetric rule-of-thirds camera setup",
              description: `Establish premium short-form framing. Set up your camera lens precisely at eye level for "${topic}".`,
              bullets: [
                "Arrange a beautiful main light offset 45 degrees for classic, premium shading.",
                "Configure framing using the standard 'Rule of Thirds' line grids with eyes in upper third.",
                "Ensure subtle background blur to separate you cleanly from background noise."
              ]
            },
            {
              title: "2. Acting & Expression",
              descShort: "Vocal density and body posture guidelines",
              description: `Command digital authority and speak with natural pacing. Adapt your voice warmth to the content mood.`,
              bullets: [
                "Use intentional 1.5-second pauses directly before delivering critical plot twists.",
                "Maintain positive posture, keeping an encouraging smile explained in detail.",
                "Speak at approximately 150-160 words-per-minute for modern short-form sweet-spot."
              ]
            },
            {
              title: "3. Scene Design",
              descShort: "Visual stage structure with background cuts",
              description: `Break the visual monotony with alternating setups that support the progression of "${topic}".`,
              bullets: [
                "Scene 1: Main studio area with a soft ambient background for opening hook lines.",
                "Scene 2: Shift to 30-degree side profile shot or screen screengrabs showing blueprint metrics.",
                "Scene 3: Direct close-up with intense camera gaze to close the story outline."
              ]
            },
            {
              title: "4. B-Roll Planning",
              descShort: "Aesthetic supplemental visual sequence planning",
              description: `Maintain high short-form visual velocity using aesthetic macro detail clips.`,
              bullets: [
                "Cinematic close-up of keyboard typing or scratching notes on clean aesthetic papers.",
                "Micro screen captures navigating dashboards or graphics overlays.",
                "Bold animated keyword tags floating in the center of the video canvas."
              ]
            },
            {
              title: "5. Editing & Sound Design",
              descShort: "High impact visual styling & sound design SFX",
              description: `Modern high-converting video styling using jump cuts, SFX, and zoom-ins.`,
              bullets: [
                "Micro-crop all speech gaps, deep breaths, and empty air frames immediately.",
                "Style central auto-captions in high-contrast yellow or glowing green fonts.",
                "Sync sound effects (whooshes, page turns) precisely along the graphic shifts."
              ]
            },
            {
              title: "6. Audience Retention Strategy",
              descShort: "Retention loop dynamics and drop-off control",
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
  }, [payload, language, contentType, mood, prompt]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col flex-1 pb-24 font-sans text-left"
    >
      {/* Header Back Controls */}
      <div className="flex items-center justify-between mb-5 text-xs font-mono text-[#A1A1AA]">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer font-bold select-none">
          <ChevronLeft size={16} />
          <span>BACK TO SCRIPT</span>
        </button>
        <span className="text-[#A855F7] font-bold uppercase tracking-widest bg-[#A855F7]/10 px-2.5 py-1 rounded-full border border-[#A855F7]/20 select-none">
          STUDIO DIRECTOR MODE
        </span>
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-1">
          AI Creator Director
        </h2>
        <p className="text-xs text-[#A1A1AA]">
          Deep production guidance mapped specifically to your {contentType} script.
        </p>
      </div>

      {/* Target Setup Info bar */}
      <div className="p-3.5 rounded-xl bg-white/[0.02]/50 border border-white/5 flex gap-3 items-center mb-6 select-none">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
          <Sliders size={15} />
        </div>
        <div className="text-left">
          <span className="text-[8px] font-mono uppercase tracking-widest text-[#FF4FD8] font-bold block">Production Settings</span>
          <span className="text-[11px] text-white/95 mt-0.5 block leading-none font-sans">
            Style: {contentType} • Tone: {mood}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="text-[#C8FF5A] animate-spin" />
          <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-widest animate-pulse">
            Analyzing Dialect & Framing Specifications...
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chapter Grid Selector (Zero internal nested scrolls!) */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {guide?.map((sec, i) => {
              const isSelected = activeSection === i;
              return (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 relative flex flex-col justify-between min-h-[64px] cursor-pointer ${
                    isSelected
                      ? "bg-[#C8FF5A]/10 border-[#C8FF5A]/40 text-[#C8FF5A]"
                      : "bg-[#111111]/80 border-white/5 text-[#A1A1AA] hover:border-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono leading-tight font-black uppercase">
                      {sec.title.split(".")[1] || sec.title}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500 font-bold shrink-0">
                      0{i + 1}
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-500 mt-1 block group-hover:text-zinc-400 truncate w-full">
                    {sec.descShort || "Tactical direct"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active play block details (renders scroll-free, flat with main viewport scroll) */}
          {guide && guide[activeSection] && (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-1"
            >
              {/* Active Header banner inside info card */}
              <div className="p-4 bg-gradient-to-tr from-[#111111] via-[#111111]/90 to-transparent border border-white/5 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} className="text-pink-500 shrink-0" />
                  <span className="text-[9.5px] font-mono font-black text-white uppercase tracking-wider">
                    {guide[activeSection].title} Playbook
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] font-sans leading-relaxed italic border-l-2 border-[#FF4FD8] pl-3.5 py-0.5">
                  {guide[activeSection].description}
                </p>
              </div>

              {/* Action Bullets details */}
              <div className="space-y-2">
                {guide[activeSection].bullets.map((bulletStr: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start p-3.5 bg-gradient-to-r from-white/[0.01] to-transparent border border-white/5 rounded-xl text-left">
                    <div className="w-5 h-5 bg-[#C8FF5A]/10 border border-[#C8FF5A]/30 text-[#C8FF5A] flex items-center justify-center shrink-0 rounded text-[10px] font-mono font-black mt-0.5">
                      ✓
                    </div>
                    <span className="text-xs font-sans text-white/90 leading-relaxed select-text">
                      {bulletStr}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Prompt specific quick footer banner */}
          <div className="pt-6">
            <button
              onClick={onBack}
              className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs uppercase font-sans flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Done Viewing Guide</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
