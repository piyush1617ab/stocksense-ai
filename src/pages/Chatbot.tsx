import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatMessage from "@/components/ChatMessage";

interface Message {
  content: string;
  role: "user" | "bot";
}

const suggestedQuestions = [
  "What is a stock?",
  "How to start investing?",
  "What is RSI?",
  "Explain moving averages",
];

const botResponses: Record<string, string> = {
  "what is a stock?":
    "A stock represents a share in the ownership of a company. When you buy a stock, you're buying a small piece of that company. If the company does well, the value of your stock goes up. If it does poorly, the value goes down. Stocks are traded on stock exchanges like NSE and BSE in India.",
  "how to start investing?":
    "Here's a beginner's guide to start investing:\n\n1. Open a Demat and trading account with a broker (Zerodha, Groww, etc.)\n2. Start with small amounts you can afford to lose\n3. Learn the basics — understand what P/E ratio, market cap, and EPS mean\n4. Begin with index funds or blue-chip stocks\n5. Diversify your portfolio\n6. Invest regularly (SIP approach)\n7. Be patient — investing is a long-term game!",
  "what is rsi?":
    "RSI (Relative Strength Index) is a momentum indicator that measures the speed and magnitude of price changes. It ranges from 0 to 100.\n\n• Above 70 = Overbought (stock might be too expensive)\n• Below 30 = Oversold (stock might be undervalued)\n• Around 50 = Neutral\n\nTraders use RSI to identify potential buy/sell opportunities.",
  "explain moving averages":
    "A Moving Average (MA) smooths out price data to show the overall trend direction.\n\n• 50-Day MA: Shows medium-term trend\n• 200-Day MA: Shows long-term trend\n\nWhen the price is above the MA → Bullish signal\nWhen the price is below the MA → Bearish signal\n\nThe 'Golden Cross' (50-MA crosses above 200-MA) is considered very bullish!",
};

const getResponse = (input: string): string => {
  const key = input.toLowerCase().trim().replace(/[?!.]+$/, "").trim() + "?";
  const match = Object.keys(botResponses).find((k) => key.includes(k.replace("?", "")));
  return match
    ? botResponses[match]
    : "That's a great question! I'm a demo chatbot with limited responses. In the full version, I'd use AI to give you a detailed, personalized answer about stocks and investing. Try asking: \"What is a stock?\" or \"How to start investing?\"";
};

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    { content: "Hi! I'm StockSense AI. Ask me anything about stocks and investing. I'm here to help beginners learn! 📈", role: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages((prev) => [...prev, { content: msg, role: "user" }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { content: getResponse(msg), role: "bot" }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 flex-col container mx-auto max-w-3xl px-4">
        {/* Messages */}
        <div className="flex-1 space-y-4 py-6 overflow-y-auto">
          {messages.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-xs">AI</span>
              </div>
              <div className="rounded-2xl border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 pb-4">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-0 border-t bg-background py-4">
          <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about stocks, investing..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
