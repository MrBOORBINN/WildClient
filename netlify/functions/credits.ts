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
    await setUserCredits(uid, 70);
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const url = new URL(req.url);

  // POST /api/credits/topup
  if (req.method === "POST") {
    try {
      const authUser = await getAuthenticatedUser(req);
      const body = await req.json().catch(() => ({}));
      const addCredits = Math.min(1000, Math.max(10, Number(body?.amount) || 50));

      if (authUser) {
        const current = await getUserCredits(authUser.uid);
        const updated = current + addCredits;
        await setUserCredits(authUser.uid, updated);
        return new Response(JSON.stringify({ success: true, credits: updated, added: addCredits }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      return new Response(JSON.stringify({ success: true, credits: 70 + addCredits, added: addCredits }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Failed to top up credits." }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }

  // GET /api/credits
  if (req.method === "GET") {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return new Response(JSON.stringify({ credits: 70 }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const credits = await getUserCredits(authUser.uid);
    return new Response(JSON.stringify({ credits }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
    status: 405, 
    headers: { "Content-Type": "application/json" } 
  });
};

export const config = {
  path: "/api/credits",
};
