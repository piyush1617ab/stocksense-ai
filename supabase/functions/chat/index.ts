// AI chat edge function — proxies streaming requests to Google Gemini.
// Uses GEMINI_API_KEY (set in Supabase project secrets).
//
// Body: { messages: [{ role: "user"|"assistant", content: string }, ...] }
// Returns: text/event-stream with `data: {delta}` chunks, terminated by `data: [DONE]`.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = "gemini-1.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are StockSense AI, a friendly stock-market tutor for Indian and global investors.

Guidelines:
- Explain concepts in simple, beginner-friendly language with concrete examples.
- Be especially knowledgeable about Indian markets (NSE, BSE, Nifty 50, Sensex, SEBI, Demat accounts, SIPs, mutual funds, IPOs).
- Cover global markets too (NYSE, NASDAQ, S&P 500) when asked.
- Use markdown for formatting: **bold**, lists, tables, and \`code\` for tickers.
- Use emojis sparingly to add warmth (📈 📉 💡).
- For specific stocks, share educational context (what the company does, sector, key ratios) but ALWAYS add: "This is educational information, not investment advice. Please consult a SEBI-registered advisor before investing."
- Never guarantee returns or give personalized buy/sell calls.
- If asked something off-topic, politely redirect to stocks/investing.
- Keep replies focused and skimmable — short paragraphs, headings where useful.`;

interface InMsg { role: "user" | "assistant"; content: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = (await req.json()) as { messages: InMsg[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert OpenAI-style messages to Gemini "contents" format.
    const contents = messages
      .filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const geminiBody = {
      contents,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    };

    const upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      console.error("[chat] gemini error", upstream.status, errText);
      const status = upstream.status === 429 ? 429 : upstream.status === 403 ? 402 : 500;
      return new Response(
        JSON.stringify({ error: errText || `Gemini ${upstream.status}` }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Pipe Gemini SSE → our own SSE format (just the delta text).
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let idx: number;
            while ((idx = buf.indexOf("\n")) !== -1) {
              const line = buf.slice(0, idx).replace(/\r$/, "");
              buf = buf.slice(idx + 1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json) continue;
              try {
                const parsed = JSON.parse(json);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
                }
              } catch {
                // ignore malformed lines
              }
            }
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (e) {
          console.error("[chat] stream error", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat] error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
