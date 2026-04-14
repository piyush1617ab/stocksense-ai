import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot } from "lucide-react";
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
  "What is P/E ratio?",
  "How does the stock market work?",
];

const botResponses: Record<string, string> = {
  "what is a stock":
    "A **stock** represents a share in the ownership of a company. When you buy a stock, you're buying a small piece of that company.\n\n**Key points:**\n- If the company does well → stock value goes **up** 📈\n- If it does poorly → stock value goes **down** 📉\n- Stocks are traded on exchanges like **NSE** and **BSE** in India\n- You need a **Demat account** to buy stocks\n\nThink of it like buying a tiny slice of a pizza (company). If the pizza becomes more popular, your slice becomes more valuable!",
  "how to start investing":
    "Here's a **beginner's guide** to start investing:\n\n1. **Open a Demat & trading account** — Use Zerodha, Groww, or Angel One\n2. **Start small** — Invest only what you can afford to lose\n3. **Learn the basics** — Understand P/E ratio, market cap, EPS\n4. **Begin with index funds** — Like Nifty 50 ETF for diversification\n5. **Diversify** — Don't put all eggs in one basket\n6. **Use SIP approach** — Invest regularly, not all at once\n7. **Be patient** — Investing is a marathon, not a sprint! 🏃‍♂️\n\n> **Pro tip:** Start with ₹500/month in a mutual fund SIP to build the habit.",
  "what is rsi":
    "**RSI (Relative Strength Index)** is a momentum indicator that measures price change speed.\n\nIt ranges from **0 to 100**:\n\n| RSI Range | Signal | Meaning |\n|-----------|--------|--------|\n| Above 70 | 🔴 Overbought | Stock might be too expensive |\n| Below 30 | 🟢 Oversold | Stock might be undervalued |\n| Around 50 | ⚪ Neutral | No strong signal |\n\nTraders use RSI to spot potential **buy/sell opportunities**. But never rely on RSI alone — always combine with other indicators!",
  "explain moving averages":
    "A **Moving Average (MA)** smooths out price data to show the overall trend.\n\n**Common types:**\n- **50-Day MA** — Shows medium-term trend\n- **200-Day MA** — Shows long-term trend\n\n**How to read:**\n- Price **above** MA → 📈 Bullish signal\n- Price **below** MA → 📉 Bearish signal\n\n**Golden Cross** ✨ — When 50-MA crosses *above* 200-MA → Very bullish!\n\n**Death Cross** 💀 — When 50-MA crosses *below* 200-MA → Very bearish!\n\nMoving averages help filter out daily noise and show the *real* direction.",
  "what is p/e ratio":
    "**P/E Ratio (Price-to-Earnings)** tells you how much investors are willing to pay per rupee of earnings.\n\n**Formula:** `Stock Price ÷ Earnings Per Share`\n\n**Example:**\n- Stock price: ₹100, EPS: ₹5 → P/E = 20\n- This means investors pay ₹20 for every ₹1 of profit\n\n**How to interpret:**\n- **High P/E (>25)** — Expensive, but could mean high growth expected\n- **Low P/E (<15)** — Cheaper, but could mean slow growth\n- Always compare P/E within the **same industry**\n\n> A low P/E doesn't always mean 'good deal' — the company might have problems!",
  "how does the stock market work":
    "The **stock market** is like a marketplace where people buy and sell shares of companies.\n\n**How it works:**\n\n1. **Companies list on exchanges** (NSE/BSE) through an **IPO**\n2. **Investors buy shares** through brokers\n3. **Price changes** based on supply & demand\n4. More buyers → price goes **up** 📈\n5. More sellers → price goes **down** 📉\n\n**Key players:**\n- **Retail investors** — People like you and me\n- **Institutional investors** — Mutual funds, banks, FIIs\n- **SEBI** — The regulator ensuring fair play\n\n**Market hours:** 9:15 AM – 3:30 PM (Mon-Fri)\n\nThe market reflects the collective opinion of millions of investors about a company's future!",
};

const getResponse = (input: string): string => {
  const cleaned = input.toLowerCase().trim().replace(/[?!.]+$/, "").trim();
  const match = Object.keys(botResponses).find((k) => cleaned.includes(k));
  return match
    ? botResponses[match]
    : "That's a great question! 🤔\n\nI'm currently a **demo chatbot** with limited responses. In the full version, I'll use AI to give detailed, personalized answers.\n\n**Try asking:**\n- What is a stock?\n- How to start investing?\n- What is RSI?\n- What is P/E ratio?\n- Explain moving averages\n- How does the stock market work?";
};

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      content: "Hi! I'm **StockSense AI** 🤖\n\nI'm here to help you learn about stocks and investing. Ask me anything — I'll explain it in simple terms!\n\nTry clicking one of the suggestions below to get started.",
      role: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;
    setInput("");
    setMessages((prev) => [...prev, { content: msg, role: "user" }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { content: getResponse(msg), role: "bot" }]);
      setIsTyping(false);
    }, 800 + Math.random() * 500);
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
            <ChatMessage key={i} {...msg} />
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
