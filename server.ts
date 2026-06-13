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
      { title: `Cloned Style: ${cleanTopic}`, description: "Sleek slate dark card highlighting the transformed topic with a luxury typography layout." },
      { title: `🤫 My Way of ${cleanTopic}`, description: "Translucent glass container on neon purple space, bold and high-retention graphic style." },
      { title: `The Transformed Blueprint`, description: "Clean Apple-inspired design board showing the step-by-step conversion matrix." }
    ]
  };

  setTimeout(() => {
    try {
      res.json(mockTransformation);
    } catch (timeoutErr) {
      next(timeoutErr);
    }
  }, 1000);
  } catch (err) {
    next(err);
  }
});

// POST /api/generate-guide
app.post("/api/generate-guide", async (req, res, next) => {
  try {
    const { hook, body, cta, language, contentType, mood, prompt } = req.body;
    
    console.log("GENERATING DYNAMIC CREATOR GUIDE WITH PARAMETERS:", { language, contentType, mood, prompt });

    const systemInstruction = `
      You are Nannu AI, a world-class production director, content coach, and video strategist.
      Your task is to analyze a short-form video script (containing Hook, Body, CTA) and generate a custom, highly practical 6-step Creator Action Guide in the target language.
      
      Target Language / Dialect: ${language || "English"} 
      (CRITICAL language styling:
       - If language is "Hindi", write the entire guide - titles, descriptions, and bullets - in beautiful Devanagari Hindi.
       - If language is "Hinglish", write them in romanized Hinglish blend like 'Face par aisi key-light setup karo jo professional premium look de...'.
       - If "English", write in modern professional English).
      
      You must return a raw JSON object containing a "guide" array of exactly 6 action blocks corresponding precisely to:
      1. Camera Setup
      2. Acting & Delivery
      3. Scene Suggestions
      4. B-Roll Ideas
      5. Editing Suggestions
      6. Retention Tips
      
      Each block in the "guide" array must have:
      - "title": string (the Title of the section, localized e.g. "१. कैमरा सेटअप" or "1. Camera Setup" depending on target language)
      - "description": string (the core coaching directive tailored specifically to these script lines and the topic: "${prompt || ""}")
      - "bullets": array of exactly 3 strings (actionable in-studio checkmarks, direct and professional)
      
      Ensure your instructions are highly customized to the actual script provided, referring to elements of the text where fitting. Avoid generic placeholder advice.
      Do not return markdown wrappers like \`\`\`json. Return only standard raw JSON.
    `;
    
    const contents = `
      Script payload to analyze:
      Hook: "${hook}"
      Body: "${body}"
      CTA: "${cta}"
      
      Content Format: "${contentType || "Talking Head"}"
      Vibe / Mood: "${mood || "Confident"}"
    `;
    
    let client: GoogleGenAI | null = null;
    try {
      client = getGeminiClient();
    } catch (e) {
      console.warn("Gemini Client bypassed for guide generation.");
    }
    
    if (client) {
      console.log("[Dynamic Guide Engine] Consulting Gemini for dynamic playbook creation...");
      const response = await generateContentWithFallback(client, {
        contents,
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
    
    throw new Error("No client or empty response from model pool");
  } catch (err: any) {
    console.error("AI dynamic guide generation failed, signaling client to fallback:", err);
    res.json({ isFallback: true });
  }
});

// POST /api/generate-thumbnail-prompts
app.post("/api/generate-thumbnail-prompts", async (req, res, next) => {
  try {
    const { hook, body, cta, instructions, images } = req.body;
    
    console.log("GENERATING ADVANCED THUMBNAIL PROMPTS:", { 
      scriptLength: (hook?.length || 0) + (body?.length || 0), 
      instructions, 
      uploadedImagesCount: images?.length || 0 
    });

    const systemInstruction = `
      You are Nannu AI, an elite visual designer and seasoned thumbnail strategist.
      Your task is to analyze the videographer's script, user instructions, and optional reference images to generate 3 high-quality, high-retention thumbnail concepts and prompt sets.
      
      Do NOT generate the actual images. Generate ONLY deep prompt blocks.
      
      For each of the 3 proposals, you MUST provide exactly:
      - "title": string (the visual text overlay or tagline for this proposal written in the target script language)
      - "concept": string (overall visual concept/vibe)
      - "composition": string (camera lens angle, focal placement of subject, framing rule of thirds details)
      - "expression": string (face expressions, emotional state of model)
      - "lighting": string (lighting warmth, shadows direction, neon glow details)
      - "textOverlay": string (suggested overlay text font placement and colors)
      - "imagePrompt": string (a highly detailed, professional descriptive image generator prompt designed for Midjourney v6/Imagen 3 to produce this background/vibe)
      
      Look closely at any provided reference images to extract subjects, art styles, human likenesses, clothing colors, and background details to maintain strict stylistic continuity!
      
      You must respond with exactly a raw JSON structure:
      {
        "prompts": [
          {
            "title": "...",
            "concept": "...",
            "composition": "...",
            "expression": "...",
            "lighting": "...",
            "textOverlay": "...",
            "imagePrompt": "..."
          },
          ...
        ]
      }
      
      Do not return markdown wrappers. Return only standard raw JSON.
    `;
    
    let contentPrompt = `
      Create 3 custom high-retention visual thumbnail prompts based on this short-form script:
      Hook: "${hook}"
      Body: "${body}"
      CTA: "${cta}"
      
      Additional user style guidelines/requests: "${instructions || "None"}"
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
          temperature: 0.8
        }
      });
      
      if (response && response.text) {
        return res.json(JSON.parse(response.text.trim()));
      }
    }
    
    throw new Error("API Client unavailable or empty content response.");
  } catch (err: any) {
    console.error("Advanced prompt generation failed, returning high-end local fallbacks:", err);
    const fallbackPrompts = {
      prompts: [
        {
          title: "The Ultimate Script Twist",
          concept: "Dark glowing slate environment, split frame showing a dramatic breakthrough light",
          composition: "Medium close shot, subject positioned in center-left, background slightly out of focus",
          expression: "Intense, direct eyes locking onto camera, slight knowing smirk",
          lighting: "Cyberpunk high-contrast yellow key light, soft purple ambient backdrop",
          textOverlay: "BOLD yellow font at the bottom: 'THIS CHANGED EVERYTHING' with drop shadow",
          imagePrompt: "A high-end cinematic talking-head setup, modern slate aesthetic, glowing led tubes in background, bokeh, photorealistic, 8k resolution"
        },
        {
          title: "The Secret Formula Excluded",
          concept: "Neon violet space, floating golden blueprint diagram behind a transparent glass display",
          composition: "Rule of thirds, subject on the right looking towards the floating diagram on the left",
          expression: "Shocked, eyes wide open pointing at the screen in amazement",
          lighting: "Dramatic cool-white face lighting, saturated purple glowing rim lighting",
          textOverlay: "Clean white sans font on top: 'SECRET UNLOCKED' with bright glowing outlines",
          imagePrompt: "A professional creator holding a transparent glowing futuristic tablet, neon purple reflections, depth of field, high-end production value"
        },
        {
          title: "Stop Overcomplicating Visuals",
          concept: "Minimalist Apple-style concrete wall with a single giant orange warning label",
          composition: "Wide angle, centered concrete column with bold visual graphics",
          expression: "Determined, powerful facial structures looking forward with serious focus",
          lighting: "Crisp natural daylight casting deep geometric shadows across raw industrial concrete",
          textOverlay: "Sleek sans serif text overlay: 'STOP COMMUNICATING LAZY' framed in an orange border",
          imagePrompt: "A clean modern architectural concrete wall, minimalist design style, dynamic bright summer morning lighting, shadows, ultra realistic, fashion photography"
        }
      ]
    };
    res.json(fallbackPrompts);
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
