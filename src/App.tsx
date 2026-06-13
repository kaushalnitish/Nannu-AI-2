/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Header } from "react"; // Actually we can write custom layouts directly
import { motion, AnimatePresence } from "motion/react";
import { Brain, Heart, Layers, Sparkles, UserCircle } from "lucide-react";

import { GeneratedScriptPayload, LibraryItem, VoiceSettings } from "./types";
import {
  getSavedLibrary,
  getSavedVoiceSettings,
  saveLibraryItem,
  saveVoiceSettings,
  toggleFavoriteItem,
  deleteLibraryItem,
  updateLibraryItem
} from "./utils/mockData";
import {
  getPreferenceProfileString,
  trackCopyAction,
  trackSaveAction,
  trackRegenerateAction,
  trackEditAction,
  trackRevisitAction,
  logAnalyticsEvent
} from "./utils/preferences";

// Components
import BottomNavBar from "./components/BottomNavBar";

// Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import DurationScreen from "./screens/DurationScreen";
import TypeScreen from "./screens/TypeScreen";
import ToneScreen from "./screens/ToneScreen";
import GeneratingScreen from "./screens/GeneratingScreen";
import ScriptScreen from "./screens/ScriptScreen";
import NextWorkflowScreen from "./screens/NextWorkflowScreen";
import CaptionScreen from "./screens/CaptionScreen";
import ThumbnailScreen from "./screens/ThumbnailScreen";
import LibraryScreen from "./screens/LibraryScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AnalyzeScreen from "./screens/AnalyzeScreen";

export default function App() {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<string>("home");
  const [activeTab, setActiveTab] = useState<"home" | "create" | "library" | "profile">("home");
  const [initialProfileSection, setInitialProfileSection] = useState<string | null>(null);

  // Accessibility theme state (Dark / Light)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  // Creation State parameters
  const [prompt, setPrompt] = useState(() => localStorage.getItem("nannu_prompt") || "");
  const [mood, setMood] = useState(() => localStorage.getItem("nannu_mood") || "Confident 😎");
  const [duration, setDuration] = useState(() => localStorage.getItem("nannu_duration") || "45 sec");
  const [contentType, setContentType] = useState(() => localStorage.getItem("nannu_contentType") || "Talking Head");
  const [language, setLanguage] = useState(() => localStorage.getItem("nannu_language") || "English");

  // Output States
  const [generatedPayload, setGeneratedPayload] = useState<GeneratedScriptPayload | null>(() => {
    try {
      const saved = localStorage.getItem("nannu_generatedPayload");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifyingCaption, setIsModifyingCaption] = useState(false);

  // Synchronize state parameter metrics to survive refreshes and navigation actions
  useEffect(() => {
    localStorage.setItem("nannu_prompt", prompt);
  }, [prompt]);

  useEffect(() => {
    localStorage.setItem("nannu_mood", mood);
  }, [mood]);

  useEffect(() => {
    localStorage.setItem("nannu_duration", duration);
  }, [duration]);

  useEffect(() => {
    localStorage.setItem("nannu_contentType", contentType);
  }, [contentType]);

  useEffect(() => {
    localStorage.setItem("nannu_language", language);
  }, [language]);

  useEffect(() => {
    if (generatedPayload) {
      localStorage.setItem("nannu_generatedPayload", JSON.stringify(generatedPayload));
    } else {
      localStorage.removeItem("nannu_generatedPayload");
    }
  }, [generatedPayload]);

  // Persistence States
  const [libraryList, setLibraryList] = useState<LibraryItem[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    vocabulary: "Executive SaaS & Startup",
    baseEnergy: "Dynamic Speech",
    voiceSyncScore: 92,
    lastTrained: "4 hours ago"
  });

  // Load persistence records
  useEffect(() => {
    setLibraryList(getSavedLibrary());
    setVoiceSettings(getSavedVoiceSettings());
  }, []);

  // Hash-based client router synchronization
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#/home";
      const route = hash.replace("#/", "");

      // Sync navigation active tabs based on active path
      if (route === "home") {
        setActiveTab("home");
      } else if (route.startsWith("create/") || route === "analyze") {
        setActiveTab("create");
      } else if (route === "library") {
        setActiveTab("library");
      } else if (route === "profile") {
        setActiveTab("profile");
        setInitialProfileSection(null);
      } else if (route === "voice") {
        setActiveTab("profile"); // Train My Voice belongs in Profile zone
        setInitialProfileSection("train");
      } else if (route === "generating" || route === "script" || route === "caption" || route === "thumbnails") {
        // Keeps create tab active while generating final script outputs
        setActiveTab("create");
      }

      setCurrentRoute(route);
    };

    window.addEventListener("hashchange", handleHashChange);
    
    // Set initial hash route
    if (!window.location.hash) {
      window.location.hash = "#/home";
    } else {
      handleHashChange();
    }

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Scroll to top on route change via Hash navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentRoute]);

  const navigateTo = (route: string) => {
    window.location.hash = `#/${route}`;
  };

  // Tab changes triggers
  const handleTabChange = (tab: "home" | "create" | "library" | "profile") => {
    if (tab === "home") {
      navigateTo("home");
    } else if (tab === "create") {
      // Re-trigger from first creation options
      navigateTo("create/type");
    } else if (tab === "library") {
      navigateTo("library");
    } else if (tab === "profile") {
      navigateTo("profile");
    }
  };

  // Handle flow transitions
  const handleStartCreation = (promptText: string) => {
    setPrompt(promptText);
    navigateTo("create/type");
  };

  // Perform Server-Side AI Generation Call
  const handleFormatSelectAndGenerate = async (selectedType: string) => {
    // 1. Immediately reset stale content so user does not see old texts
    setGeneratedPayload(null);
    setContentType(selectedType);
    navigateTo("generating");
    setIsGenerating(true);

    const apiStartTime = performance.now();
    console.log(`[PERFORMANCE] API Request Start at ${apiStartTime.toFixed(2)}ms`);

    logAnalyticsEvent("Generate Clicked", {
      prompt: prompt,
      mood: mood,
      duration: duration,
      contentType: selectedType,
      language: language
    });

    try {
      console.log("Requesting script generation via Express proxy with automatic learned profile...");
      const rawApiUrl = (import.meta.env.VITE_API_URL || "");
      const apiBase = (rawApiUrl === "MY_APP_URL" || !rawApiUrl.startsWith("http")) ? "" : rawApiUrl.replace(/\/$/, "");
      
      const customSystemInstruction = `
You are Nannu AI, a world-class creator-focused personal content brain.
You MUST prioritize the user's prompt ("${prompt}") as the absolute primary semantic focus of the script, hooks, metadata, captions, and thumbnail concepts.
You are STRICTLY FORBIDDEN from defaulting to, assuming, or injecting any topics related to startups, SaaS, marketing retainers, audience building, Loom audits, software development, entrepreneurship, or business structures, unless the prompt explicitly requests them.
If the prompt is about baking, mindfulness, fitness, relationships, gaming, personal life, history, science, or any other niche, write the script and all metadata strictly and authentically about that specific topic. Never force business/startup themes onto unrelated prompts.
      `.trim();

      const response = await fetch(`${apiBase}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          mood: mood,
          duration: duration,
          contentType: selectedType,
          voiceMultiplier: voiceSettings.voiceSyncScore,
          energyLevel: voiceSettings.baseEnergy,
          language: language,
          vocabulary: voiceSettings.vocabulary,
          selectedTones: voiceSettings.selectedTones,
          preferences: getPreferenceProfileString(), // Convey silent historic preferences profile
          system_instruction: customSystemInstruction
        })
      });

      console.log("---- API /api/generate Diagnostic Logs ----");
      console.log("Expected URL:", `${apiBase || window.location.origin}/api/generate`);
      console.log("Actual Response URL:", response.url);
      console.log("Response Status:", response.status);
      
      const responseContentType = response.headers.get("content-type") || "";
      console.log("Response Content-Type:", responseContentType);

      if (responseContentType.includes("text/html")) {
        console.error("DIAGNOSTIC CRITICAL: Received 'text/html' content-type. This indicates an API routing or SPA fallback configuration issue where index.html was unexpectedly returned instead of the JSON response.");
      }
      
      const responseText = await response.text();
      console.log("Response Text (First 1000 Chars):", responseText.slice(0, 1000));
      console.log("------------------------------------------");

      if (responseContentType.includes("text/html")) {
        throw new Error(`Expected JSON but received 'text/html'. This usually means the API route was caught by your front-end router or SPA fallback. First 200 bytes: ${responseText.slice(0, 200)}`);
      }

      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}. Detail: ${responseText.slice(0, 200)}`);
      }

      const apiEndTime = performance.now();
      const apiDuration = apiEndTime - apiStartTime;
      console.log(`[PERFORMANCE] Gemini API Response Time: ${apiDuration.toFixed(2)}ms`);

      const parseStartTime = performance.now();
      let payloadData: GeneratedScriptPayload;
      try {
        payloadData = JSON.parse(responseText);
      } catch (parseErr: any) {
        throw new Error(`Failed to parse response JSON: ${parseErr.message || String(parseErr)}. Raw Response: ${responseText.slice(0, 300)}`);
      }
      const parseEndTime = performance.now();
      const parseDuration = parseEndTime - parseStartTime;
      console.log(`[PERFORMANCE] Payload JSON Parsing Time: ${parseDuration.toFixed(2)}ms`);

      if (!payloadData || !payloadData.script || !payloadData.script.hook || !payloadData.script.body) {
        throw new Error("Invalid or empty response payload structure from script server");
      }

      const stateStartTime = performance.now();
      const totalLen = (payloadData.script.hook.text.length + payloadData.script.body.text.length + payloadData.script.cta.text.length);
      
      const stateEndTime = performance.now();
      const stateDuration = stateEndTime - stateStartTime;
      console.log(`[PERFORMANCE] State Prep Time: ${stateDuration.toFixed(2)}ms`);

      const totalDuration = performance.now() - apiStartTime;
      console.log(`[PERFORMANCE] Total Script Generation Duration: ${totalDuration.toFixed(2)}ms`);

      payloadData.perfTiming = {
        apiDuration,
        parseDuration,
        stateDuration,
        totalDuration
      };

      logAnalyticsEvent("Generation Success", {
        prompt: prompt,
        mood: mood,
        duration: duration,
        contentType: selectedType,
        language: language,
        isFallback: payloadData.isFallback || false,
        length: totalLen,
        under100Chars: totalLen < 100
      });

      setGeneratedPayload(payloadData);

      // Save output to creator library records persistent
      const newItem: LibraryItem = {
        id: `lib-${Date.now()}`,
        timestamp: "Just now",
        prompt: prompt,
        mood: mood,
        duration: duration,
        contentType: selectedType,
        language: language,
        data: payloadData,
        isFavorite: false
      };

      saveLibraryItem(newItem);
      // reload lists
      setLibraryList(getSavedLibrary());

      // Let the progress controller transition naturally with complete checkmarks
      setIsGenerating(false);

    } catch (err: any) {
      logAnalyticsEvent("Generation Failed", {
        prompt: prompt,
        mood: mood,
        duration: duration,
        contentType: selectedType,
        language: language,
        error: err.message || String(err)
      });
      console.error("AI Generation failed, initiating premium client-side backup generator:", err);
      
      const backupStartTime = performance.now();
      // Calculate high-fidelity client-side generated content
      const cleanPrompt = prompt.trim() || "my daily routine";
      const isSavage = mood.toLowerCase().includes("roast") || mood.toLowerCase().includes("brutal") || mood.toLowerCase().includes("savage");
      const isStory = selectedType.toLowerCase().includes("story") || mood.toLowerCase().includes("story") || mood.toLowerCase().includes("personal");
      
      let hookText = "";
      let bodyText = "";
      let ctaText = "";
      
      if (language === "Hindi") {
        if (isSavage) {
          hookText = `क्या आप भी "${cleanPrompt}" को लेकर वही पुरानी घिसी-पिटी गलतियां कर रहे हैं? इसे तुरंत रोकिए!`;
          bodyText = `चलिए "${cleanPrompt}" के बारे में कड़वा सच बोलते हैं। इंटरनेट पर जितने भी लोग ज्ञान दे रहे हैं, वे सब सिर्फ कॉपी-पेस्ट कर रहे हैं। बिना सोचे-समझे दूसरों की नकल करने से आपकी पहुंच शून्य रहेगी। अगर असली असर डालना है, तो सबसे पहले बकवास बातों को काटकर सीधे काम की क्रेडिबिलिटी पर बात करना शुरू करें।`;
          ctaText = `अगर आप भी "${cleanPrompt}" के इस सच को महसूस करते हैं, तो कमेंट्स में 'कड़वा सच' लिखें।`;
        } else if (isStory) {
          hookText = `मैं हमेशा "${cleanPrompt}" से दूर भागता रहा, जब तक कि एक चौंकाने वाले अनुभव ने मेरा दृष्टिकोण नहीं बदल दिया।`;
          bodyText = `इस यात्रा में सबसे कठिन क्षण तब आया जब मुझे एहसास हुआ कि जिसे मैं मामूली समझ रहा था, वह सबसे बड़ा सबक था। "${cleanPrompt}" ने मुझे सिखाया कि असफलता सिर्फ एक मोड़ है, कोई अंत नहीं। सच्ची कहानी वह होती है जिसमें आप अपनी कमजोरियों को स्वीकार करके आगे बढ़ते हैं।`;
          ctaText = `क्या आपके पास भी "${cleanPrompt}" से जुड़ी ऐसी कोई कहानी है? मुझे कमेंट्स में ज़रूर बताएं।`;
        } else {
          hookText = `तो ये है "${cleanPrompt}" का वो अनोखा रहस्य, जो बड़े-बड़े क्रिएटर्स आपसे हमेशा छिपाते हैं।`;
          bodyText = `बात बहुत सीधी है: जब आप "${cleanPrompt}" पर ध्यान केंद्रित करते हैं, तो कठिनाइयाँ कम होने लगती हैं। आपको बस एक मजबूत हुक और सही शब्दों के चयन की आवश्यकता है। आज ही से इस सरल रणनीति को अपने काम में लागू करें, और परिणामों में बदलाव देखें।`;
          ctaText = `"${cleanPrompt}" पर आपकी क्या राय है? कमेंट करें और ऐसी अन्य जानकारियों के लिए फॉलो करें।`;
        }
      } else if (language === "Hinglish") {
        if (isSavage) {
          hookText = `Stop posting absolutely garbage content about "${cleanPrompt}". Honestly, it's very painful to watch!`;
          bodyText = `Chalo "${cleanPrompt}" ke baare me bilkul raw aur brutal sach bolte hain. Sab log bas boring copy-paste templates repeat kar rahe hain, isiliye growth zero hai. Agar actual attention chahiye, toh faltu ke intro lines ko trim karo, aur directly high-retention hook aur genuine facts par focused raho.`;
          ctaText = `Sacchai se agree karte ho toh niche 'REAL' comment karo aur share karo.`;
        } else if (isStory) {
          hookText = `Main humesha "${cleanPrompt}" ko avoid karta raha... jab tak ek unexpected shock ne sab kuch badal nahi diya.`;
          bodyText = `Hum rarely is baat par discuss karte hain ki "${cleanPrompt}" ki reality kya hai. Screen par sab badhiya lagta hai, par peeche ki struggle real hoti hai. Us failure ne mujhe sikhaya ki actual game persistence aur build-up ka hai, fakers ki race ka nahi.`;
          ctaText = `Agar aapne bhi "${cleanPrompt}" ke dauran aisa downfall dekha hai, toh niche comment me batao.`;
        } else {
          hookText = `This is the single most critical formula about "${cleanPrompt}" jo aapko aaj hi seekhni chahiye.`;
          bodyText = `Sahi strategy ke saath jab aap "${cleanPrompt}" ko analyze karte ho, toh isme hidden details hi real value highlight karti hain. Jyada sochna band karo, bas daily actions me minimal consistency laao aur is smart flow ko strictly test karo.`;
          ctaText = `Apna sabse bada challenge niche comment karo on "${cleanPrompt}", main personal guide DM karunga.`;
        }
      } else {
        // English Default
        if (isSavage) {
          hookText = `Stop posting absolute garbage about "${cleanPrompt}". Honestly, it's painful to witness.`;
          bodyText = `Let's be brutally real about "${cleanPrompt}". Most people are putting out shallow, copied viewpoints with zero research or critical thinking. If you keep choosing the lazy route, your results will stay flat. Here is how you actually fix it: cut the fluff, delete boring intro fluff, and focus strictly on delivering genuine, unquestionable value.`;
          ctaText = `Comment 'FACTS' below if you agree that "${cleanPrompt}" needs an unfiltered reality check.`;
        } else if (isStory) {
          hookText = `I spent months running away from "${cleanPrompt}"... until this one sudden challenge changed everything.`;
          bodyText = `We rarely talk about what "${cleanPrompt}" actually forces us to confront. Outer appearances look easy, but the actual journey is deeply personal and complex. This defining moment taught me patience, self-discovery, and the sheer courage to face obstacles head-on.`;
          ctaText = `If you have ever faced a major setback with "${cleanPrompt}", drop a comment. Let's talk.`;
        } else {
          hookText = `The absolute secret behind "${cleanPrompt}" that most accounts won't share to avoid extra competition.`;
          bodyText = `Here's the key challenge: most common advice on "${cleanPrompt}" assumes you have endless resources or master-level expertise. The truth is much simpler. You need a sharp, clear framework paired with conversational steps. Keep the pacing active, call out common misconceptions, and wrap up with an engaging query.`;
          ctaText = `Drop a comment with your biggest obstacle about "${cleanPrompt}" to unlock my exclusive guides.`;
        }
      }

      const backupDuration = performance.now() - backupStartTime;
      const totalBackupDuration = performance.now() - apiStartTime;

      const backupPayload: GeneratedScriptPayload = {
        script: {
          hook: { text: hookText, action: `Visual: Speaks with ${mood} pacing. Energetic start focusing on presenter.` },
          body: { text: bodyText, action: "Visual: Cut to tight close up or dynamic graphics presentation." },
          cta: { text: ctaText, action: "Visual: Points downward to comments overlay indicator on screen." }
        },
        captions: [
          `My raw perspective on "${cleanPrompt}". 🤫 Save this model immediately before it gets saturated.`,
          `Stop complicating "${cleanPrompt}". 🛑 Mastering the hook is 90% of the game. Let's build!`,
          `Stuck with "${cleanPrompt}"? Comment below and let's troubleshoot your structure together.`
        ],
        thumbnails: [
          { title: cleanPrompt.length < 20 ? cleanPrompt : cleanPrompt.slice(0, 18) + "...", description: `Aesthetic slate frame highlighting "${cleanPrompt}" with neon violet glow.` },
          { title: "The Brutal Truth", description: "Apple-inspired elegant layout with large serif typography." },
          { title: "Nannu AI Blueprint", description: "Minimalist layout with clean data panels and creator scorecards." }
        ],
        isFallback: true,
        errorReason: err.message || String(err),
        perfTiming: {
          apiDuration: 0,
          parseDuration: 0,
          stateDuration: backupDuration,
          totalDuration: totalBackupDuration
        }
      };

      setGeneratedPayload(backupPayload);

      logAnalyticsEvent("Fallback Active", {
        prompt: cleanPrompt,
        mood: mood,
        contentType: selectedType,
        language: language,
        reason: "API key error or rate limitation bypass"
      });

      // Save backup generator output to creator library persistent
      const newItem: LibraryItem = {
        id: `lib-fallback-${Date.now()}`,
        timestamp: "Just now (Local)",
        prompt: cleanPrompt,
        mood: mood,
        duration: duration,
        contentType: selectedType,
        language: language,
        data: backupPayload,
        isFavorite: false
      };
      
      try {
        saveLibraryItem(newItem);
        setLibraryList(getSavedLibrary());
      } catch (saveErr) {
        console.error("Local save failed, ignoring", saveErr);
      }

      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    trackRegenerateAction({ prompt, mood, contentType });
    handleFormatSelectAndGenerate(contentType);
  };

  const handleEditScriptText = (tab: "hook" | "body" | "cta", newText: string) => {
    if (!generatedPayload) return;
    
    // Track the edit event silently
    trackEditAction({ prompt, mood, contentType });

    const updatedPayload: GeneratedScriptPayload = {
      ...generatedPayload,
      script: {
        ...generatedPayload.script,
        [tab]: {
          ...generatedPayload.script[tab],
          text: newText
        }
      }
    };
    setGeneratedPayload(updatedPayload);

    // Save/sync inline edits to library items so they stay durable
    const existing = libraryList[0]; // Active/latest model item
    if (existing && existing.prompt === prompt) {
      const updatedItem: LibraryItem = {
        ...existing,
        data: updatedPayload
      };
      updateLibraryItem(updatedItem);
      setLibraryList(getSavedLibrary());
    }
  };

  // Caption inline modification trigger
  const handleModifyCaption = (mode: "shorten" | "viral" | "standard") => {
    if (!generatedPayload) return;
    setIsModifyingCaption(true);

    // Simulate AI modifying existing values in-place based on actual contents
    setTimeout(() => {
      let updatedCaptions = [...generatedPayload.captions];
      
      if (mode === "viral") {
        updatedCaptions = updatedCaptions.map((caption) => {
          if (!caption.includes("#viral")) {
            return `${caption} ✨🔥 #viral #trending #reels #explore`;
          }
          return caption;
        });
      } else if (mode === "shorten") {
        updatedCaptions = updatedCaptions.map((caption) => {
          const sentences = caption.split(/[.!?]\s+/);
          if (sentences.length > 1) {
            return sentences[0] + ". " + (sentences[1] ? sentences[1] + "." : "");
          }
          return caption.length > 60 ? caption.slice(0, 60) + "..." : caption;
        });
      }

      setGeneratedPayload({
        ...generatedPayload,
        captions: updatedCaptions
      });
      setIsModifyingCaption(false);
    }, 1200);
  };

  // Train voice parameters update persistence
  const handleSaveVoiceSettings = (updated: VoiceSettings) => {
    setVoiceSettings(updated);
    saveVoiceSettings(updated);
  };

  const handleAnalysisSuccess = (transformedPayload: GeneratedScriptPayload, originalTopic: string) => {
    // Set parameters
    setPrompt(`Style of ${originalTopic}`);
    setGeneratedPayload(transformedPayload);
    setMood(targetMood => targetMood || mood);

    // Save output to creator library records persistent
    const newItem: LibraryItem = {
      id: `lib-${Date.now()}`,
      timestamp: "Saved just now",
      prompt: `Style of ${originalTopic}`,
      mood: mood,
      duration: duration,
      contentType: contentType,
      language: language,
      data: transformedPayload,
      isFavorite: false
    };

    saveLibraryItem(newItem);
    setLibraryList(getSavedLibrary());

    // Navigate straight to script screen viewer
    navigateTo("script");
  };

  // Library interaction bindings
  const handleSelectLibraryItem = (item: LibraryItem) => {
    setPrompt(item.prompt);
    setMood(item.mood);
    setDuration(item.duration);
    setContentType(item.contentType);
    setGeneratedPayload(item.data);
    
    // Automatically track as revisit
    trackRevisitAction({ prompt: item.prompt, mood: item.mood, contentType: item.contentType });
    navigateTo("script");
  };

  const handleSaveDraft = (customPromptName?: string) => {
    if (!generatedPayload) return;
    const finalName = customPromptName || prompt || "High-Retention Creator Draft";
    
    // Track saving behavior of this customized script 
    trackSaveAction({ prompt: finalName, mood, contentType, vocabulary: voiceSettings.vocabulary });

    logAnalyticsEvent("Draft Saved", {
      prompt: finalName,
      mood: mood,
      duration: duration,
      contentType: contentType,
      language: language
    });

    // Check for existing element in library
    const existing = libraryList.find(item => item.prompt.toLowerCase() === finalName.toLowerCase());
    if (existing) {
      // Update existing item with the latest payload
      const updatedItem: LibraryItem = {
        ...existing,
        timestamp: "Updated just now",
        data: generatedPayload
      };
      updateLibraryItem(updatedItem);
    } else {
      // Save as completely new draft
      const newItem: LibraryItem = {
        id: `lib-${Date.now()}`,
        timestamp: "Saved just now",
        prompt: finalName,
        mood: mood,
        duration: duration,
        contentType: contentType,
        language: language,
        data: generatedPayload,
        isFavorite: false
      };
      saveLibraryItem(newItem);
    }
    
    // Re-load lists to sync live
    setLibraryList(getSavedLibrary());
  };

  const handleToggleFavorite = (id: string) => {
    const item = libraryList.find(i => i.id === id);
    if (item && !item.isFavorite) {
      // Actively adding to favorite: track as preferred layout save success
      trackSaveAction({ prompt: item.prompt, mood: item.mood, contentType: item.contentType, vocabulary: voiceSettings.vocabulary });
    }
    const updated = toggleFavoriteItem(id);
    setLibraryList(updated);
  };

  const handleRemoveLibraryItem = (id: string) => {
    const updated = deleteLibraryItem(id);
    setLibraryList(updated);
  };

  // Render screens dynamically using Hash state router
  const renderScreen = () => {
    switch (currentRoute) {
      case "create/duration":
        return (
          <DurationScreen
            onGenerate={handleFormatSelectAndGenerate}
            onBack={() => navigateTo("create/tone")}
            savedDuration={duration}
            onDurationChange={setDuration}
            savedContentType={contentType}
            onContentTypeChange={setContentType}
            savedMood={mood}
            onMoodChange={setMood}
            prompt={prompt}
          />
        );
      case "create/type":
        return (
          <TypeScreen
            onNext={(type) => {
              setContentType(type);
              navigateTo("create/tone");
            }}
            onBack={() => navigateTo("home")}
            savedType={contentType}
            onTypeChange={setContentType}
            prompt={prompt}
          />
        );
      case "create/tone":
        return (
          <ToneScreen
            onNext={(tone) => {
              setMood(tone);
              navigateTo("create/duration");
            }}
            onBack={() => navigateTo("create/type")}
            savedTone={mood}
            onToneChange={setMood}
            prompt={prompt}
          />
        );
      case "generating":
        return (
          <GeneratingScreen 
            isGenerating={isGenerating}
            payloadReady={!!generatedPayload}
            onComplete={() => navigateTo("script")} 
          />
        );
      case "script":
        return (
          <ScriptScreen
            payload={generatedPayload || {
              script: {
                hook: { text: "No draft loaded. Click home to start.", action: "Visual: Click Home tab." },
                body: { text: "Brain waves are unconfigured.", action: "" },
                cta: { text: "", action: "" }
              },
              captions: ["", "", ""],
              thumbnails: []
            }}
            onBack={() => navigateTo("create/duration")}
            onNavigateToNext={() => navigateTo("next-workflow")}
            onRegenerate={handleRegenerate}
            isRegenerating={isGenerating}
            mood={mood}
            contentType={contentType}
            language={language}
            onEditScriptText={handleEditScriptText}
            prompt={prompt}
          />
        );
      case "next-workflow":
        return (
          <NextWorkflowScreen
            payload={generatedPayload || {
              script: {
                hook: { text: "No draft loaded.", action: "" },
                body: { text: "No draft loaded.", action: "" },
                cta: { text: "", action: "" }
              },
              captions: ["", "", ""],
              thumbnails: []
            }}
            prompt={prompt}
            mood={mood}
            contentType={contentType}
            language={language}
            onBack={() => navigateTo("script")}
            onSaveDraft={handleSaveDraft}
            onModifyCaption={handleModifyCaption}
            isModifyingCaption={isModifyingCaption}
          />
        );
      case "caption":
        return (
          <CaptionScreen
            captions={generatedPayload?.captions || ["No caption loaded. Generate first."]}
            onBack={() => navigateTo("script")}
            onModify={handleModifyCaption}
            isModifying={isModifyingCaption}
            prompt={prompt}
            mood={mood}
            contentType={contentType}
          />
        );
      case "thumbnails":
        return (
          <ThumbnailScreen
            thumbnails={generatedPayload?.thumbnails || []}
            onBack={() => navigateTo("script")}
            prompt={prompt}
            mood={mood}
            contentType={contentType}
          />
        );
      case "library":
        return (
          <LibraryScreen
            libraryList={libraryList}
            onSelect={handleSelectLibraryItem}
            onToggleFavorite={handleToggleFavorite}
            onDeleteItem={handleRemoveLibraryItem}
          />
        );
      case "profile":
      case "voice":
        return (
          <ProfileScreen
            scriptsCount={libraryList.length}
            voiceSyncScore={voiceSettings.voiceSyncScore}
            theme={theme}
            onToggleTheme={toggleTheme}
            initialSection={initialProfileSection}
            onClearInitialSection={() => setInitialProfileSection(null)}
            onSelectScript={(item) => {
              handleSelectLibraryItem(item);
            }}
          />
        );
      case "analyze":
        return (
          <AnalyzeScreen
            onBack={() => navigateTo("home")}
            onAnalysisSuccess={handleAnalysisSuccess}
          />
        );
      case "home":
      default:
        return (
          <WelcomeScreen
            onStartCreation={(pText, dur, format, md) => {
              setPrompt(pText);
              if (dur) setDuration(dur);
              if (format) setContentType(format);
              if (md) setMood(md);
              navigateTo("create/type");
            }}
            savedPrompt={prompt}
            language={language}
            onLanguageChange={setLanguage}
            savedDuration={duration}
            onDurationChange={setDuration}
            savedContentType={contentType}
            onContentTypeChange={setContentType}
            savedMood={mood}
            onMoodChange={setMood}
          />
        );
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col selection:bg-[#FF4FD8]/30 selection:text-[#FF4FD8]">
      {/* Immersive top subtle neon glow accents */}
      <div className="absolute top-0 left-12 right-12 h-64 bg-gradient-to-b from-[#FF4FD8]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-1/3 right-1/4 h-48 bg-gradient-to-b from-[#A855F7]/4 to-transparent blur-3xl pointer-events-none" />

      {/* Main Responsive Mobile Frame */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-8 pb-32 relative overflow-hidden flex flex-col justify-between">
        
        {/* Router transitions animated screen */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoute}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Persistent global iOS bottom tab layout */}
      {currentRoute !== "generating" && (
        <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  );
}
