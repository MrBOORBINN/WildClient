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
    const url = body?.url;
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: "URL is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: "Only HTTP and HTTPS URLs are supported." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const port = parsedUrl.port;

    if (port && !['80', '443', '8080', '8443'].includes(port)) {
      return new Response(JSON.stringify({ error: "Access to non-standard or internal ports is forbidden." }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const isForbidden = 
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname === 'metadata.google.internal' ||
      hostname === 'metadata' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('0.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      /^0x[0-9a-f]+$/i.test(hostname) ||
      /^\d+$/.test(hostname) ||
      /^0[0-7]+$/.test(hostname);

    if (isForbidden) {
      return new Response(JSON.stringify({ error: "Access to private, loopback, or internal cloud metadata targets is forbidden." }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Compatible; INFBOTT/1.0; +https://infbott.ai)'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch URL: HTTP ${response.status} ${response.statusText}` }), {
        status: response.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
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

    return new Response(JSON.stringify({
      url,
      title,
      description,
      content: cleanText
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: "Request timeout while trying to fetch URL." }), {
        status: 504,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    return new Response(JSON.stringify({ error: err.message || "Failed to retrieve webpage." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = {
  path: "/api/fetch-url",
};
