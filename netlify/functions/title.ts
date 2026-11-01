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

  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ title: "New Conversation" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const clean = message.replace(/[#*`_~[\]()]/g, '').trim();
    const stripped = clean
      .replace(/^(can you (please )?|please |could you |how to |what is |explain |tell me about |generate |create |write |build )/i, '')
      .trim();
    const words = stripped.split(/\s+/).slice(0, 5).join(' ');
    const title = words ? (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 32) : "New Conversation";

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ title: "New Conversation" }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = {
  path: "/api/title",
};
