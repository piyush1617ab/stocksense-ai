/**
 * Chat service — calls the Supabase Edge Function `chat`, which proxies
 * streaming requests to Google Gemini using GEMINI_API_KEY (Supabase secret).
 */

import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant" | "bot";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/**
 * Stream a chat reply token-by-token. Calls onDelta with each chunk.
 */
export async function streamChat({
  messages,
  onDelta,
  onDone,
  signal,
}: {
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  onDone: (full: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? ANON;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: ANON,
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role === "bot" ? "assistant" : m.role,
        content: m.content,
      })),
    }),
    signal,
  });

  if (!resp.ok) {
    let errMsg = `Chat failed (${resp.status})`;
    try {
      const errBody = await resp.json();
      if (errBody?.error) errMsg = errBody.error;
    } catch { /* ignore */ }
    if (resp.status === 429) errMsg = "You're sending messages too fast. Wait a moment and try again.";
    if (resp.status === 402) errMsg = "AI quota exceeded. Check your Gemini API key billing.";
    throw new Error(errMsg);
  }
  if (!resp.body) throw new Error("No response stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let full = "";

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
        if (json === "[DONE]") {
          onDone(full);
          return;
        }
        try {
          const parsed = JSON.parse(json);
          if (parsed.delta) {
            full += parsed.delta;
            onDelta(parsed.delta);
          }
        } catch { /* ignore */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
  onDone(full);
}

export const suggestedQuestions = [
  "What is a stock?",
  "How to start investing in India?",
  "Explain RSI in simple terms",
  "What is P/E ratio?",
  "Difference between NSE and BSE?",
  "What are SIPs?",
];
