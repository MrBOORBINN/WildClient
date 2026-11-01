import { extractMemoryCandidatesFromText, isTransientQuery, isSensitive } from "../../src/services/memoryEngine";
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
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { userText, assistantResponse } = body;
    if (!userText || typeof userText !== 'string' || isTransientQuery(userText) || isSensitive(userText)) {
      return new Response(JSON.stringify({ extracted: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const extracted = extractMemoryCandidatesFromText(userText, assistantResponse);
    return new Response(JSON.stringify({ extracted }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to extract memories" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = {
  path: "/api/memories/extract",
};
