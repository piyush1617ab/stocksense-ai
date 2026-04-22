/**
 * 🔌 CHATBOT SERVICE — Backend integration point
 *
 * This service abstracts all chatbot/AI communication.
 * Currently uses local mock responses; swap with your real backend.
 *
 * ── How to connect your own AI backend ──
 *
 * Option A: Direct API
 *   Replace `sendMessage()` body with a fetch to your endpoint:
 *     const res = await apiFetch<{ reply: string }>("/api/chat", {
 *       method: "POST",
 *       body: { messages },
 *     });
 *     return res.reply;
 *
 * Option B: Streaming (SSE)
 *   Use `streamChat()` below — it's pre-wired for OpenAI-compatible
 *   streaming. Just set VITE_CHAT_URL or change the URL constant.
 *
 * Option C: Lovable Cloud + Edge Function
 *   See BACKEND.md § Chat. Deploy a Supabase Edge Function and
 *   call it via supabase.functions.invoke("chat", { body: ... }).
 */

import { apiFetch, USE_MOCKS } from "@/lib/api";

export interface ChatMessage {
  role: "user" | "assistant" | "bot";
  content: string;
}

// ── Mock responses (used when VITE_USE_MOCKS=true) ────────────────

const mockResponses: Record<string, string> = {
  "what is a stock":
    "A **stock** represents a share in the ownership of a company. When you buy a stock, you're buying a small piece of that company.\n\n**Key points:**\n- If the company does well → stock value goes **up** 📈\n- If it does poorly → stock value goes **down** 📉\n- Stocks are traded on exchanges like **NSE** and **BSE** in India\n- You need a **Demat account** to buy stocks\n\nThink of it like buying a tiny slice of a pizza (company). If the pizza becomes more popular, your slice becomes more valuable!",
  "how to start investing":
    "Here's a **beginner's guide** to start investing:\n\n1. **Open a Demat & trading account** — Use Zerodha, Groww, or Angel One\n2. **Start small** — Invest only what you can afford to lose\n3. **Learn the basics** — Understand P/E ratio, market cap, EPS\n4. **Begin with index funds** — Like Nifty 50 ETF for diversification\n5. **Diversify** — Don't put all eggs in one basket\n6. **Use SIP approach** — Invest regularly, not all at once\n7. **Be patient** — Investing is a marathon, not a sprint! 🏃‍♂️\n\n> **Pro tip:** Start with ₹500/month in a mutual fund SIP to build the habit.",
  "what is rsi":
    "**RSI (Relative Strength Index)** is a momentum indicator that measures price change speed.\n\nIt ranges from **0 to 100**:\n\n| RSI Range | Signal | Meaning |\n|-----------|--------|--------|\n| Above 70 | 🔴 Overbought | Stock might be too expensive |\n| Below 30 | 🟢 Oversold | Stock might be undervalued |\n| Around 50 | ⚪ Neutral | No strong signal |\n\nTraders use RSI to spot potential **buy/sell opportunities**. But never rely on RSI alone — always combine with other indicators!",
  "explain moving averages":
    "A **Moving Average (MA)** smooths out price data to show the overall trend.\n\n**Common types:**\n- **50-Day MA** — Shows medium-term trend\n- **200-Day MA** — Shows long-term trend\n\n**How to read:**\n- Price **above** MA → 📈 Bullish signal\n- Price **below** MA → 📉 Bearish signal\n\n**Golden Cross** ✨ — When 50-MA crosses *above* 200-MA → Very bullish!\n\n**Death Cross** 💀 — When 50-MA crosses *below* 200-MA → Very bearish!",
  "what is p/e ratio":
    "**P/E Ratio (Price-to-Earnings)** tells you how much investors are willing to pay per rupee of earnings.\n\n**Formula:** `Stock Price ÷ Earnings Per Share`\n\n**Example:**\n- Stock price: ₹100, EPS: ₹5 → P/E = 20\n- This means investors pay ₹20 for every ₹1 of profit\n\n**How to interpret:**\n- **High P/E (>25)** — Expensive, but could mean high growth expected\n- **Low P/E (<15)** — Cheaper, but could mean slow growth\n- Always compare P/E within the **same industry**",
  "how does the stock market work":
    "The **stock market** is like a marketplace where people buy and sell shares of companies.\n\n**How it works:**\n1. **Companies list on exchanges** (NSE/BSE) through an **IPO**\n2. **Investors buy shares** through brokers\n3. **Price changes** based on supply & demand\n4. More buyers → price goes **up** 📈\n5. More sellers → price goes **down** 📉\n\n**Market hours:** 9:15 AM – 3:30 PM (Mon-Fri)",
};

function getMockResponse(input: string): string {
  const cleaned = input.toLowerCase().trim().replace(/[?!.]+$/, "").trim();
  const match = Object.keys(mockResponses).find((k) => cleaned.includes(k));
  return match
    ? mockResponses[match]
    : "That's a great question! 🤔\n\nI'm currently a **demo chatbot** with limited responses. In the full version, I'll use AI to give detailed, personalized answers.\n\n**Try asking:**\n- What is a stock?\n- How to start investing?\n- What is RSI?\n- What is P/E ratio?\n- Explain moving averages\n- How does the stock market work?";
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Send a message and get a reply (non-streaming).
 * 🔌 Replace mock path with your real endpoint.
 */
export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  const lastMsg = messages[messages.length - 1];

  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    return getMockResponse(lastMsg.content);
  }

  // 🔌 Real backend call
  const res = await apiFetch<{ reply: string }>("/api/chat", {
    method: "POST",
    body: { messages: messages.map((m) => ({ role: m.role === "bot" ? "assistant" : m.role, content: m.content })) },
  });
  return res.reply;
}

/**
 * Stream a chat reply token-by-token (SSE).
 * 🔌 Pre-wired for OpenAI-compatible streaming endpoints.
 *
 * Usage:
 *   await streamChat({
 *     messages,
 *     onDelta: (chunk) => appendToUI(chunk),
 *     onDone: () => setLoading(false),
 *   });
 */
export async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const CHAT_URL = import.meta.env.VITE_CHAT_URL
    ?? `${import.meta.env.VITE_SUPABASE_URL ?? ""}/functions/v1/chat`;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        ? { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role === "bot" ? "assistant" : m.role,
        content: m.content,
      })),
    }),
  });

  if (!resp.ok || !resp.body) throw new Error("Failed to start stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

export const suggestedQuestions = [
  "What is a stock?",
  "How to start investing?",
  "What is RSI?",
  "Explain moving averages",
  "What is P/E ratio?",
  "How does the stock market work?",
];
