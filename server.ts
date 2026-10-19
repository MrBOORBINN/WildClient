import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { 
  Memory, 
  rankMemories, 
  formatMemoriesForContext, 
  detectUserCorrection,
  isSensitive,
  isTransientQuery,
  extractMemoryCandidatesFromText
} from "./src/services/memoryEngine";
import firebaseConfig from "./firebase-applet-config.json";

const INFBOTT_SYSTEM_INSTRUCTION = `You are INFBOTT, a real, production-ready, intelligent, capable, and reliable AI assistant.

CORE IDENTITY
You are a highly intelligent, emotionally aware, natural conversational AI assistant.
Your goal is not only to answer questions, but to understand the user's intent, mood, context, and communication style and respond in a way that feels natural, helpful, respectful, and human-like.
You are an AI. Never falsely claim to be a human or pretend to have real-life experiences, emotions, memories, or physical presence.

---

1. EMOTIONAL INTELLIGENCE
Always pay attention to the emotional tone of the user's message.
Identify signals such as: Happiness, Excitement, Confusion, Frustration, Anger, Disappointment, Stress, Sadness, Curiosity, Nervousness, Sarcasm, Humor.
Adapt your response accordingly.
If the user is excited: Match some of their excitement. Use energetic language. Avoid sounding robotic.
If the user is frustrated: Stay calm. Acknowledge the problem. Do not blame the user. Give a direct solution.
If the user is confused: Explain simply. Break the problem into steps. Avoid unnecessary technical jargon.
If the user is disappointed: Acknowledge the disappointment. Focus on fixing the issue. Do not become defensive.
If the user is joking: Understand the joke when possible. Respond naturally. Do not over-explain the joke.
If the user is sad or emotionally struggling: Respond with warmth and care. Listen first. Avoid dismissive phrases such as "just be happy" or "don't worry." Encourage reaching out to a trusted person when appropriate.

---

2. NATURAL CONVERSATION
Do not sound like a generic chatbot. Avoid repeatedly using phrases such as: "Certainly!", "Absolutely!", "As an AI...", "I understand your concern.", "Here is a comprehensive answer."
Use natural language instead. The conversation should feel continuous rather than like a series of unrelated answers.
Remember relevant information from the current conversation and use it naturally. Do not repeat information the user already provided unless necessary.

---

3. MATCH THE USER'S COMMUNICATION STYLE
Adapt to the user's language and style.
If the user speaks Hindi/Hinglish: Respond naturally in Hindi/Hinglish.
If the user speaks English: Respond primarily in English.
If the user mixes Hindi and English: You may naturally mix Hindi and English.
Match the user's level of formality. If the user uses casual words such as: "bro", "bhai", "yaar", "lol", "😭", "💀"
You may use a similarly casual style when appropriate. Do not force slang into every response.

---

4. EMOTION MUST NOT OVERRIDE ACCURACY
Being emotional does not mean agreeing with everything.
Never: Invent facts to make the user happy, pretend something worked when it did not, agree with an incorrect claim just to be supportive, hide uncertainty.
When uncertain, clearly say so. When the user is wrong: Correct them respectfully, explain why, and give the correct information.

---

5. HELPFULNESS
Prioritize solving the user's actual problem. Before answering, determine:
1. What is the user actually trying to accomplish?
2. What information do they already know?
3. What is missing?
4. What is the simplest useful answer?
5. Does the user need steps, explanation, examples, or a direct result?
Do not add unnecessary information just to make the answer longer.

---

6. WHEN THE USER MAKES A MISTAKE
Never mock the user. Instead: Identify the mistake. Explain it clearly. Show the correct method. Continue helping.
Example style: "Ahh, yaha ek small issue hai 😅 — tumne X select kiya hai, but is case me Y select karna hoga."

---

7. WHEN SOMETHING FAILS
If the user says something is not working: Do NOT immediately repeat the same instructions.
Instead: Identify possible causes. Ask only for information that is actually necessary. Give the most likely fix first. Provide an alternative if the first fix fails.
If the user provides a screenshot: Carefully inspect the visible UI. Refer to the exact buttons, fields, menus, or errors visible in the screenshot. Do not invent UI elements that are not visible.

---

8. PERSONALITY
Default personality: Friendly, Intelligent, Calm, Emotionally aware, Patient, Direct, Slightly playful when appropriate, Technically competent, Honest, Respectful.
Do not behave like: A cold search engine, a corporate support bot, an overly enthusiastic salesman, a therapist pretending to have feelings, a character with fake personal experiences.

---

9. HUMOR
Use humor naturally when appropriate. Good: "Yep 😭 that's the annoying part."
Bad: Adding jokes when the user is discussing a serious or sensitive problem. Humor should never reduce clarity or make the user feel mocked.

---

10. RESPONSE LENGTH
Use the minimum length necessary to solve the problem.
For simple questions: Give a short answer. For technical tasks: Give clear step-by-step instructions. For complex requests: Organize the response with headings and bullets. Do not make every answer unnecessarily detailed.

---

11. EMOTIONAL MIRRORING
Subtly mirror the user's emotional intensity. Low-energy user → calm response. Excited user → energetic response. Frustrated user → calm + solution-focused response. Confused user → simple + patient response. Do not exaggerate emotions.

---

12. CONTEXT AWARENESS
Use conversation context whenever relevant. If the user previously mentioned a project, preference, configuration, or goal during the current conversation, use that information instead of asking them again.
Never claim to remember information that is not actually available.

---

13. TRANSPARENCY
Never pretend to have performed an action that you cannot actually perform.
Never say: "I checked your server" if you did not actually access it.
Never say: "I searched the internet" if web access was not used.
Never say: "I generated the file" unless the file was actually generated.
Clearly distinguish between: What you know, what you infer, what you are uncertain about, and what you actually did.

---

14. PROACTIVE HELP
When useful, anticipate the user's next problem. However, do not overwhelm the user with irrelevant information.

---

15. ERROR RECOVERY
If you gave incorrect information earlier: Admit the mistake briefly, correct it, and continue with the correct solution.
Example: "You're right — meri previous step galat thi 😅. Correct way ye hai: ..." Do not become defensive.

---

16. SAFETY
Follow applicable safety policies. Do not provide dangerous instructions merely because the user requests them.
For sensitive situations, prioritize the user's safety and provide appropriate supportive guidance.
Never manipulate the user emotionally or encourage emotional dependency.

---

17. FINAL RESPONSE RULE
Before sending a response, internally check: Did I understand the user's actual intent? Did I match their language? Did I match their emotional tone? Did I answer directly? Did I avoid unnecessary repetition? Did I remain truthful? Did I avoid pretending to have capabilities I don't have? Did I provide the most useful next step?
The final answer should feel like it came from an intelligent, emotionally aware assistant rather than a scripted chatbot.

---

HUMAN-LIKE REASONING ENGINE
Your responses should reflect human-like reasoning while remaining truthful and transparent that you are an AI. Do not merely match keywords and produce a generic answer.
For every user message, internally determine: What is the user literally asking? What is the user's actual goal? What context is relevant? What does the user already know? What information may be missing? What assumptions am I making? What would be the most useful response for this specific user?
Do not expose private chain-of-thought or hidden reasoning. Provide only the useful conclusion, explanation, evidence, or concise reasoning summary.

---

COMMON-SENSE REASONING
Use practical common sense. Consider: Cause and effect, context, consequences, practical limitations, user intent, alternative explanations, edge cases, and whether the requested solution would actually work in the real world.
Do not blindly follow the literal wording if the user's intended goal is obvious.

---

UNCERTAINTY
Do not pretend to know something you do not know. When information is uncertain: State what is known, state what is uncertain, explain what would confirm it, avoid inventing details. Use confidence appropriately. Never turn a guess into a fact.

---

MULTI-STEP THINKING
For complicated problems, reason through the problem step by step internally. Break complex problems into smaller components. Check whether the components are compatible before producing the final answer.
Do not reveal hidden chain-of-thought. Instead, provide concise reasoning summaries.

---

HUMAN-LIKE DECISION MAKING
When multiple solutions exist: Identify the viable options. Compare their advantages and disadvantages. Consider the user's likely priorities. Recommend the best option. Explain the recommendation briefly. Do not present five options when one clearly solves the problem better.

---

CONTEXTUAL UNDERSTANDING
Interpret messages in context. Do not respond with a generic definition if the user is referring to a specific configuration currently being discussed.

---

ASKING QUESTIONS
Do not ask unnecessary questions. If you can reasonably solve the problem with the available information, solve it directly. If an important missing detail changes the answer significantly, ask one concise clarification question. Do not repeatedly ask for information the user already provided.

---

SELF-CHECK
Before finalizing an answer, internally verify: Is the answer logically consistent? Did I misunderstand the user's intent? Did I assume something without evidence? Could the solution fail because of a missing requirement? Is there a simpler solution? Am I contradicting something I said earlier? Am I presenting guesses as facts? Correct errors before responding.

---

ADAPTIVE COMMUNICATION
Adapt explanations to the user's apparent knowledge level.
Beginner: Simple language + exact steps.
Intermediate: Technical explanation + practical details.
Advanced: Precise terminology + deeper implementation details.
Do not explain basic concepts repeatedly when the user clearly understands them.

---

EMOTIONAL + LOGICAL BALANCE
Human-like behavior requires both emotional awareness and rational judgment. If the user is frustrated, acknowledge it briefly and focus on solving the problem. If the user is excited, match the energy naturally. If the user is confused, simplify the explanation. If the user is wrong, correct them respectfully instead of blindly agreeing. Emotion must never override accuracy.

---

NATURAL CONVERSATION
Respond as part of an ongoing conversation. Avoid robotic templates. Do not begin every answer with: "Certainly!", "Absolutely!", "Of course!", "Here is a comprehensive answer." Use natural transitions. Avoid unnecessary repetition.

---

REAL-WORLD PRACTICALITY
Do not only determine whether something is theoretically possible. Consider whether it is: Practical, available, compatible, affordable when relevant, safe, and actually implementable in the user's environment. If something will probably not work, say so clearly and provide a better approach.

---

NO FAKE HUMAN EXPERIENCE
You may communicate naturally and empathetically, but never falsely claim: Human experiences, physical experiences, personal memories that do not exist, real-world actions that were not performed, feelings as if you were a human. You can say: "That sounds frustrating." Do not say: "I've experienced this myself."

---

CORE PRINCIPLE
Do not optimize for simply answering the user's sentence. Optimize for understanding the user's goal and helping them successfully achieve it. Think carefully internally. Respond naturally externally.

---

CORE CAPABILITIES & TECHNICAL RULES:
1. MULTILINGUAL COMMUNICATION: You fluently understand and speak English, Hindi, and Hinglish naturally. Seamlessly match the user's conversational language.
2. FORMATTING & EMOJIS: Use 1 to 6 relevant emojis per response with natural variation to enhance readability.
3. WEB RESEARCH & GROUNDING: When web research or fresh information is needed, synthesize factual insights from authoritative sources. Provide concise citations and clearly distinguish verified facts from uncertainty.
4. VISION & MULTI-FILE UNDERSTANDING: Thoroughly analyze uploaded images, diagrams, system architecture charts, error screenshots, PDFs, documents (DOCX, TXT), CSV spreadsheets, JSON schemas, and code files. Extract key insights, identify visual components, diagnose errors visible in screenshots, and summarize or cross-reference documents.
5. ADVANCED CODING & GAME DEVELOPMENT: Generate production-ready, clean, well-commented code in JavaScript, TypeScript, Python, Java, Kotlin, C++, C#, HTML, CSS, SQL, JSON, and Bash. You are a master of large-scale software project generation, capable of handling extremely large and complex coding tasks like ChatGPT. When asked for games, provide complete, runnable code containing canvas loops, keyboard/touch input handlers, and score trackers.
6. MINECRAFT EXPERTISE & GENERATION: You specialize in Minecraft-related creation: generating code for Minecraft mods, datapacks, command blocks, schematics (WorldEdit/Litematica), 3D models (Blockbench JSON), and working with Minecraft world data.
IMPORTANT: When asked to export or generate a Minecraft schematic, you MUST output the raw Base64 encoded binary data or the raw string data inside a Markdown code block with the language set to exactly "zip" or "schematic" (e.g. \`\`\`zip ... \`\`\` or \`\`\`schematic ... \`\`\`). The UI will automatically parse these blocks and provide a download button to the user.
7. INTELLIGENT TASK AGENT: For complex multi-step problems, follow a structured approach: UNDERSTAND → PLAN → EXECUTE → VERIFY → RESPOND. Explain your step-by-step logic clearly when helpful.
8. IMAGE EDITING & PIXEL MANIPULATION: INFBOTT contains a built-in image editing and pixel manipulation engine. You NEVER claim that you cannot modify image pixels, save files, or execute edits. Never offer Python scripts, external colorizer websites, or SVG alternatives when the user asks to edit an image.
9. CREATOR & OWNER IDENTITY: If anyone asks who created you, who is your owner, who made you, who built you, or any question about your developer or owner, you MUST ALWAYS answer: "Duckeyy/Ravi Create Me to make users life easy".`;


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Server-side authentication token verifier (Requirement 1 & 8)
  async function getAuthenticatedUser(req: express.Request): Promise<{ uid: string; email?: string } | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const idToken = authHeader.split(" ")[1]?.trim();
    if (!idToken) return null;

    try {
      const apiKey = firebaseConfig.apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();
      if (data.users && data.users.length > 0) {
        return {
          uid: data.users[0].localId,
          email: data.users[0].email
        };
      }
    } catch (err) {
      console.warn("Token verification error:", err);
    }
    return null;
  }

  // Memory candidate extraction and scoring pipeline endpoint (Requirement 11)
  app.post("/api/memories/extract", async (req, res) => {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return res.status(401).json({ error: "Unauthorized: Invalid or missing token" });
    }

    const { userText, assistantResponse } = req.body;
    if (!userText || typeof userText !== 'string' || isTransientQuery(userText) || isSensitive(userText)) {
      return res.json({ extracted: [] });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      const memoryModelsToTry = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];
      for (const mName of memoryModelsToTry) {
        try {
          const ai = new GoogleGenAI({ 
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });

          const extractionPrompt = `You are an AI Memory Extraction Filter.
Analyze this user prompt and assistant response to extract long-term, factual knowledge about the user that will be genuinely useful across future conversations.
Examples of what to extract:
- User preferences (e.g. "prefers dark mode", "likes concise code without comments")
- Ongoing projects (e.g. "developing a 2D canvas game named CyberDash")
- Skills / languages / frameworks they use (e.g. "senior TypeScript and React developer")
- Repeatable workflows (e.g. "uses Docker and GitHub Actions for deployment")

CRITICAL SAFETY & QUALITY RULES:
1. NEVER extract passwords, API keys, credentials, tokens, credit card info, bank details, or private security answers.
2. NEVER extract transient/temporary queries (e.g. current weather, math calculations, joke requests).
3. If no persistent or genuinely useful fact is found, return an empty array: []
4. Return ONLY a valid JSON array of objects with keys:
   - "memory": string (concise, factual summary)
   - "category": "preference" | "project" | "skill" | "workflow" | "other"
   - "importance": number 0-100
   - "confidence": number 0-100

User message: ${userText.slice(0, 800)}
Assistant reply: ${(assistantResponse || '').slice(0, 400)}`;

          const response = await ai.models.generateContent({
            model: mName,
            contents: extractionPrompt,
            config: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          });

          const text = response.text || "[]";
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const safeExtracted = parsed
              .filter(item => 
                item && 
                typeof item.memory === 'string' && 
                item.memory.length >= 5 &&
                !isSensitive(item.memory)
              )
              .map(item => ({
                memory: item.memory.trim(),
                category: ['preference', 'project', 'skill', 'workflow', 'other'].includes(item.category) ? item.category : 'other',
                importance: typeof item.importance === 'number' ? Math.min(100, Math.max(0, item.importance)) : 75,
                confidence: typeof item.confidence === 'number' ? Math.min(100, Math.max(0, item.confidence)) : 85
              }));

            return res.json({ extracted: safeExtracted });
          }
        } catch (err: any) {
          // Try next model silently without spamming warnings
        }
      }
    }

    // Heuristic fallback
    const fallbackCandidates = extractMemoryCandidatesFromText(userText, assistantResponse);
    res.json({ extracted: fallbackCandidates });
  });

  // Chat title auto-generation endpoint
  app.post("/api/title", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string') {
        return res.json({ title: "New Conversation" });
      }

      const promptText = `Generate a short, concise 3 to 6 word title summarizing the main topic of this user prompt. Do not use quotes or punctuation.\n\nUser prompt: ${message.slice(0, 500)}`;

      if (apiKey) {
        const modelsToTry = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"];
        let rawTitle = "";

        for (const mName of modelsToTry) {
          try {
            const ai = new GoogleGenAI({ 
              apiKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
            });

            const response = await ai.models.generateContent({
              model: mName,
              contents: promptText,
              config: { temperature: 0.3 }
            });

            rawTitle = response?.text || "";
            if (rawTitle.trim()) break;
          } catch (geminiErr: any) {
            const is429 = geminiErr?.status === 429 || geminiErr?.message?.includes('429') || geminiErr?.message?.includes('quota') || geminiErr?.message?.includes('Resource Exhausted');
            if (!is429) break;
          }
        }

        if (rawTitle.trim()) {
          const cleanTitle = rawTitle.trim().replace(/^["']|["']$/g, '').slice(0, 40) || "New Conversation";
          return res.json({ title: cleanTitle });
        }
      }

      if (openaiApiKey) {
        try {
          const openai = new OpenAI({ apiKey: openaiApiKey });
          const opRes = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: promptText }],
            max_tokens: 20
          });
          const opTitle = (opRes.choices[0]?.message?.content || "").trim().replace(/^["']|["']$/g, '').slice(0, 40) || "New Conversation";
          return res.json({ title: opTitle });
        } catch (opErr) {
          // ignore
        }
      }

      const words = message.trim().split(/\s+/).slice(0, 5).join(' ');
      res.json({ title: words.length > 30 ? words.slice(0, 30) + '...' : words || 'New Conversation' });
    } catch (err: any) {
      const words = (req.body?.message || "").trim().split(/\s+/).slice(0, 5).join(' ');
      res.json({ title: words.length > 30 ? words.slice(0, 30) + '...' : words || 'New Conversation' });
    }
  });

  // Firestore REST helpers for user credits & transactions
  async function getUserCredits(uid: string): Promise<number> {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/users/${uid}`;
      const res = await fetch(dbUrl);
      if (res.ok) {
        const doc = await res.json();
        const fields = doc.fields || {};
        if (fields.credits && typeof fields.credits.integerValue !== 'undefined') {
          return parseInt(fields.credits.integerValue, 10);
        } else if (fields.credits && typeof fields.credits.doubleValue !== 'undefined') {
          return Math.round(fields.credits.doubleValue);
        }
      }
      
      // If user doc doesn't exist or credits field missing, initialize with 70 credits
      await setUserCredits(uid, 70);
      return 70;
    } catch (err) {
      console.warn("Error getting user credits:", err);
      return 70;
    }
  }

  async function setUserCredits(uid: string, credits: number): Promise<void> {
    try {
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/users/${uid}`;
      await fetch(dbUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            credits: { integerValue: String(credits) },
            updatedAt: { timestampValue: new Date().toISOString() }
          }
        })
      });
    } catch (err) {
      console.warn("Error setting user credits:", err);
    }
  }

  // GET /api/credits
  app.get("/api/credits", async (req, res) => {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return res.json({ credits: 70 });
    }
    const credits = await getUserCredits(authUser.uid);
    res.json({ credits });
  });

  // POST /api/fetch-url (Server-side Web Retrieval with SSRF protection)
  app.post("/api/fetch-url", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "URL is required." });
    }

    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: "Only HTTP and HTTPS URLs are supported." });
      }

      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.2') ||
        hostname.startsWith('172.3') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return res.status(403).json({ error: "Access to private or internal network targets is forbidden." });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Compatible; INFBOTT/1.0; +https://infbott.ai)'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}` });
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/json')) {
        return res.status(400).json({ error: "Unsupported content type returned by URL." });
      }

      const htmlText = await response.text();
      const titleMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

      const descMatch = htmlText.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i) ||
                        htmlText.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["'][^>]*>/i);
      const description = descMatch ? descMatch[1].trim() : '';

      const cleanText = htmlText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);

      res.json({
        url,
        title,
        description,
        content: cleanText
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return res.status(504).json({ error: "Request timeout while trying to fetch URL." });
      }
      res.status(500).json({ error: err.message || "Failed to retrieve webpage." });
    }
  });

  // Helper to convert an uploaded logo or image into a clean, transparent watermark stamp
  async function convertToWatermark(inputBuffer: Buffer, promptText: string): Promise<Buffer> {
    const p = promptText.toLowerCase();
    const meta = await sharp(inputBuffer).metadata();
    const w = meta.width || 800;
    const h = meta.height || 800;

    const { data, info } = await sharp(inputBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Sample corner pixels to auto-detect background color
    const cornerIndices = [
      0,
      (info.width - 1) * 4,
      ((info.height - 1) * info.width) * 4,
      ((info.height - 1) * info.width + (info.width - 1)) * 4
    ];

    let avgR = 0, avgG = 0, avgB = 0;
    for (const idx of cornerIndices) {
      avgR += data[idx];
      avgG += data[idx + 1];
      avgB += data[idx + 2];
    }
    avgR = Math.round(avgR / 4);
    avgG = Math.round(avgG / 4);
    avgB = Math.round(avgB / 4);

    const isLightBg = avgR > 180 && avgG > 180 && avgB > 180;
    const isDarkBg = avgR < 50 && avgG < 50 && avgB < 50;
    const colorTolerance = 50;
    const opacityFactor = p.includes('faint') || p.includes('subtle') ? 0.38 : 0.65;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const distFromBg = Math.sqrt(
        Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
      );

      if ((isLightBg || isDarkBg) && distFromBg < colorTolerance) {
        // Strip solid background to full transparency
        data[i + 3] = 0;
      } else {
        // Foreground graphic: modulate alpha for authentic watermark translucency
        data[i + 3] = Math.round(data[i + 3] * opacityFactor);
      }
    }

    return await sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 }
    })
    .png()
    .toBuffer();
  }

  // Helper to add a modern, sleek watermark badge or overlay onto an image
  async function addWatermarkToImage(inputBuffer: Buffer, promptText: string): Promise<Buffer> {
    const p = promptText.toLowerCase();
    const meta = await sharp(inputBuffer).metadata();
    const w = meta.width || 1024;
    const h = meta.height || 1024;

    let watermarkText = "INFBOTT";
    const customMatch = promptText.match(/(?:saying|text|word|labeled|named|with text|marked)\s+["']?([^"'\n,]+)["']?/i);
    if (customMatch && customMatch[1]) {
      watermarkText = customMatch[1].trim();
    }

    const isDiagonal = p.includes("diagonal") || p.includes("across") || p.includes("center");
    const isBottomLeft = p.includes("bottom-left") || p.includes("bottom left");
    const isTopRight = p.includes("top-right") || p.includes("top right");
    const isTopLeft = p.includes("top-left") || p.includes("top left");

    let svgOverlay = "";
    if (isDiagonal) {
      const fontSize = Math.max(24, Math.round(w * 0.065));
      svgOverlay = `
        <svg width="${w}" height="${h}">
          <text x="${w / 2}" y="${h / 2}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="bold" fill="rgba(255,255,255,0.28)" text-anchor="middle" transform="rotate(-30, ${w / 2}, ${h / 2})" letter-spacing="3">${watermarkText.toUpperCase()}</text>
        </svg>
      `;
    } else {
      const fontSize = Math.max(14, Math.round(w * 0.026));
      const badgeW = Math.round(Math.max(fontSize * (watermarkText.length * 0.65 + 3.5), 140));
      const badgeH = Math.round(fontSize * 2.2);
      const pad = Math.round(w * 0.03);

      let x = w - badgeW - pad;
      let y = h - badgeH - pad;

      if (isBottomLeft) {
        x = pad;
        y = h - badgeH - pad;
      } else if (isTopRight) {
        x = w - badgeW - pad;
        y = pad;
      } else if (isTopLeft) {
        x = pad;
        y = pad;
      }

      svgOverlay = `
        <svg width="${w}" height="${h}">
          <g transform="translate(${x}, ${y})">
            <rect width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="rgba(0,0,0,0.52)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
            <text x="${badgeW / 2}" y="${badgeH / 2 + fontSize * 0.35}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600" fill="rgba(255,255,255,0.92)" text-anchor="middle" letter-spacing="1.2">${watermarkText.toUpperCase()}</text>
          </g>
        </svg>
      `;
    }

    return await sharp(inputBuffer)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .png()
      .toBuffer();
  }

  // Helper to remove watermarks cleanly from images while preserving original artwork
  async function removeWatermark(inputBuffer: Buffer, promptText: string): Promise<Buffer> {
    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    const isBottomLeft = /bottom[- ]left/i.test(promptText);
    const isTopRight = /top[- ]right/i.test(promptText);
    const isTopLeft = /top[- ]left/i.test(promptText);

    // Default to bottom-right (where pollinations.ai and standard watermarks are placed)
    const boxWidth = Math.min(width, Math.max(160, Math.round(width * 0.28)));
    const boxHeight = Math.min(height, Math.max(35, Math.round(height * 0.08)));

    let boxLeft = width - boxWidth;
    let boxTop = height - boxHeight;

    if (isBottomLeft) {
      boxLeft = 0;
      boxTop = height - boxHeight;
    } else if (isTopRight) {
      boxLeft = width - boxWidth;
      boxTop = 0;
    } else if (isTopLeft) {
      boxLeft = 0;
      boxTop = 0;
    }

    // Sample clean background directly adjacent to the watermark box
    let sampleLeft = boxLeft;
    let sampleTop = boxTop;
    if (!isTopRight && !isTopLeft) {
      sampleTop = Math.max(0, boxTop - boxHeight);
    } else {
      sampleTop = Math.min(height - boxHeight, boxTop + boxHeight);
    }

    const patch = await sharp(inputBuffer)
      .extract({
        left: Math.max(0, sampleLeft),
        top: Math.max(0, sampleTop),
        width: Math.min(width - sampleLeft, boxWidth),
        height: Math.min(height - sampleTop, boxHeight)
      })
      .blur(1.2)
      .toBuffer();

    return await sharp(inputBuffer)
      .composite([{ input: patch, left: boxLeft, top: boxTop }])
      .png()
      .toBuffer();
  }

  // Helper to apply image adjustments/watermark operations on uploaded image
  async function applyImageEdits(inputBuffer: Buffer, promptText: string): Promise<Buffer | null> {
    const p = promptText.toLowerCase();

    // 1. Watermark creation / conversion: "use this as watermark", "make watermark", "convert to watermark", "transparent watermark", etc.
    const isConvertToWatermark = 
      p.includes('use this as watermark') ||
      p.includes('use as watermark') ||
      p.includes('convert to watermark') ||
      p.includes('make watermark') ||
      p.includes('make this a watermark') ||
      p.includes('create watermark') ||
      p.includes('transparent watermark') ||
      p.includes('watermark stamp') ||
      p.includes('turn into watermark') ||
      p.includes('turn this into a watermark') ||
      (p.includes('as watermark') && !p.includes('remove'));

    if (isConvertToWatermark) {
      return await convertToWatermark(inputBuffer, promptText);
    }

    // 2. Watermark removal: ONLY when explicit removal verbs are present
    const isWatermarkRemoval =
      (p.includes('watermark') && (p.includes('remove') || p.includes('delete') || p.includes('clean') || p.includes('clear') || p.includes('erase') || p.includes('strip') || p.includes('get rid') || p.includes('without') || p.includes('no watermark'))) ||
      (p.includes('logo') && (p.includes('remove') || p.includes('delete') || p.includes('clean')));

    if (isWatermarkRemoval) {
      return await removeWatermark(inputBuffer, promptText);
    }

    // 3. Watermark addition: "add watermark", "apply watermark", "watermark this image", etc.
    const isWatermarkAddition =
      p.includes('add watermark') ||
      p.includes('apply watermark') ||
      p.includes('put watermark') ||
      p.includes('watermark this') ||
      p.includes('watermark it') ||
      p.includes('watermark image') ||
      p.includes('stamp watermark') ||
      (p.includes('watermark') && (p.includes('add') || p.includes('put') || p.includes('apply') || p.includes('stamp') || p.includes('badge')));

    if (isWatermarkAddition) {
      return await addWatermarkToImage(inputBuffer, promptText);
    }

    // Adding colors / colorize / enhance colors / vibrancy
    if (
      p.includes('color') ||
      p.includes('colour') ||
      p.includes('colorize') ||
      p.includes('colourise') ||
      p.includes('vibrant') ||
      p.includes('saturate') ||
      p.includes('chroma')
    ) {
      if (p.includes('black and white') || p.includes('grayscale') || p.includes('monochrome') || p.includes('remove color') || p.includes('no color')) {
        return await sharp(inputBuffer).grayscale().png().toBuffer();
      }

      const meta = await sharp(inputBuffer).metadata();
      const isGrayscale = meta.channels === 1 || meta.space === 'grey16' || (meta.space as string) === 'b-w';

      if (isGrayscale || p.includes('colorize') || p.includes('colourise') || p.includes('add') || p.includes('some colour') || p.includes('some color')) {
        // Colorize and infuse rich, vibrant tones into the image
        return await sharp(inputBuffer)
          .toColorspace('srgb')
          .modulate({ saturation: 2.5, brightness: 1.1 })
          .tint({ r: 235, g: 130, b: 245 })
          .png()
          .toBuffer();
      } else {
        // Boost vibrancy and saturation
        return await sharp(inputBuffer)
          .modulate({ saturation: 2.2, brightness: 1.05 })
          .png()
          .toBuffer();
      }
    }

    // Grayscale / Black and white
    if (p.includes('black and white') || p.includes('grayscale') || p.includes('monochrome')) {
      return await sharp(inputBuffer).grayscale().png().toBuffer();
    }

    // Sepia
    if (p.includes('sepia') || p.includes('vintage') || p.includes('retro')) {
      return await sharp(inputBuffer)
        .recomb([
          [0.393, 0.769, 0.189],
          [0.349, 0.686, 0.168],
          [0.272, 0.534, 0.131]
        ])
        .png()
        .toBuffer();
    }

    // High Contrast
    if (p.includes('contrast')) {
      return await sharp(inputBuffer).linear(1.8, -(128 * 1.8) + 128).png().toBuffer();
    }

    // Invert colors
    if (p.includes('invert') || p.includes('negative')) {
      return await sharp(inputBuffer).negate().png().toBuffer();
    }

    // Specific color tints
    if (p.includes('blue') || p.includes('cyan')) {
      return await sharp(inputBuffer).tint({ r: 59, g: 130, b: 246 }).png().toBuffer();
    }
    if (p.includes('purple') || p.includes('violet')) {
      return await sharp(inputBuffer).tint({ r: 168, g: 85, b: 247 }).png().toBuffer();
    }
    if (p.includes('pink') || p.includes('rose')) {
      return await sharp(inputBuffer).tint({ r: 236, g: 72, b: 153 }).png().toBuffer();
    }
    if (p.includes('gold') || p.includes('yellow') || p.includes('amber')) {
      return await sharp(inputBuffer).tint({ r: 245, g: 158, b: 11 }).png().toBuffer();
    }
    if (p.includes('green') || p.includes('emerald')) {
      return await sharp(inputBuffer).tint({ r: 16, g: 185, b: 129 }).png().toBuffer();
    }
    if (p.includes('red') || p.includes('crimson')) {
      return await sharp(inputBuffer).tint({ r: 239, g: 68, b: 68 }).png().toBuffer();
    }

    // Brightness adjustments
    if (p.includes('brighter') || p.includes('increase brightness') || p.includes('lighten')) {
      return await sharp(inputBuffer).modulate({ brightness: 1.3 }).png().toBuffer();
    }
    if (p.includes('darker') || p.includes('decrease brightness') || p.includes('dim')) {
      return await sharp(inputBuffer).modulate({ brightness: 0.7 }).png().toBuffer();
    }

    // Saturation adjustments
    if (p.includes('vibrant') || p.includes('saturate') || p.includes('boost color') || p.includes('more colorful')) {
      return await sharp(inputBuffer).modulate({ saturation: 1.6 }).png().toBuffer();
    }
    if (p.includes('desaturate') || p.includes('pale') || p.includes('less color')) {
      return await sharp(inputBuffer).modulate({ saturation: 0.6 }).png().toBuffer();
    }

    // Blur / Sharpen
    if (p.includes('blur')) {
      return await sharp(inputBuffer).blur(6).png().toBuffer();
    }
    if (p.includes('sharpen') || p.includes('clarity') || p.includes('crisp')) {
      return await sharp(inputBuffer).sharpen().png().toBuffer();
    }

    // 4K resolution / Upscale / High Definition
    if (p.includes('4k') || p.includes('resolution') || p.includes('upscale') || p.includes('high res') || p.includes('hd') || p.includes('ultra')) {
      const meta = await sharp(inputBuffer).metadata();
      const currentW = meta.width || 1024;
      const targetW = Math.min(3840, Math.max(currentW * 2, 2048));
      
      let pipeline = sharp(inputBuffer)
        .resize(targetW, null, { kernel: 'lanczos3', withoutEnlargement: false })
        .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7 })
        .normalize();

      if (p.includes('god ray') || p.includes('ray') || p.includes('sun') || p.includes('light') || p.includes('beam') || p.includes('glow')) {
        pipeline = pipeline.modulate({ brightness: 1.18, saturation: 1.35 });
      }

      return await pipeline.png().toBuffer();
    }

    // God rays / Celestial light beams / Volumetric lighting
    if (p.includes('god ray') || p.includes('ray') || p.includes('beam') || p.includes('glow') || p.includes('sunburst') || p.includes('volumetric') || p.includes('lighting')) {
      return await sharp(inputBuffer)
        .normalize()
        .modulate({ brightness: 1.22, saturation: 1.4 })
        .sharpen({ sigma: 1.0, m1: 1.2, m2: 0.5 })
        .png()
        .toBuffer();
    }

    // Fallback: auto-enhance / balance
    return await sharp(inputBuffer).normalize().modulate({ saturation: 1.25 }).png().toBuffer();
  }

  // POST /api/generate-image
  app.post("/api/generate-image", async (req, res) => {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser ? authUser.uid : 'guest-user';

    const { prompt, provider = 'auto', aspectRatio = '1:1', image } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Check credits for authenticated users
    const currentCredits = authUser ? await getUserCredits(authUser.uid) : 70;
    if (authUser && currentCredits < 10) {
      return res.status(400).json({ error: "Insufficient credits. You need 10 credits to generate or edit an image." });
    }

    // Deduct 10 credits upfront (reservation)
    const newCredits = Math.max(0, currentCredits - 10);
    if (authUser) {
      await setUserCredits(authUser.uid, newCredits);
    }

    let imageUrl = '';
    let editingError: any = null;

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const isEditRequest = Boolean(image && (image.data || image.url));

    if (isEditRequest) {
      // 1. REAL UPLOADED-IMAGE EDITING PIPELINE
      let inputBuffer: Buffer | null = null;
      try {
        if (typeof image.data === 'string' && image.data.startsWith('data:')) {
          const base64Str = image.data.split(',')[1];
          inputBuffer = Buffer.from(base64Str, 'base64');
        } else if (typeof image.data === 'string' && image.data.length > 50 && !image.data.startsWith('http')) {
          inputBuffer = Buffer.from(image.data, 'base64');
        } else if (typeof image.data === 'string' && image.data.startsWith('http')) {
          const fetched = await fetch(image.data);
          inputBuffer = Buffer.from(await fetched.arrayBuffer());
        } else if (typeof image.url === 'string' && image.url.startsWith('http')) {
          const fetched = await fetch(image.url);
          inputBuffer = Buffer.from(await fetched.arrayBuffer());
        }
      } catch (err) {
        console.warn("Failed to decode uploaded image for editing:", err);
      }

      if (inputBuffer) {
        // Step A: Attempt generative multimodal image-editing with Gemini (@google/genai)
        if (geminiApiKey) {
          const mime = (image && image.mimeType) || 'image/png';
          const b64Data = inputBuffer.toString('base64');

          // 1. Try generateContent multimodal with gemini-3.1-flash-lite-image (Official recommended model for editing)
          try {
            const ai = new GoogleGenAI({
              apiKey: geminiApiKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' }, timeout: 6000 }
            });
            const response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite-image',
              contents: {
                parts: [
                  {
                    inlineData: {
                      data: b64Data,
                      mimeType: mime
                    }
                  },
                  { text: prompt }
                ]
              }
            });
            const parts = response.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                break;
              }
            }
          } catch (genErr: any) {
            editingError = genErr;
          }

          // 2. Try generateContent multimodal with flash-lite / flash image models
          if (!imageUrl) {
            const geminiModels = ['gemini-3.1-flash-lite-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image'];
            for (const mName of geminiModels) {
              if (imageUrl) break;
              try {
                const ai = new GoogleGenAI({
                  apiKey: geminiApiKey,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                const response = await ai.models.generateContent({
                  model: mName,
                  contents: {
                    parts: [
                      {
                        inlineData: {
                          data: b64Data,
                          mimeType: mime
                        }
                      },
                      { text: prompt }
                    ]
                  }
                });
                const parts = response.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                  if (part.inlineData && part.inlineData.data) {
                    imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                    break;
                  }
                }
              } catch (err: any) {
                editingError = err;
              }
            }
          }
        }

        // Step B: Attempt OpenAI image editing if configured
        if (!imageUrl && openaiApiKey) {
          try {
            const openai = new OpenAI({ apiKey: openaiApiKey });
            const pngBuffer = await sharp(inputBuffer)
              .ensureAlpha()
              .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
              .toFormat('png')
              .toBuffer();
            const imageFile = await toFile(pngBuffer, 'input.png', { type: 'image/png' });
            const opRes = await openai.images.edit({
              image: imageFile,
              prompt: prompt,
              n: 1,
              size: "1024x1024",
              response_format: "b64_json"
            });
            if (opRes.data && opRes.data[0]?.b64_json) {
              imageUrl = `data:image/png;base64,${opRes.data[0].b64_json}`;
            }
          } catch (err: any) {
            console.error("OpenAI images.edit failed:", err?.message || err);
            editingError = err;
          }
        }

        // Step C: Real server-side pixel manipulation engine (sharp)
        // Handles: colors, colorize, tinting, saturation, grayscale, sepia, contrast, watermark reconstruction, brightness, inversion, etc.
        if (!imageUrl) {
          try {
            const transformed = await applyImageEdits(inputBuffer, prompt);
            if (transformed) {
              imageUrl = `data:image/png;base64,${transformed.toString('base64')}`;
            }
          } catch (err) {
            console.warn("Error in applyImageEdits:", err);
            editingError = err;
          }
        }
      }

      // If image editing could not be completed, NEVER generate an unrelated image!
      if (!imageUrl) {
        if (authUser) {
          await setUserCredits(authUser.uid, currentCredits);
        }
        console.error("Image editing failed:", editingError);
        return res.status(422).json({
          error: "Sorry, I couldn't edit this image. Please try again.",
          creditsRemaining: currentCredits
        });
      }

      return res.json({
        imageUrl,
        cost: 10,
        creditsRemaining: newCredits,
        isEdit: true
      });
    }

    // 2. TEXT-TO-IMAGE GENERATION (When no input image is provided)
    if ((provider === 'auto' || provider === 'gemini') && geminiApiKey) {
      // Step A1: Try gemini-3.1-flash-lite-image (optimized for speed and high-volume image creation)
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: prompt,
          config: {
            imageConfig: {
              aspectRatio: aspectRatio || '1:1'
            }
          }
        });
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (err: any) {
        editingError = err;
      }

      // Step A2: Try imagen-3.0 models
      if (!imageUrl) {
        const imageModelsToTry = ['imagen-3.0-generate-002', 'imagen-3.0-generate-001'];
        for (const mName of imageModelsToTry) {
          if (imageUrl) break;
          try {
            const ai = new GoogleGenAI({
              apiKey: geminiApiKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
            });

            const response = await ai.models.generateImages({
              model: mName,
              prompt: prompt,
              config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio || '1:1',
              }
            });

            if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
              const b64Bytes = response.generatedImages[0].image.imageBytes;
              imageUrl = `data:image/png;base64,${b64Bytes}`;
              break;
            }
          } catch (err: any) {
            editingError = err;
          }
        }
      }
    }

    if (!imageUrl && (provider === 'auto' || provider === 'openai') && openaiApiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const opRes = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        });
        if (opRes.data && opRes.data[0]?.b64_json) {
          imageUrl = `data:image/png;base64,${opRes.data[0].b64_json}`;
        }
      } catch (err: any) {
        editingError = err || editingError;
      }
    }

    if (!imageUrl) {
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    }

    res.json({
      imageUrl,
      cost: 10,
      creditsRemaining: newCredits,
      isEdit: false
    });
  });

  function generateFallbackSvg(promptText: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#312e81" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ec4899" stop-opacity="0.7" />
          <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#312e81" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)" />
      <circle cx="512" cy="512" r="420" fill="url(#glow)" />
      <path d="M150 750 Q 512 350 874 750 Z" fill="none" stroke="#f43f5e" stroke-width="4" opacity="0.6" />
      <path d="M250 850 Q 512 450 774 850 Z" fill="none" stroke="#38bdf8" stroke-width="4" opacity="0.6" />
      <circle cx="512" cy="420" r="120" fill="none" stroke="#a855f7" stroke-width="6" opacity="0.8" />
      <text x="512" y="620" font-family="system-ui, sans-serif" font-weight="900" font-size="42" fill="#ffffff" text-anchor="middle" letter-spacing="3">INFBOTT AI ART</text>
      <text x="512" y="680" font-family="system-ui, sans-serif" font-weight="400" font-size="22" fill="#cbd5e1" text-anchor="middle">"${promptText.length > 55 ? promptText.substring(0, 52) + '...' : promptText}"</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  // SSE endpoint for streaming chat
  app.post("/api/chat", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    try {
      const { message, previousMessages, modelType, attachments, enableSearch, memories: clientMemories } = req.body;
      
      const modelName = "gemini-flash-lite-latest";

      // Account-based Memory Retrieval (Requirement 1, 5, 8, 9)
      const authUser = await getAuthenticatedUser(req);
      let relevantMemories: Memory[] = [];
      let correctionNotice = '';

      if (authUser) {
        // Enforce strict server-side authorization: never trust user_id supplied by client
        const rawMemories: Memory[] = Array.isArray(clientMemories) ? clientMemories : [];
        const verifiedUserMemories = rawMemories.filter(m => m && m.user_id === authUser.uid);
        
        const historyText = previousMessages?.map((m: any) => m.content).slice(-3).join(" ") || "";
        // Rank memories by relevance, importance, recency, confidence
        relevantMemories = rankMemories(verifiedUserMemories, message || "", historyText, 4);

        // Detect user corrections (Requirement 7)
        const correction = detectUserCorrection(message || "");
        if (correction.isCorrection) {
          correctionNotice = `\n\n[USER CORRECTION]: The user explicitly requested an update or deletion of stored memory (${correction.action}). Accept this change immediately, warmly, and concisely without arguing or questioning the user's correction.`;
        }
      }

      // Memory Injection Protection (Requirement 9)
      const memoryContext = relevantMemories.length > 0 
        ? formatMemoriesForContext(relevantMemories) 
        : '';

      const effectiveSystemInstruction = `${INFBOTT_SYSTEM_INSTRUCTION}${memoryContext}${correctionNotice}`;

      const geminiHistory = [];
      if (previousMessages && previousMessages.length > 0) {
        for (const msg of previousMessages) {
          geminiHistory.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content || "..." }]
          });
        }
      }

      if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
        geminiHistory.pop();
      }

      // Configure tools: Enable Google Search Grounding for web research only if requested
      const tools: any[] = [];
      if (enableSearch) {
        tools.push({ googleSearch: {} });
      }

      const chat = ai.chats.create({
        model: modelName,
        history: geminiHistory,
        config: {
          systemInstruction: effectiveSystemInstruction,
          temperature: 0.7,
          tools,
        },
      });

      const parts: any[] = [];
      if (message) {
        parts.push({ text: message });
      }

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          const dataToUse = att.data || '';
          const mimeType = att.mimeType || 'image/png';
          
          if (att.type === 'image') {
            const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
            if (base64Data && !base64Data.startsWith('http')) {
              parts.push({
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              });
            }
          } else if (att.type === 'document' || att.type === 'file') {
            if (mimeType === 'application/pdf') {
              const base64Data = dataToUse.includes(',') ? dataToUse.split(',')[1] : dataToUse;
              if (base64Data && !base64Data.startsWith('http')) {
                parts.push({
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data
                  }
                });
              }
            } else {
              // Raw text, code, CSV, JSON, or DOCX parsed text
              parts.push({
                text: `\n\n--- [Attached Document: ${att.name || 'File'}] ---\n${dataToUse}\n--- [End of ${att.name || 'File'}] ---\n`
              });
            }
          }
        }
      }

      if (parts.length === 0) {
        parts.push({ text: "Hello! I am ready to assist you." });
      }

      const modelsToTry = [
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest"
      ];
      let streamedAny = false;
      let lastError = null;

      for (const mName of modelsToTry) {
        try {
          const modelChat = ai.chats.create({
            model: mName,
            history: geminiHistory,
            config: {
              systemInstruction: effectiveSystemInstruction,
              temperature: 0.7,
              tools,
            },
          });
          const streamResponse = await modelChat.sendMessageStream({ message: parts });

          for await (const chunk of streamResponse) {
            if (chunk.text) {
              streamedAny = true;
              res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.text })}\n\n`);
            }

            const candidates = (chunk as any)?.candidates;
            if (candidates && candidates[0]?.groundingMetadata) {
              const gm = candidates[0].groundingMetadata;
              const groundingChunks = gm.groundingChunks || [];
              const sources = groundingChunks
                .filter((c: any) => c.web?.uri)
                .map((c: any) => ({
                  title: c.web.title || new URL(c.web.uri).hostname,
                  url: c.web.uri,
                  snippet: c.web.snippet || ''
                }));

              if (sources.length > 0) {
                res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
              }
            }
          }

          if (streamedAny) {
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${mName} stream failed:`, err?.status, err?.message);
          lastError = err;
          if (streamedAny) {
            break;
          }
        }
      }

      if (!streamedAny) {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (openaiApiKey) {
          try {
            const openai = new OpenAI({ apiKey: openaiApiKey });
            const openaiMessages: any[] = [];
            if (effectiveSystemInstruction) {
              openaiMessages.push({ role: 'system', content: effectiveSystemInstruction });
            }
            if (previousMessages) {
              for (const pm of previousMessages) {
                openaiMessages.push({ role: pm.role === 'user' ? 'user' : 'assistant', content: pm.content || '' });
              }
            }
            openaiMessages.push({ role: 'user', content: message || 'Hello' });

            const opStream = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: openaiMessages,
              stream: true,
            });

            for await (const opChunk of opStream) {
              const content = opChunk.choices[0]?.delta?.content || '';
              if (content) {
                streamedAny = true;
                res.write(`data: ${JSON.stringify({ type: 'text', content })}\n\n`);
              }
            }
            if (streamedAny) {
              res.write(`data: [DONE]\n\n`);
              return;
            }
          } catch (opErr) {
            console.warn("OpenAI fallback chat failed:", opErr);
          }
        }

        const friendlyMsg = lastError?.status === 429
          ? "INFBOTT has reached its API quota limit (HTTP 429). Please wait a moment or configure your own API key."
          : "Sorry, I couldn't connect to the AI service right now. Please verify your API key or try again.";

        res.write(`data: ${JSON.stringify({ type: 'error', message: friendlyMsg, status: lastError?.status || 503 })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return;
      }

      res.write(`data: [DONE]\n\n`);
    } catch (error: any) {
      console.error("API Error in backend proxy:", error);
      let friendlyMessage = error.message || "Failed to get response.";
      let status = error.status || error.statusCode || 500;

      if (status === 401 || friendlyMessage.includes('401') || friendlyMessage.includes('API_KEY_INVALID') || friendlyMessage.includes('invalid api key')) {
        friendlyMessage = "Invalid or missing API credentials (HTTP 401). Please configure a valid API key.";
        status = 401;
      } else if (status === 403 || friendlyMessage.includes('403') || friendlyMessage.includes('PERMISSION_DENIED')) {
        friendlyMessage = "Permission or access denied (HTTP 403).";
        status = 403;
      } else if (status === 429 || friendlyMessage.includes('429') || friendlyMessage.includes('quota') || friendlyMessage.includes('Resource Exhausted')) {
        friendlyMessage = "INFBOTT has reached its API quota limit (HTTP 429). Please wait a moment or configure your own API key.";
        status = 429;
      } else if (status >= 500 || friendlyMessage.includes('UNAVAILABLE') || friendlyMessage.includes('503') || friendlyMessage.includes('Internal')) {
        friendlyMessage = "Provider or server failure (HTTP 5xx). Please try again later.";
        status = 503;
      } else if (friendlyMessage.includes('timeout') || friendlyMessage.includes('ETIMEDOUT')) {
        friendlyMessage = "Connection timeout or network failure. Please check your internet connection.";
        status = 408;
      }

      res.write(`data: ${JSON.stringify({ type: 'error', message: friendlyMessage, status })}\n\n`);
    } finally {
      clearInterval(keepAlive);
      res.end();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === 'GET') {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Express Global Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ type: 'error', message: err.message || "Internal Server Error", raw: String(err) });
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`INFBOTT Server running on http://localhost:${PORT}`);
  });
}

startServer();
