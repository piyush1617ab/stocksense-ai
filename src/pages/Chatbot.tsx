import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatMessage from "@/components/ChatMessage";
import { sendMessage, suggestedQuestions, type ChatMessage as ChatMsg } from "@/services/chat";

/**
 * 🔌 CHATBOT PAGE
 *
 * Uses src/services/chat.ts under the hood.
 * To connect your own AI model:
 *   1. Set VITE_USE_MOCKS=false in .env.local
 *   2. Implement POST /api/chat (see BACKEND.md)
 *   — OR —
 *   For streaming: use streamChat() from services/chat.ts
 *   and set VITE_CHAT_URL to your SSE endpoint.
 */

const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      content:
        "Hi! I'm **StockSense AI** 🤖\n\nI'm here to help you learn about stocks and investing. Ask me anything — I'll explain it in simple terms!\n\nTry clicking one of the suggestions below to get started.",
      role: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;
    setInput("");
    const userMsg: ChatMsg = { content: msg, role: "user" };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsTyping(true);

    try {
      const reply = await sendMessage(updated);
      setMessages((prev) => [...prev, { content: reply, role: "bot" }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { content: "Sorry, something went wrong. Please try again.", role: "bot" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 flex-col container mx-auto max-w-3xl px-4">
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-sm">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">StockSense AI Assistant</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
              Online — Ask about stocks & investing
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 py-6 overflow-y-auto">
          {messages.map((msg, i) => (
            <ChatMessage key={i} content={msg.content} role={msg.role === "bot" ? "bot" : "user"} />
          ))}
          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border bg-card px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pb-4 animate-slide-up">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="rounded-full border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md hover:-translate-y-0.5"
              >
                <Sparkles className="inline h-3 w-3 mr-1.5 text-primary" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-0 border-t bg-background/90 backdrop-blur-sm py-4">
          <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about stocks, investing, market terms..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Demo chatbot — connect your own AI backend for full functionality
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
