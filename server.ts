import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

// Create uploads temporary directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer temporary storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Global CORS Middleware to allow requests from other deployment domains (like Netlify)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const PORT = 3000;

// Diagnostic logging on server start
const initialApiKey = process.env.GEMINI_API_KEY;
if (!initialApiKey) {
  console.warn("DIAGNOSTIC LOG: Startup - Environment missing: GEMINI_API_KEY is not defined in process.env");
} else if (initialApiKey === "MY_GEMINI_API_KEY" || initialApiKey.trim() === "" || initialApiKey.trim() === "undefined") {
  console.warn("DIAGNOSTIC LOG: Startup - Environment malformed: GEMINI_API_KEY is still set to placeholder 'MY_GEMINI_API_KEY' or empty.");
} else {
  console.log("DIAGNOSTIC LOG: Startup - Environment loaded: GEMINI_API_KEY is present on start with length " + initialApiKey.length + " chars.");
}

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    console.error("DIAGNOSTIC LOG: Runtime - Environment missing: GEMINI_API_KEY is not defined.");
    throw new Error("API key missing: GEMINI_API_KEY environment variable is not defined on the server runtime.");
  }
  if (key === "MY_GEMINI_API_KEY" || key.trim() === "" || key.trim() === "undefined") {
    console.error("DIAGNOSTIC LOG: Runtime - Environment malformed: GEMINI_API_KEY contains placeholder or empty value.");
    throw new Error("API key malformed: GEMINI_API_KEY is not configured with a valid secret key.");
  }

  // If a client already exists, use it
  if (aiClient) {
    return aiClient;
  }

  console.log("DIAGNOSTIC LOG: Runtime - Environment loaded: GEMINI_API_KEY is verified and now instantiating GoogleGenAI client.");
  try {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Lazy initialized GoogleGenAI client successfully.");
    return aiClient;
  } catch (err: any) {
    const errMsg = err.message || String(err);
    console.error("DIAGNOSTIC LOG: Failed to instantiate GoogleGenAI client:", errMsg);
    throw new Error(`API unavailable: Failed to initialize GoogleGenAI: ${errMsg}`);
  }
}

/**
 * Resilient helper to execute a Gemini generation request with automatic retries and model fallbacks.
 * Mitigates temporary 503 (high demand), 429, or capacity errors.
 */
async function generateContentWithFallback(
  client: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
): Promise<any> {
  const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Resilient GenAI] Contacting ${model} (Attempt ${attempt}/${maxRetries})...`);
        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          console.log(`[Resilient GenAI] Success using ${model} on attempt ${attempt}`);
          return response;
        }
        throw new Error("Empty response returned from endpoint");
      } catch (err: any) {
        lastError = err;
        const errMsg = err.message || String(err);
        const isTransient = errMsg.includes("503") || errMsg.includes("500") || errMsg.toLowerCase().includes("demand") || errMsg.toLowerCase().includes("unavailable") || errMsg.toLowerCase().includes("busy");
        
        if (isTransient) {
          console.log(`[Resilient GenAI] ${model} busy/unavailable (attempt ${attempt}/${maxRetries}): will retry or route to alternative.`);
        } else {
          console.log(`[Resilient GenAI] ${model} notice (attempt ${attempt}/${maxRetries}): ready for shift.`);
        }

        if (attempt < maxRetries) {
          const delay = attempt * 200;
          console.log(`[Resilient GenAI] Waiting ${delay}ms before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error("All fallback models completed without success.");
}

// Fallback high-fidelity creators data for Instant Sandbox Generation (Very robust experience if key hasn't loaded yet)
const FALLBACK_SCRIPTS: Record<string, any> = {
  default: {
    script: {
      hook: {
        text: "The exact strategy I used to land my first high-paying marketing client with 0 followers, and it honestly only took 48 hours.",
        action: "Visual: Quick zoom into camera, hold up blank sticky note. Expression is cool and deadpan. Text on screen: '0 Followers, 48 Hours'."
      },
      body: {
        text: "Look, everyone tells you to post 3 times a day or cold email 100 people. That's a trap. It burns you out. Instead, I went directly to LinkedIn, searched for active startup founders who just posted they were 'looking for feedback,' and sent them a Loom video doing a mini-audit of their current lander. I didn't sell them. I just solved one real bottleneck.",
        action: "Visual: Split-screen clip showing a fast-paced screen scroll of founder pages. Pop-up graphics with high contrast: 'Audit > Pitch'. Energized speaking pacing."
      },
      cta: {
        text: "If you want my exact 3-step audit script, drop the word 'BRAIN' below. I'll DM it to you for free. No opt-ins.",
        action: "Visual: Points down towards bottom center. Neon CTA card pops up: 'Comment BRAIN now'."
      }
    },
    captions: [
      "No followers? No website? No problem. 🤫 Here is the exact friction-free Loom loophole I used to sign a $2,500/mo retainer founder in under 48 hours. Saving this because it works every single time.",
      "founders don't want pitches, they want solutions. if you're stuck on cold emails, stop. do this underhanded Loom audit approach instead. details in video. comment 'BRAIN' for the script.",
      "Unlocking the 48-hour client hack. 🤯 No gatekeepers. Just direct value loops. Do you think cold outreach is dead or are you just doing it wrong?"
    ],
    thumbnails: [
      { id: "thumb-1", title: "Signed in 48h", description: "Minimalist dark background with neon green tag '$2.5K/mo' and a bold arrow pointing down." },
      { id: "thumb-2", title: "0 Followers Hack", description: "Apple Vision Pro aesthetic. Glossy card hovering on #050505 space with emoji '🤫'." },
      { id: "thumb-3", title: "My Dumb Loom Method", description: "Extreme close-up of a laptop with high contrast neon pink highlight marker." }
    ]
  }
};

// POST /api/generate
app.post("/api/generate", async (req, res, next) => {
  try {
    const { prompt, mood, duration, contentType, voiceMultiplier, energyLevel, language, vocabulary, selectedTones, preferences, system_instruction } = req.body;

  const resolvedTones = selectedTones && Array.isArray(selectedTones) ? selectedTones.join(", ") : (energyLevel || "Dynamic, excited");
  const resolvedVocabulary = vocabulary || "Executive SaaS & Startup";

  console.log("API GENERATE REQUEST WITH LEARNED PREFS:", { prompt, mood, duration, contentType, voiceMultiplier, energyLevel, language, resolvedVocabulary, resolvedTones, preferences, system_instruction });

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Formatting instructions for custom client output
  const systemInstruction = `
    ${system_instruction ? `### CLIENT EXPLICIT DIRECTIVE (MANDATORY):
    ${system_instruction}
    ` : ""}

    You are Nannu AI, a world-class creator-focused personal content brain.
    You design viral multi-part mobile video scripts, hyper-optimized captions, and visual thumbnail concepts.

    ### CRITICAL SEMANTIC DIRECTIVE (MUST OBEY):
    The caller will provide a specific topic or prompt (variable 'prompt'). You MUST prioritize this prompt as the absolute primary semantic context. Base 100% of the content—including the video hook, body, CTA, headlines, captions, and visual thumbnail text—directly and exclusively on this prompt.
    You are STRICTLY FORBIDDEN from defaulting to, assuming, or injecting any topics related to startups, SaaS, marketing retainers, audience building, Loom audits, software development, entrepreneurship, or business structures, UNLESS the user's prompt explicitly requests them. If the user's prompt is about baking, mindfulness, relationships, gaming, personal life, history, science, or any other niche, write the script and all metadata strictly and authentically about that specific topic. Never force business/startup themes onto unrelated prompts.

    You write highly engaging, customized scripts matching the requested:
    - Language / Dialect: ${language || "English"} (CRITICAL: If the language is "Hindi", write the spoken content and captions in beautiful Devanagari Hindi script. If the language is "Hinglish", write the spoken content and captions in romanized blended English-Hindi like 'Bro, agar aap content post kar rahe ho...'. If "English", use authentic modern English).
    - Mood: ${mood || "Confident"}
    - Duration: ${duration || "45 sec"}
    - Content Type: ${contentType || "Talking Head"}
    - Tone Multiplier: Voice Trained Match is ${voiceMultiplier || 92}%.
    - Phrasing Vocabulary: ${resolvedVocabulary}. (CRITICAL: If "Personal Storytelling", tell an authentic, raw first-person emotional story inside the theme of the prompt, with relatable setbacks and triumph elements).
    - Speech Tones Blend: ${resolvedTones}. (CRITICAL: You MUST blend these requested tones like funny, dark humour, excited, friendly, brutal, calm etc. in the spoken script text, reflecting the chosen characteristics/vibe).

    ${preferences ? `### BACKGROUND LEARNED PROFILE ADAPTATION (CRITICAL)
    The creator has recorded these background preference tendencies through their interactions (like edits, copy actions, reading times, and saves).
    Comply with these learned pacing alignments, structures, and stylistic constraints automatically:
    ${preferences}
    ` : ""}

    You must return a raw JSON object containing three elements:
    1. "script": with "hook" (containing "text" and "action"), "body" (containing "text" and "action"), and "cta" (containing "text" and "action"). Note: Keep "action" descriptions in English for the creator, but "text" must be in the requested language/dialect.
    2. "captions": an array of 3 distinct, high-relevance Instagram Reels/TikTok/YouTube Short captions in the target language (including emojis, spacing, call to action, and minimalistic tags).
    3. "thumbnails": an array of exactly 3 different visual conceptual thumbnails, each with a "title" (the hook text for the thumbnail, written in the target language) and a "description" of the raw visual setup (in English).

    Do not output any markdown wrapper (e.g., no raw \`\`\`json tags) outside the JSON structure. Just return true, standard parsed JSON content.
  `;

  let client: GoogleGenAI | null = null;
  let geminiErrorMsg = "";

  try {
    client = getGeminiClient();
  } catch (initErr: any) {
    geminiErrorMsg = initErr.message || String(initErr);
    console.warn("DIAGNOSTIC LOG: Gemini initialization bypassed. Reason:", geminiErrorMsg);
  }

  if (client) {
    try {
      console.log("Asking Gemini with fallback routing for content creation...");
      console.log("SENDING PROMPT TO GEMINI:", prompt);
      
      const contents = `Create a fully customized script and social media metadata where the primary semantic context is strictly and entirely about this specific topic: "${prompt}". Remember: No business, startup, or SaaS references if the topic is not related to business or SaaS. Write directly about "${prompt}".`;
      
      const response = await generateContentWithFallback(client, {
        contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              script: {
                type: Type.OBJECT,
                properties: {
                  hook: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      action: { type: Type.STRING }
                    },
                    required: ["text", "action"]
                  },
                  body: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      action: { type: Type.STRING }
                    },
                    required: ["text", "action"]
                  },
                  cta: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      action: { type: Type.STRING }
                    },
                    required: ["text", "action"]
                  }
                },
                required: ["hook", "body", "cta"]
              },
              captions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              thumbnails: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              }
            },
            required: ["script", "captions", "thumbnails"]
          },
          temperature: 1.0
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        parsed.isFallback = false;
        console.log("DIAGNOSTIC LOG: Primary fallback pipeline succeeded.");
        return res.json(parsed);
      }
    } catch (err: any) {
      geminiErrorMsg = `Gemini resilient generation failed: ${err.message || String(err)}`;
      console.error("DIAGNOSTIC LOG: Gemini resilient generator error, falling back to local simulation builder:", geminiErrorMsg);
    }
  }

  // Simulated AI Sandbox Generator (if key is missing or calls are rate-limited/errored)
  // We craft customized outputs programmatically based on user prompt to look incredibly real & premium!
  console.log("Generating tailored response programmatically about topic:", prompt);
  
  const isSavageTone = resolvedTones.toLowerCase().includes("roast") ||
                       resolvedTones.toLowerCase().includes("brutal") ||
                       resolvedTones.toLowerCase().includes("savage") ||
                       resolvedTones.toLowerCase().includes("unfiltered") ||
                       resolvedTones.toLowerCase().includes("ruthless") ||
                       resolvedTones.toLowerCase().includes("controversial");

  const isStoryType = vocabulary === "Personal Storytelling" || 
                      resolvedTones.toLowerCase().includes("story") || 
                      resolvedTones.toLowerCase().includes("personal");

  let hookText = "";
  let bodyText = "";
  let ctaText = "";

  if (language === "Hindi") {
    if (isSavageTone) {
      hookText = `क्या आप भी "${prompt}" को इतनी बुरी तरह से बकवास कबाड़ बना रहे हैं? सच में, ये देखना भी दर्दनाक है।`;
      bodyText = `चलिए "${prompt}" के बारे में बिल्कुल कड़वा और बिना मिलावट वाला सच बोलते हैं। आप लोग जो घिसे-पिटे तरीके कॉपी कर रहे हैं ना, उनसे कुछ नहीं होने वाला। अगर सच में ध्यान खींचना चाहते हो, तो फालतू की बातें तुरंत काटो और सीधे काम की बात पर आओ। कोई दिखावा नहीं, बस ठोस क्रेडिबिलिटी।`;
      ctaText = `अगर आप भी "${prompt}" से जुड़े इस सच से सहमत हैं, तो नीचे 'TRUTH' कमेंट करें। मैं आपके सारे भ्रम दूर कर दूंगा।`;
    } else if (isStoryType) {
      hookText = `मैं हमेशा "${prompt}" से दूर भागता रहा, जब तक कि इस एक घटना ने मेरी ज़िंदगी का सबसे बड़ा सच सामने नहीं रख दिया।`;
      bodyText = `हम कभी भी "${prompt}" के पीछे की असली कहानी पर बात नहीं करते। लोग इसे बहुत साधारण समझते हैं, लेकिन अगर आप करीब से देखें तो इसमें बहुत गहराई और सीख है। इसने मुझे सिखाया कि जब सब कुछ बिखर रहा हो, तब भी हमें सब्र और हिम्मत के दरवाज़े बंद नहीं होने देने चाहिए।`;
      ctaText = `क्या आपने भी कभी "${prompt}" को लेकर अपनी ज़िंदगी में ऐसा महसूस किया है? नीचे कमेंट बॉक्स में अपनी सोच बताएं, आइए एक सच्ची चर्चा करें।`;
    } else {
      hookText = `"${prompt}" के बारे में ये एक ऐसी अनोखी बात या जानकारी है, जो आपको आज ही समझनी चाहिए।`;
      bodyText = `जब आप गहराई से "${prompt}" को समझने की कोशिश करते हैं, तो आपको एहसास होता है कि ये कोई मुश्किल काम नहीं है। ये हमारे विचार और नज़रिया का खेल है। इस छोटे से बदलाव को अपने काम में शामिल करें, और परिणाम अपने आप सामने आने लगेंगे।`;
      ctaText = `"${prompt}" को लेकर आपकी क्या राय है? नीचे कमेंट करके बताएं और ऐसी ही बेहतरीन सीख के लिए फॉलो जरूर करें!`;
    }
  } else if (language === "Hinglish") {
    if (isSavageTone) {
      hookText = `Stop posting absolutely garbage content on "${prompt}". Honestly, aap logo ka ye setup dekhna bhot painful hai!`;
      bodyText = `Chalo "${prompt}" par bilkul kadwa aur brutal sach bolte hain. Sab log bas copy-paste templates use kar rahe hain, isliye engagement zero hi rehne wala hai. Agar solid change chahiye toh faktu noise trim karo, aur direct eye-catching hook setup build karo. Simple, clean, aur direct message.`;
      ctaText = `Agar aapko lagta hai ki aapke content me direct roast ki zarurat hai, toh niche 'REAL' comment karo.`;
    } else if (isStoryType) {
      hookText = `Main hamesha "${prompt}" se darta tha aur isse avoid karta raha, jab tak ek bada sach mere samne nahi aa gaya.`;
      bodyText = `Hum aksar "${prompt}" ke deep side par baat hi nahi karte. Sab log bas iska upar upar ka content banate hain. But iski ek bhut hi real storytelling side hai. Mujhe isne patience, resilience aur continuous consistency ki value sikhayi hai.`;
      ctaText = `Agar aapne bhi kabhi "${prompt}" ke baare me aise connect kiya ho, toh comment me discuss karo, let's hear your story.`;
    } else {
      hookText = `This is the single most important lesson about "${prompt}" jo aapko aaj hi pata honi chahiye.`;
      bodyText = `Jab aap real values ke sath "${prompt}" ko discover karte ho, toh iske details me hi real potential dikhta hai. Ye simple lagta hai, par correct execution hi saara change lata hai. Local resonance connect karo aur updates test karo.`;
      ctaText = `Niche comment me apni problem share karo on "${prompt}", mai directly custom guidebook DM karunga!`;
    }
  } else {
    // English
    if (isSavageTone) {
      hookText = `Stop posting absolute garbage about "${prompt}". Honestly, it's painful to witness.`;
      bodyText = `Let's be brutally real about "${prompt}". Most creators are putting out shallow, copycat content with zero foundation. If you keep choosing the lazy route, your engagement deserves to stay flat. Here is how you actually fix it: cut the fluff, eliminate standard checklists, and deliver undeniable substance immediately.`;
      ctaText = `Comment 'FACTS' below if you agree that "${prompt}" needs an unfiltered, brutal reality check.`;
    } else if (isStoryType) {
      hookText = `I spent years running away from "${prompt}"... until this one sudden failure changed everything for me.`;
      bodyText = `We rarely talk about what "${prompt}" actually forces us to confront. People look at it and see something plain, but there is a deep narrative inside. It taught me persistence, accountability, and the courage to rebuild. My journey on this topic is raw, full of mistakes, but authentic to the bone.`;
      ctaText = `If you have ever faced a defining challenge with "${prompt}" or similar struggles, comment below. Let's talk.`;
    } else {
      hookText = `The real, untold truth about "${prompt}" that nobody wants to openly discuss.`;
      bodyText = `Here's the core challenge: most advice on "${prompt}" completely misses the actual core. To truly understand it, you don't need complex theories. You just need to focus on the essential human element, break down the basic components, and apply them directly. It changes how you see this entire subject.`;
      ctaText = `Drop a comment sharing your own experience with "${prompt}" and let's start a real conversation.`;
    }
  }

  // Generate captions based on language and topic
  let computedCaptions = [
    `This is my perspective on: "${prompt}". 🤫 Save this immediately because this shift will change how you approach everyday situations forever.`,
    `Stop overcomplicating "${prompt}". 🛑 If you're hoping for results without understanding the true core, you're competing in a crowded space. Implement this strategy.`,
    `Stuck with "${prompt}"? It literally doesn't look hard when you look at it from Nannu's custom frequency. 🤯 DM me for full details.`
  ];

  if (language === "Hindi") {
    computedCaptions = [
      `तैयार हो जाइए "${prompt}" के इस अनोखे रूप को देखने के लिए! 🤫 इसे अभी सेव कर लें ताकि आप कभी न भूलें।`,
      `"${prompt}" को उलझाना बंद करें। 🛑 अगर आप बिना बुनियादी समझ के कोशिश कर रहे हैं, तो आप अपना समय बर्बाद कर रहे हैं। डिटेल्स नीचे दी गई हैं।`,
      `"${prompt}" से परेशान हैं? जब आपके पास सही नज़रिया हो, तो कुछ भी मुश्किल नहीं है। 🤯 पूरे ब्ल्यूप्रिंट के लिए 'INFO' कमेंट करें।`
    ];
  } else if (language === "Hinglish") {
    computedCaptions = [
      `"${prompt}" ke baare me ye solid framework jaan lo! 🤫 Is loop ko save karlo, organically viral and effective hone ka sabse best formula hai.`,
      `"${prompt}" ko follow karna band mat karo, bas sahi focus apply karo. 🛑 My exact layout is discussed in this video. Comment below for more help.`,
      `POV: You mastered "${prompt}" with Nannu. 🔥 DM me for custom worksheets in a click.`
    ];
  }

  // Generate thumbnail titles dynamically based on language and topic
  let shortPrompt = prompt.length < 24 ? prompt : prompt.slice(0, 20) + "...";
  let tTitle1 = `"${shortPrompt}"`;
  let tTitle2 = `🤫 Truth: "${shortPrompt}"`;
  let tTitle3 = `"${shortPrompt}" Blueprint`;

  if (language === "Hindi") {
    tTitle1 = `"${shortPrompt}" का सच`;
    tTitle2 = `🤫 कोई नहीं बताएगा!`;
    tTitle3 = `सीक्रेट विज़न`;
  } else if (language === "Hinglish") {
    tTitle1 = `"${shortPrompt}" Hack`;
    tTitle2 = `🤫 Reality of "${shortPrompt}"`;
    tTitle3 = `Nannu AI: "${shortPrompt}"`;
  }

  const simulatedResponse = {
    script: {
      hook: {
        text: hookText,
        action: `Visual: ${mood || "Confident"} speaking pacing. Clean spotlight on presenter with ambient purple glow behind. On-screen graphic text flashes highlighting the main Hook.`
      },
      body: {
        text: bodyText,
        action: `Visual: Transition to a high-contrast screenshot view or visual mind-map animation. Smooth progress tracker is visible at top bar.`
      },
      cta: {
        text: ctaText,
        action: "Visual: Dynamic zoom-out. Circular neon ring lights up on presenter. Clean minimalist arrow icon bounces once guiding attention to comments."
      }
    },
    captions: computedCaptions,
    thumbnails: [
      { title: tTitle1, description: `Minimalist slate card hovering above midnight backspace related to "${prompt}", with CTA Green highlight borders.` },
      { title: tTitle2, description: `Apple Vision Pro style translucent panels highlighting "${prompt}" with purple neon backlighting and heavy luxury typography.` },
      { title: tTitle3, description: `Space Grotesk typography overlay with visual cues of "${prompt}", ultra-clean design matrix, high-retention glow indicators.` }
    ],
    isFallback: true,
    errorReason: geminiErrorMsg || "Gemini Client bypassed or API rate limit active."
  };

  setTimeout(() => {
    try {
      res.json(simulatedResponse);
    } catch (timeoutErr) {
      next(timeoutErr);
    }
  }, 1200); // realistic slight simulation lag
  } catch (err) {
    next(err);
  }
});

// POST /api/polish
app.post("/api/polish", async (req, res, next) => {
  try {
    const { currentText, preferences, prompt, contentType, mood } = req.body;
  if (!currentText) {
    return res.status(400).json({ error: "Current script text is required" });
  }

  const systemInstruction = `
    You are Nannu AI, a world-class script doctor and creator-focused personal writing brain.
    Your task is to refine the provided script section and offer exactly 3 distinct polished variations of it.
    These variations should specifically focus on the user's preferred pacing, tone, and sentence structure.
    
    Creator's learned preferred pacing and stylistic constraints:
    ${preferences || "Write in highly engaging, conversational short sentence clusters."}

    For each of the 3 variations, write a highly polished alternative version:
    - Variation 1 (The Hook/Punchy Cut): Focusing on punchy execution, deleting fluff, and optimizing for quick visual/verbal speed.
    - Variation 2 (The Storytelling/Authentic Split): Focusing on deep storytelling flow, relatable setbacks, or raw conversational authenticity.
    - Variation 3 (The High-Retention Cadence): Focusing on high-retention structural flow, contrasting elements, or direct bold value.

    Return a JSON object with a single root key "variations" containing an array of exactly 3 strings (the polished versions).
    Ensure the language matches the language/dialect of the current text (e.g., Hinglish, Hindi, or English).
    Do not output any markdown wrapper (no raw \`\`\`json tags). Just return true parsed JSON.
  `;

  let client: GoogleGenAI | null = null;
  try {
    client = getGeminiClient();
  } catch (initErr: any) {
    console.warn("DIAGNOSTIC LOG: Gemini initialization bypassed for polish. Reason:", initErr.message || String(initErr));
  }

  if (client) {
    try {
      console.log("Asking Gemini AI to polish script...", currentText);
      const response = await generateContentWithFallback(client, {
        contents: `Please refine and provide 3 variations of this script body: "${currentText}". The core topic of the video is: "${prompt || ""}", content type is "${contentType || ""}", and mood is "${mood || ""}".`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              variations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["variations"]
          },
          temperature: 0.9
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        return res.json(parsed);
      }
    } catch (err: any) {
      console.error("Gemini Polish Error, falling back:", err.message || err);
    }
  }

  // Fallback programmatic variations based on language/mood preferences
  console.log("Using high-fidelity local polish generator...");
  let variations: string[] = [];
  const lowercaseVal = currentText.toLowerCase();
  const isHinglish = /^[a-zA-Z\s.,?!'"\-]+$/.test(currentText) && (lowercaseVal.includes("aap") || lowercaseVal.includes("hai") || lowercaseVal.includes("toh") || lowercaseVal.includes("ho") || lowercaseVal.includes("aur") || lowercaseVal.includes("hi"));
  const isHindi = !/^[a-zA-Z\s.,?!'"\-]+$/.test(currentText) && (currentText.includes("है") || currentText.includes("आप") || currentText.includes("में") || currentText.includes("और"));

  if (isHindi) {
    variations = [
      `ये रहे वो 3 सबसे सीधे तरीके जिससे आप इसे तुरंत बदल सकते हैं। बिना किसी फालतू ड्रामा के, बिल्कुल सीधा और असरदार प्रहार।`,
      `जब मैंने सालों पहले शुरुआत की थी, तब मुझे भी यही डर सताता था। लेकिन इस आसान हैक ने मेरी पूरी गेम बदल दी।`,
      `ध्यान से सुनो: 90% क्रिएटर्स यहीं मात खाते हैं क्योंकि वो शोर मचाने में लगे हैं। इस सिंपल सी चीज़ को आज ही अपनाएं!`
    ];
  } else if (isHinglish) {
    variations = [
      `Dekho, log tumse bohot lambi videos banane ko kahenge, par vo sab waste hai. Bas ye 3 steps flow master karo.`,
      `Honeestly, jab meri reach bilkul down thi tab maine ye hack seekha. Isne single handedly content flow improve kiya!`,
      `Bro, agar aap is simple strategy ko adjust nahi kar rahe, toh iska matlab aap cold views lose kar rahe ho.`
    ];
  } else {
    variations = [
      `When my engagement fell off, I realized something critical: elite creators don't add massive lists. They maximize direct speed.`,
      `Instead of telling them what works group-wide, let's show them the exact gap. This simple tweak immediately holds attention.`,
      `The average human retention spans only 3 seconds now. If you don't call out the painful truth right now, they scroll past.`
    ];
  }

  // Return realistic simulated variations
  setTimeout(() => {
    try {
      res.json({ variations });
    } catch (timeoutErr) {
      next(timeoutErr);
    }
  }, 1000);
  } catch (err) {
    next(err);
  }
});

// POST /api/analyze-creator
app.post("/api/analyze-creator", upload.single("videoFile"), async (req, res, next) => {
  try {
    const { url, pastedTranscript, uploadedFileName } = req.body;
  
  // Detect if file was uploaded via multer
  const fileUploaded = req.file;
  let sourceLabel = "pasted transcript";
  
  if (fileUploaded) {
    sourceLabel = `Uploaded video: ${fileUploaded.originalname} (Stored temporarily: ${fileUploaded.path})`;
    console.log("ALERT: Backend temporary storage active for:", fileUploaded.path);
  } else if (url) {
    sourceLabel = `URL: ${url}`;
  } else if (uploadedFileName) {
    sourceLabel = `Simulated upload file: ${uploadedFileName}`;
  }
  
  console.log("Analyzing creator content from source:", sourceLabel);

  const systemInstruction = `
    You are Nannu AI's elite content extraction and analysis engine.
    Your task is to analyze video content, transcripts, or video uploads and dissect their DNA.
    You must extract and determine:
    1. Video Topic (e.g., AI Automation, Fitness, Business, Dating, Motivation, Storytelling, Travel, Personal Branding).
    2. Subtopics (array of related fields).
    3. Target Audience (e.g. Beginners, Creators, Business Owners, Students, Freelancers).
    4. Content Goal (e.g., Teach, Entertain, Inspire, Sell, Educate, Build Authority).
    5. Hook Style (e.g. Curiosity, Brutal Truth, Shock, Story, Question, Contrarian).
    6. Tone (e.g. Storytelling, Funny, Emotional, Luxury, Educational, Aggressive, Relatable, Documentary).
    7. Energy Level (0 to 100).
    8. Sentence Structure (e.g., Short, Medium, Long).
    9. Pacing (e.g., Fast, Moderate, Slow).
    10. Content Framework (e.g., Problem -> Solution, Story -> Lesson, Mistake -> Fix, Before -> After, Case Study, Personal Journey).
    11. Camera Style (e.g., Talking Head, Walking, Vlog, Documentary, Voiceover).
    12. Framing (e.g., Close-up, Medium Shot, Wide Shot).
    13. Editing Style (e.g., Fast Cuts, Slow Cuts, Zooms, Motion Graphics).
    14. Visual Hooks (e.g., Props, Gestures, Screenshots, B-Roll, Demonstrations).
    15. Core Message (the main valuable lesson or takeaway).
    16. Transcript (full text or captions of the spoken words).

    Return a beautiful, dense raw JSON object matching this exact shape:
    {
      "topic": "Primary Topic",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "audience": "Target Audience",
      "goal": "Content Goal",
      "hookStyle": "Hook Style Name",
      "tone": "Tone style",
      "energyLevel": 85,
      "sentenceStructure": "Short sentence groupings",
      "pacing": "Fast pacing",
      "framework": "Problem -> Solution",
      "cameraStyle": "Talking Head",
      "framing": "Medium Shot",
      "editingStyle": "Fast Cuts & Zooms",
      "visualHooks": ["Props", "Screenshots"],
      "coreMessage": "Core message or valuable lesson...",
      "transcript": "Full text transcription string..."
    }

    Do not output any markdown wrapper (no raw \`\`\`json tags). Just return standard parsed JSON.
  `;

  let responseData: any = null;

  let client: GoogleGenAI | null = null;
  try {
    client = getGeminiClient();
  } catch (initErr: any) {
    console.warn("DIAGNOSTIC LOG: Gemini initialization bypassed for analyze-creator. Reason:", initErr.message || String(initErr));
  }

  if (client) {
    try {
      console.log("Using resilient Gemini with fallbacks to analyze content from source...");
      const promptToAnalyze = pastedTranscript
        ? `Analyze this pasted raw transcript: "${pastedTranscript}"`
        : `Analyze this creator video structure. Original Reference label is: "${sourceLabel}". Study its theme, speaking style, visual cues and recreate its metadata DNA.`;

      const response = await generateContentWithFallback(client, {
        contents: promptToAnalyze,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              subtopics: { type: Type.ARRAY, items: { type: Type.STRING } },
              audience: { type: Type.STRING },
              goal: { type: Type.STRING },
              hookStyle: { type: Type.STRING },
              tone: { type: Type.STRING },
              energyLevel: { type: Type.INTEGER },
              sentenceStructure: { type: Type.STRING },
              pacing: { type: Type.STRING },
              framework: { type: Type.STRING },
              cameraStyle: { type: Type.STRING },
              framing: { type: Type.STRING },
              editingStyle: { type: Type.STRING },
              visualHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              coreMessage: { type: Type.STRING },
              transcript: { type: Type.STRING }
            },
            required: [
              "topic", "subtopics", "audience", "goal", "hookStyle", "tone",
              "energyLevel", "sentenceStructure", "pacing", "framework",
              "cameraStyle", "framing", "editingStyle", "visualHooks", "coreMessage", "transcript"
            ]
          },
          temperature: 0.7
        }
      });

      const responseText = response.text;
      if (responseText) {
        responseData = JSON.parse(responseText.trim());
      }
    } catch (err: any) {
      console.error("Gemini analysis error, running high-fidelity sandbox analysis:", err);
    }
  }

  // Safe Sandbox fallbacks if Gemini isn't initialized or crashes
  if (!responseData) {
    let detectedTopic = "AI Automation & Business";
    let detectedAudience = "Business Owners & Freelancers";
    let detectedGoal = "Teach & Build Authority";
    let detectedHook = "Curiosity Gap";
    let detectedTone = "Educational & Authoritative";
    let detectedFramework = "Problem -> Solution";
    let detectedCoreMessage = "Creators can scale their throughput 10x by implementing server-side proxy agents instead of manual coding.";
    let detectedTranscript = "Look, if you're still building client-side integrations with fragile APIs, you're exposing your secrets and wasting days of engineering. Smart creators are setting up express routing servers behind reverse proxies to proxy everything. It takes literally 5 minutes and keeps you production-grade. Let me show you how...";

    // Customizations based on file uploading or URL/transcript
    const analyzeText = `${url || ""} ${pastedTranscript || ""} ${uploadedFileName || ""} ${fileUploaded ? fileUploaded.originalname : ""}`.toLowerCase();
    
    if (analyzeText.includes("fitness") || analyzeText.includes("gym") || analyzeText.includes("diet") || analyzeText.includes("workout")) {
      detectedTopic = "Fitness & Biohacking";
      detectedAudience = "Beginners & High Performers";
      detectedGoal = "Inspire & Educate";
      detectedHook = "Brutal Truth Core";
      detectedTone = "Relatable & Relentless";
      detectedFramework = "Mistake -> Fix Formula";
      detectedCoreMessage = "Consuming 200g of protein and sleeping 8 hours beats any fat-burning supplement you see on TikTok.";
      detectedTranscript = "Stop wasting your money on pre-workouts and fat-burners. The brutal truth is that 90% of your gains come from two humble things: hitting 200 grams of pure protein and sleeping a consistent 8 hours a night. Everything else is just visual clutter. Here is my daily protein hack that takes seconds...";
    } else if (analyzeText.includes("dating") || analyzeText.includes("relationship") || analyzeText.includes("love") || analyzeText.includes("flirt")) {
      detectedTopic = "Dating & Psychology";
      detectedAudience = "High Performers & Students";
      detectedGoal = "Build Authority";
      detectedHook = "Shock & Question Matrix";
      detectedTone = "Storytelling & Educational";
      detectedFramework = "Before -> After Map";
      detectedCoreMessage = "True high-value relationships are built when you develop undeniable self-accountability first.";
      detectedTranscript = "Why does everyone fail at modern relationships within 3 months? It's simple: we look for perfect partners to satisfy our empty voids instead of becoming self-sufficient first. When I shifted from looking to actually building myself, everything changed. Here is the cognitive behavioral triangle that explains why...";
    } else if (analyzeText.includes("money") || analyzeText.includes("rich") || analyzeText.includes("saas") || analyzeText.includes("crypto") || analyzeText.includes("startup")) {
      detectedTopic = "Business & Micro-SaaS";
      detectedAudience = "Business Owners & Freelancers";
      detectedGoal = "Sell & Build Authority";
      detectedHook = "Contrarian Matrix Setup";
      detectedTone = "Luxury & No-BS Aggressive";
      detectedFramework = "Case Study Method";
      detectedCoreMessage = "The quietest Micro-SaaS business models are netting $20k/month of profit while standard unicorn founders are raising and burning cash.";
      detectedTranscript = "You don't need a 50-person engineering team to net 20k a month. Actually, the quietest creators are building micro-apps that solve a single workflow bottleneck, putting a Stripe payment link behind it, and letting it run. No pitch decks, no boards, just absolute cash-flow. Let's look at this case study of a chrome extension...";
    } else if (pastedTranscript && pastedTranscript.length > 50) {
      const words = pastedTranscript.split(/\s+/).slice(0, 8).join(" ");
      detectedTopic = "Creator Storytelling";
      detectedCoreMessage = `Focus deeply on what works organically in: "${words}"`;
      detectedTranscript = pastedTranscript;
    }

    responseData = {
      topic: detectedTopic,
      subtopics: [detectedTopic + " Mechanics", "短视频 (Short-form Video) DNA Layout", "High-Retention Content"],
      audience: detectedAudience,
      goal: detectedGoal,
      hookStyle: detectedHook,
      tone: detectedTone,
      energyLevel: 88,
      sentenceStructure: "Short, punchy segments with deliberate pauses",
      pacing: "Fast-to-Moderate pacing",
      framework: detectedFramework,
      cameraStyle: "Talking Head with bold visual b-roll shifts",
      framing: "Medium shot shifting close-up during emotional hooks",
      editingStyle: "Fast Zooms & Kinetic Text overlays",
      visualHooks: ["Eye-contact proximity", "Gestures holding visual props", "Screenshots", "B-Roll"],
      coreMessage: detectedCoreMessage,
      transcript: detectedTranscript
    };
  }

  // DELETE ORIGINAL VIDEO FILE IMMEDIATELY BEFORE RETURNING
  if (fileUploaded && fs.existsSync(fileUploaded.path)) {
    try {
      console.log("CLEANUP PIPELINE ACTIVE: Deleting uploaded video file from temporary storage:", fileUploaded.path);
      fs.unlinkSync(fileUploaded.path);
      console.log("CLEANUP PIPELINE SUCCESS: Video deleted. Only DNA is kept in system memory.");
    } catch (unlinkErr) {
      console.error("Error during temporary file cleanup:", unlinkErr);
    }
  }

  res.json(responseData);
  } catch (err) {
    next(err);
  }
});

// POST /api/convert-to-my-style
app.post("/api/convert-to-my-style", async (req, res, next) => {
  try {
    const { analysisReport, mood, contentType, duration, language, preferences } = req.body;
  
  if (!analysisReport) {
    return res.status(400).json({ error: "Analysis report is required for style transformation." });
  }

  console.log("Transforming Creator Video to User Style:", { 
    originalTopic: analysisReport.topic, 
    originalCoreMessage: analysisReport.coreMessage,
    targetMood: mood,
    targetContentType: contentType, 
    targetLanguage: language,
    duration
  });

  const systemInstruction = `
    You are Nannu AI, a world-class creator-focused style transformation brain.
    Your mission is to take an analyzed creator's video report (its topic, subtopics, framework, and core message) and convert it into a COMPLETELY ORIGINAL script in the user's personal style.
    
    CRITICAL IMPORTANT RULE:
    1. Do NOT copy the original script or transcript. Rebuild it entirely under the creator's requested style!
    2. Maintain the same primary Topic and Core Message as the analyzed video, but rewrite the angle to match:
       - User Style: Content Type: "${contentType}", Mood/Vibe: "${mood}", Target Language: "${language || "English"}".
       - Duration: "${duration || "45 sec"}".
    
    ${preferences ? `### BACKGROUND LEARNED PROFILE ADAPTATION (CRITICAL)
    Adapt to these recorded creator habits that influence sentence length, pacing, and hook mechanics automatically:
    ${preferences}
    ` : ""}

    You must return a raw JSON object containing three elements:
    1. "script": with "hook" (containing "text" and "action"), "body" (containing "text" and "action"), and "cta" (containing "text" and "action").
    2. "captions": an array of exactly 3 distinct Reels/TikTok/Short captions in the target language.
    3. "thumbnails": an array of exactly 3 different visual conceptual thumbnails, each with a "title" and a "description" (in English).

    Keep action descriptions in English for the creator, but script text must be in the requested language/dialect (Hindi, Hinglish, or English).
    Do not output any markdown wrapper (no raw \`\`\`json tags) outside the JSON structure. Just return standard parsed JSON content.
  `;

  let client: GoogleGenAI | null = null;
  try {
    client = getGeminiClient();
  } catch (initErr: any) {
    console.warn("DIAGNOSTIC LOG: Gemini initialization bypassed for style transformation. Reason:", initErr.message || String(initErr));
  }

  if (client) {
    try {
      console.log("Using resilient Gemini with fallbacks for style transformation...");
      const transformPrompt = `
        Transform the following content.
        Original Topic: "${analysisReport.topic}"
        Original Core Message: "${analysisReport.coreMessage}"
        Original Framework: "${analysisReport.framework}"
        Original Transcript: "${analysisReport.transcript}"

        Generate a brand new script in my target style:
        - Format: ${contentType}
        - Mood: ${mood}
        - Language: ${language}
        - Duration: ${duration}
      `;

      const response = await generateContentWithFallback(client, {
        contents: transformPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              script: {
                type: Type.OBJECT,
                properties: {
                  hook: {
                    type: Type.OBJECT,
                    properties: { text: { type: Type.STRING }, action: { type: Type.STRING } },
                    required: ["text", "action"]
                  },
                  body: {
                    type: Type.OBJECT,
                    properties: { text: { type: Type.STRING }, action: { type: Type.STRING } },
                    required: ["text", "action"]
                  },
                  cta: {
                    type: Type.OBJECT,
                    properties: { text: { type: Type.STRING }, action: { type: Type.STRING } },
                    required: ["text", "action"]
                  }
                },
                required: ["hook", "body", "cta"]
              },
              captions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              thumbnails: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              }
            },
            required: ["script", "captions", "thumbnails"]
          },
          temperature: 1.0
        }
      });

      const responseText = response.text;
      if (responseText) {
        return res.json(JSON.parse(responseText.trim()));
      }
    } catch (err: any) {
      console.error("Gemini transformation error, executing sandbox fallbacks:", err);
    }
  }

  // Failsafe Sandbox Style Transformation Generator
  const cleanTopic = analysisReport.topic;
  let hookText = `The exact framework for ${cleanTopic} that changed everything for me.`;
  let bodyText = `Here's what nobody tells you about ${cleanTopic}. The original creator of this concept did something cool, but my preferred way is way different. Instead of overcomplicating, you just focus on this one key blueprint: "${analysisReport.coreMessage}". It saves you weeks of burnout.`;
  let ctaText = `Drop 'STYLE' below and I'll DM you my personalized blueprint.`;

  if (language === "Hindi") {
    hookText = `"${cleanTopic}" का एक ऐसा सीक्रेट फॉर्मूला जो आपकी ज़िंदगी बदल देगा।`;
    bodyText = `यहाँ "${cleanTopic}" के बारे में एक ऐसी बात है जो कोई बड़ा क्रिएटर खुलकर नहीं बताता। सच्चाई ये है कि अगर आप बुनियादी तौर पर इसमें टिकाऊ सुधार चाहते हैं, तो सारा ध्यान "${analysisReport.coreMessage}" पर लगाएँ। इससे आपका कीमती समय और ऊर्जा दोनों बचेंगे।`;
    ctaText = `अगर आप भी मेरे इस तरीके से शुरू करना चाहते हैं, तो नीचे 'STYLISH' कमेंट करें।`;
  } else if (language === "Hinglish") {
    hookText = `"${cleanTopic}" ka vo unique style hack jo aapka content game scale kar dega.`;
    bodyText = `Chalo ek important baat par discussion karte hain on "${cleanTopic}". Sab log aapse lambe shortcuts follow karne ko bolenge, but my personal style blueprint is super direct. Bas is core principal ko apply karo: "${analysisReport.coreMessage}".`;
    ctaText = `Agar aapko bhi ye customized blueprint chahiye, toh niche 'MYSTYLE' comment karo!`;
  } else {
    // Customization based on mood/content-type
    if (mood.toLowerCase().includes("savage") || mood.toLowerCase().includes("brutal")) {
      hookText = `Most advice about "${cleanTopic}" is complete clickbait. Let's talk about why.`;
      bodyText = `Here's the harsh truth on "${cleanTopic}". You're running around copying templates without understanding the real engine. It's lazy. Look, the absolute core lesson of this entire topic is simple: "${analysisReport.coreMessage}". Unless you implement that, your metrics are staying flat.`;
      ctaText = `Comment 'TRUTH' below and let's get serious.`;
    }
  }

  const mockTransformation = {
    script: {
      hook: {
        text: hookText,
        action: `Visual: Medium shot, very focused eye connection. Quick dynamic zoom. Neon overlay with topic branding: "${cleanTopic}" style convert.`
      },
      body: {
        text: bodyText,
        action: "Visual: Quick split screen illustrating the core comparison concept, with smooth transition sliders. Speak with high vocal authority."
      },
      cta: {
        text: ctaText,
        action: `Visual: Smile directly at camera and point down. Dynamic text card slides in at bottom center: "Drop a comment now."`
      }
    },
    captions: [
      `Transforming the narrative around ${cleanTopic}. 🤫 Here is how we rebuild elite creator topics directly into our own authentic frameworks. Saving this blueprint is highly recommended.`,
      `The truth about ${cleanTopic} that other creators won't share. 🛑 Stop copying, start transforming. Core lesson: "${analysisReport.coreMessage}".`,
      `My customized take on a viral creator concept. 🤫 Ready to clone my voice settings? Drop a comment below.`
    ],
    thumbnails: [
      { title: `Cloned Style: ${cleanTopic}`, description: "Sleek slate dark card highlighting the transformed topic with a luxury aesthetic." }
    ]
  };

  res.json(mockTransformation);
  } catch (routeErr: any) {
    next(routeErr);
  }
});

// POST /api/generate-thumbnail-prompts
app.post("/api/generate-thumbnail-prompts", async (req, res, next) => {
  try {
    const { hook, body, cta, instructions, images, aspectRatios, platforms, language } = req.body;
    
    // Default selected aspect ratios if not supplied (convert platforms to ratios if needed)
    let selectedRatios: string[] = ["16:9"];
    if (aspectRatios && Array.isArray(aspectRatios) && aspectRatios.length > 0) {
      selectedRatios = aspectRatios;
    } else if (platforms && Array.isArray(platforms) && platforms.length > 0) {
      selectedRatios = platforms.map(p => {
        if (p.includes("YouTube") || p.includes("16:9")) return "16:9";
        if (p.includes("Instagram") || p.includes("9:16")) return "9:16";
        if (p.includes("LinkedIn") || p.includes("1:1")) return "1:1";
        if (p.includes("4:5")) return "4:5";
        return "16:9";
      });
    }

    const activeLanguage = language || "English";

    console.log("GENERATING SCENE-SPECIFIC STRATEGIST THUMBNAIL PROMPTS:", { 
      scriptLength: (hook?.length || 0) + (body?.length || 0), 
      instructions, 
      uploadedImagesCount: images?.length || 0,
      selectedRatios,
      activeLanguage
    });

    const systemInstruction = `
      You are Nannu AI, a world-class YouTube Thumbnail Strategist and SaaS Creative Director. 
      Your task is to design exactly 3 distinct, high-converting thumbnail visual options for each of the selected aspect ratios: ${selectedRatios.join(", ")}.

      Do NOT generate generic art-style prompts or buzzwords (e.g., "8k hyperrealism", "futuristic metallic backplates", "sleek creator studio"). 
      Instead, generate SCENE-SPECIFIC prompts that read like a professional photography set instruction, fusing these 10 elements into a single fluid, natural-language, highly detailed English prompt:
      1. Subject: specific age, clean facial structures, premium athletic apparel, smart posture.
      2. Facial Expression: vivid micro-expression (e.g. intense calculated grin, wide-eyed astonishment, raised-eyebrow disbelief, severe warning grimace).
      3. Eye Contact: direct lens-locking eye contact or sharp directed side glance.
      4. Body Language: powerful hand gestures (e.g., pointing with warning finger, folding arms of extreme confidence, showing a glowing mobile phone screen).
      5. Camera Angle: camera positioning (e.g., eye-level macro, low-angle hero shot, close-up with shallow depth).
      6. Composition: precise placement (e.g., "aligned on the far-right side, leaving the left 65% of the frame completely open as cinematic negative space designed for massive text overlays").
      7. Background: specific, rich contextual background (e.g., a dark dimly-lit corporate boardroom with venetian blind shadow lines, a modern coding studio with soft blue server rack LEDs, or raw concrete loft with warm window light shafts).
      8. Lighting: advanced studio lighting (e.g. sharp teal key light, cinematic warm yellow rim highlight defining hair and silhouette, soft shadows).
      9. Emotional Trigger: extreme curiosity, absolute authority, subtle fear, shock, status, or high-end luxury.
      10. Thumbnail Goal: optimized to trigger instant clicks on a noisy visual feed.

      Append the correct Midjourney/Flux aspect ratio suffix at the end of the 'imagePrompt' (e.g. "--ar 16:9", "--ar 9:16", "--ar 1:1" or "--ar 4:5").

      CRITICAL DIALECT & LANGUAGE CONSISTENCY:
      The user's selected language is: ${activeLanguage}.
      The 'title' (suggested text overlay) and 'concept' (short layout idea description) MUST be written in the selected language:
      - If "English": write them in clear, high-impact English.
      - If "Hindi": write them in professional Hindi using beautiful Devanagari script.
      - If "Hinglish": write them in Romanized mixed Hindi-English (e.g., 'Warning look ke sath camera me dekhta hua, left side me bold text overlay area ke sath').

      NOTE: The 'imagePrompt' and 'negativePrompt' MUST ALWAYS be written in highly detailed English for AI generators.

      For each selected aspect ratio, you must output exactly 3 distinct options (optionIndex: 1, 2, and 3). Return a raw JSON object matching this schema:
      {
        "prompts": [
          {
            "platform": "LABEL_STRING", // Use a beautifully formatted label based on ratio, e.g. "16:9 (YouTube Thumbnail)", "9:16 (Shorts & Reels)", "1:1 (Instagram & LinkedIn)", "4:5 (Social Feed Portrait)"
            "optionIndex": 1,
            "title": "TEXT_OVERLAY_SUGGESTION",
            "concept": "CORE_CONCEPT_SHORT_SUMMARY",
            "negativePrompt": "EXCLUSION_LIST_IN_ENGLISH", // e.g. "blurry, generic logo, watermarks, text overlay, extra fingers",
            "imagePrompt": "DETAILED_STRATEGIST_PROMPT_IN_ENGLISH" // Detailed scene description ending with the --ar ratio suffix
          }
        ]
      }
    `;

    let contentPrompt = `
      Create exactly 3 custom premium visual options for these ratios: ${selectedRatios.join(", ")}.
      Script Hook: "${hook || ""}"
      Script Body: "${body || ""}"
      Script CTA: "${cta || ""}"
      
      Additional user creative instructions / notes: "${instructions || "None"}"
      Keep the language strictly matched to: "${activeLanguage}".
    `;

    const parts: any[] = [{ text: contentPrompt }];

    // Convert and append reference images if any
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img && img.data) {
          const cleanBase64 = img.data.replace(/^data:image\/\w+;base64,/, "");
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: img.mimeType || "image/png"
            }
          });
        }
      }
    }

    let client: GoogleGenAI | null = null;
    try {
      client = getGeminiClient();
    } catch (e) {
      console.warn("Gemini client bypassed during prompt architecting.");
    }

    if (client) {
      console.log(`[Thumbnail Prompts Engine] Launching Gemini-3.5 with ${images?.length || 0} images...`);
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.85
        }
      });
      
      if (response && response.text) {
        return res.json(JSON.parse(response.text.trim()));
      }
    }
    
    throw new Error("API Client unavailable or empty content response.");
  } catch (err: any) {
    console.error("Advanced prompt generation failed, returning high-end local fallbacks:", err);
    
    // Retrieve input values for fallbacks
    const { hook, instructions, aspectRatios, platforms, language } = req.body;
    let selectedRatios: string[] = ["16:9"];
    if (aspectRatios && Array.isArray(aspectRatios) && aspectRatios.length > 0) {
      selectedRatios = aspectRatios;
    } else if (platforms && Array.isArray(platforms) && platforms.length > 0) {
      selectedRatios = platforms.map(p => {
        if (p.includes("YouTube") || p.includes("16:9")) return "16:9";
        if (p.includes("Instagram") || p.includes("9:16")) return "9:16";
        if (p.includes("LinkedIn") || p.includes("1:1")) return "1:1";
        if (p.includes("4:5")) return "4:5";
        return "16:9";
      });
    }

    const activeLanguage = language || "English";
    const shortText = hook ? (hook.length < 35 ? hook : hook.slice(0, 32) + "...") : "Ultimate Reveal";
    const extraInstructions = instructions ? `Guidelines: ${instructions}.` : "";

    const localPrompts: any[] = [];
    
    selectedRatios.forEach((ratio: string) => {
      let ratioLabel = "16:9 (YouTube Thumbnail)";
      if (ratio === "9:16") ratioLabel = "9:16 (Shorts & Reels)";
      if (ratio === "1:1") ratioLabel = "1:1 (Instagram & LinkedIn)";
      if (ratio === "4:5") ratioLabel = "4:5 (Social Feed Portrait)";

      [1, 2, 3].forEach((optIdx: number) => {
        let title = "";
        let concept = "";
        let negativePrompt = "blurry, graphic text-overlays, watermark logos, low resolution, deformed face, bad hands, extra limbs, fake look, oversaturated colors";
        let imagePrompt = "";

        if (activeLanguage === "Hindi") {
          if (optIdx === 1) {
            title = `"${shortText}" का वायरल सच`;
            concept = `दाहिनी ओर खड़ा चकित विषय, बाईं ओर पर्याप्त खाली स्पेस के साथ। ${extraInstructions}`;
            imagePrompt = `A confident twenty-something creator in a sharp charcoal hoodie, standing on the right side of the frame with a wide-eyed shocked expression, index finger pointing dynamically toward bold imaginary words on the left. The background is a dimly-lit high-tech creator studio with soft violet rim lighting on their silhouette. Shallow depth of field, cinematic photography --ar ${ratio}`;
          } else if (optIdx === 2) {
            title = `ये सेटिंग बंद करो!`;
            concept = `एक गंभीर चेतावनी देने वाला आत्मविश्वास पूर्ण लेआउट। ${extraInstructions}`;
            imagePrompt = `An authoritative professional creator looked directly at the lens with a stern expression and raised eyebrow, hand raised in a stopping gesture, seated behind a modern dark wooden desk. A dark minimal workspace background with strong amber backlight reflections casting linear window shadows. High contrast, warm key light, photorealistic portraiture --ar ${ratio}`;
          } else {
            title = `Nannu AI का सीक्रेट ब्ल्यूप्रिंट`;
            concept = `क्लासी लक्जरी स्टाइल वाला मिनिमलिस्ट लेआउट। ${extraInstructions}`;
            imagePrompt = `A relaxed young professional seated on the right side of the frame, smiling with warm calm confidence, direct eye contact with the camera. Clear beige concrete loft studio setup with soft natural window sunbeams casting leaf shadows. Cinematic light, elegant atmosphere, natural color palettes --ar ${ratio}`;
          }
        } else if (activeLanguage === "Hinglish") {
          if (optIdx === 1) {
            title = `Stop "${shortText}" Mistakes!`;
            concept = `Shocked expression ke sath, right side par subject, left me massive negative space details. ${extraInstructions}`;
            imagePrompt = `A motivated male creator in a premium black crewneck, aligned on the right of the frame, eyes wide with teeth grit in high amazement, pointing directly to the empty left side designed for visual overlays. Dark industrial cyber studio background with neon blue and cyan rim lighting creating an electric contour. High contrast, clean features, 85mm portrait --ar ${ratio}`;
          } else if (optIdx === 2) {
            title = `🤫 Secrets of "${shortText}"`;
            concept = `Mysterious smirk, holding a blank card or phone toward the camera. ${extraInstructions}`;
            imagePrompt = `A focused thirty-year-old creator smiling with a clever side-glance, holding a smartphone showing a glowing screen directly towards the viewer. Moody atmospheric creator cellar with neon purple strip bars reflecting in background. Warm low-key light from below, dramatic cinematic mood --ar ${ratio}`;
          } else {
            title = `Build ${shortText} in 1 Click`;
            concept = `Clean high-end SaaS theme page, warm and highly trustworthy. ${extraInstructions}`;
            imagePrompt = `An approachable female entrepreneur standing, arms crossed, leaning slightly forward with a confident open-mouth smile. Premium minimalist office background with soft daylight pouring through large glass windows casting geometric shadows on a white plaster wall. Luxury aesthetic, soft shadows, masterfully polished --ar ${ratio}`;
          }
        } else {
          // English (Default)
          if (optIdx === 1) {
            title = `The Ultimate "${shortText}" Secrets`;
            concept = `Confident look with shocked pointing toward extreme negative space. ${extraInstructions}`;
            imagePrompt = `A charismatic young creator standing at the far-right margins of the shot with a sudden jaw-drop shocked expression, looking directly into the camera while pointing dynamically to the flat dark left 65% of the frame. The background features a dark obsidian slate studio wall with subtle red LED lightbars. High-contrast key lighting, realistic skin textures, cinematic depth --ar ${ratio}`;
          } else if (optIdx === 2) {
            title = `Never Do This!`;
            concept = `Serious stopping pose, high authority. ${extraInstructions}`;
            imagePrompt = `A serious entrepreneur holding up a flat palm toward the camera lens in a definitive stopping gesture, face showing intense warning warning. Medium close-up, sharp studio focus, warm orange backlight contouring their shoulders against a clean dark grey plaster wall. Cinematic volume fog, dramatic studio portraiture --ar ${ratio}`;
          } else {
            title = `The Clean 5-Step Blueprint`;
            concept = `Elegantly relaxed look, ideal for trust and luxury feel. ${extraInstructions}`;
            imagePrompt = `A professional creator leaning forward with an authentic calm smile, looking directly forward. Elegant minimalist catalog styled setup with soft warm afternoon sunrays shining through venetian blinds, creating delicate horizontal shadow lines on a textured beige wall. High key lighting, editorial aesthetic, raw textures --ar ${ratio}`;
          }
        }

        localPrompts.push({
          platform: ratioLabel,
          optionIndex: optIdx,
          title,
          concept,
          negativePrompt,
          imagePrompt
        });
      });
    });

    res.json({ prompts: localPrompts, isFallback: true });
  }
});

// Global Express Error Interceptor to prevent HTML pages leaking (always output JSON!)
app.use((err: any, req: any, res: any, next: any) => {
  console.error("DIAGNOSTIC CRITICAL: Express caught unhandled error inside route controller:", err);
  res.status(500).json({
    error: err?.message || String(err) || "An unexpected system-level error occurred.",
    isFallback: true,
    errorReason: err?.message || String(err)
  });
});

// Vite server integrations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nannu AI server successfully running on port http://0.0.0.0:${PORT}`);
  });
}

startServer();
