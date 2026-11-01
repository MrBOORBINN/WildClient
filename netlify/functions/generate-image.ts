import { GoogleGenAI } from "@google/genai";
import firebaseConfig from "../../firebase-applet-config.json";

async function getAuthenticatedUser(req: Request): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const idToken = authHeader.split(" ")[1]?.trim();
  if (!idToken) return null;

  try {
    const apiKey = (firebaseConfig as any).apiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) return null;
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

async function getUserCredits(uid: string): Promise<number> {
  try {
    const dbUrl = `https://firestore.googleapis.com/v1/projects/${(firebaseConfig as any).projectId}/databases/${(firebaseConfig as any).firestoreDatabaseId}/documents/users/${uid}`;
    const res = await fetch(dbUrl);
    if (res.ok) {
      const doc = await res.json();
      const fields = doc.fields || {};
      if (fields.credits && typeof fields.credits.integerValue !== 'undefined') {
        return parseInt(fields.credits.integerValue, 10);
      }
    }
    return 70;
  } catch {
    return 70;
  }
}

async function setUserCredits(uid: string, credits: number): Promise<void> {
  try {
    const dbUrl = `https://firestore.googleapis.com/v1/projects/${(firebaseConfig as any).projectId}/databases/${(firebaseConfig as any).firestoreDatabaseId}/documents/users/${uid}`;
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

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
      status: 405, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const authUser = await getAuthenticatedUser(req);
  let currentCredits = 70;
  if (authUser) {
    currentCredits = await getUserCredits(authUser.uid);
  }

  if (currentCredits < 10) {
    return new Response(JSON.stringify({
      error: "Insufficient credits. You need 10 credits to generate an image. Please top up your account.",
      creditsRemaining: currentCredits
    }), {
      status: 402,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, aspectRatio = '1:1', image } = body;

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "API key is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    let imageUrl = '';

    // If an image was passed for editing, attempt multimodal editing
    if (image && image.data) {
      const b64Data = image.data.includes(',') ? image.data.split(',')[1] : image.data;
      const mime = image.mimeType || 'image/png';
      const editModels = ['gemini-3.1-flash-lite-image', 'gemini-3.8-flash'];
      for (const editModel of editModels) {
        if (imageUrl) break;
        try {
          const response = await ai.models.generateContent({
            model: editModel,
            contents: {
              parts: [
                { inlineData: { data: b64Data, mimeType: mime } },
                { text: `Modify this image according to: ${prompt}. Output modified image.` }
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
        } catch (e) {
          console.warn(`Multimodal edit notice for ${editModel}:`, e);
        }
      }
    }

    // Standard text-to-image generation
    if (!imageUrl) {
      const imageModels = ['imagen-3.0-generate-002', 'imagen-3.0-generate-001'];
      for (const mName of imageModels) {
        if (imageUrl) break;
        try {
          const response = await ai.models.generateImages({
            model: mName,
            prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio || '1:1',
            }
          });
          if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
            imageUrl = `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
            break;
          }
        } catch (imgErr) {
          console.warn(`Model ${mName} generate failed:`, imgErr);
        }
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({
        error: "Image generation model is currently unavailable or quota limit was reached. No credits were deducted.",
        creditsRemaining: currentCredits
      }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // Deduct 10 credits on verified success
    const newCredits = Math.max(0, currentCredits - 10);
    if (authUser) {
      await setUserCredits(authUser.uid, newCredits);
    }

    return new Response(JSON.stringify({
      imageUrl,
      cost: 10,
      creditsRemaining: newCredits,
      isEdit: Boolean(image && image.data)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to process image generation" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = {
  path: "/api/generate-image",
};
