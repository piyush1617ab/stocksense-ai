import { BookOpen, TrendingUp, BarChart3, Brain, Shield, PiggyBank, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

interface LessonTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  content: string[];
}

const topics: LessonTopic[] = [
  {
    id: "basics",
    title: "What is the Stock Market?",
    description: "Learn the fundamentals of how the stock market works",
    icon: <TrendingUp className="h-5 w-5" />,
    difficulty: "Beginner",
    duration: "5 min read",
    content: [
      "The stock market is a marketplace where buyers and sellers trade shares of publicly listed companies. In India, the two main exchanges are the National Stock Exchange (NSE) and the Bombay Stock Exchange (BSE).",
      "When a company wants to raise money, it can sell shares to the public through an IPO (Initial Public Offering). After that, those shares trade freely on the exchange.",
      "Stock prices change based on supply and demand. If more people want to buy a stock than sell it, the price goes up. If more people want to sell, the price goes down.",
      "The market operates from 9:15 AM to 3:30 PM, Monday through Friday (except holidays). SEBI (Securities and Exchange Board of India) regulates the market to ensure fair trading.",
    ],
  },
  {
    id: "analysis",
    title: "Technical vs Fundamental Analysis",
    description: "Two approaches to evaluating stocks and making decisions",
    icon: <BarChart3 className="h-5 w-5" />,
    difficulty: "Intermediate",
    duration: "8 min read",
    content: [
      "Fundamental Analysis looks at a company's financial health — revenue, profit, debt, management quality, and industry position. It answers: 'Is this a good company?'",
      "Key fundamental metrics include P/E Ratio (price relative to earnings), P/B Ratio (price relative to book value), ROE (return on equity), and Debt-to-Equity ratio.",
      "Technical Analysis studies price charts and patterns to predict future price movements. It uses indicators like RSI, Moving Averages, MACD, and Bollinger Bands.",
      "Most successful investors use a combination of both. Use fundamentals to pick WHAT to buy, and technicals to decide WHEN to buy or sell.",
    ],
  },
  {
    id: "indicators",
    title: "Understanding Key Indicators",
    description: "RSI, Moving Averages, MACD and what they tell you",
    icon: <Brain className="h-5 w-5" />,
    difficulty: "Intermediate",
    duration: "7 min read",
    content: [
      "RSI (Relative Strength Index) measures momentum on a 0-100 scale. Above 70 = overbought (might fall), below 30 = oversold (might rise), around 50 = neutral.",
      "Moving Averages smooth out price data. The 50-day MA shows medium-term trend, 200-day MA shows long-term trend. When price is above the MA, the trend is bullish.",
      "The 'Golden Cross' happens when the 50-day MA crosses above the 200-day MA — a strong bullish signal. The opposite is called the 'Death Cross' — a bearish signal.",
      "MACD (Moving Average Convergence Divergence) shows the relationship between two moving averages. When the MACD line crosses above the signal line, it's a buy signal.",
    ],
  },
  {
    id: "risk",
    title: "Risk Management Essentials",
    description: "How to protect your portfolio from big losses",
    icon: <Shield className="h-5 w-5" />,
    difficulty: "Beginner",
    duration: "6 min read",
    content: [
      "Never invest more than you can afford to lose. A good rule: keep 3-6 months of expenses in an emergency fund before investing in stocks.",
      "Diversification is key — spread your money across different sectors (IT, Banking, FMCG, Pharma) and asset classes (stocks, bonds, gold, fixed deposits).",
      "Use stop-loss orders to automatically sell if a stock falls below a certain price. This limits your maximum loss on any single trade.",
      "The 1% rule: Never risk more than 1-2% of your total portfolio on a single trade. This ensures no single bad trade wipes you out.",
    ],
  },
  {
    id: "getting-started",
    title: "Your First Investment",
    description: "Step-by-step guide to making your first stock purchase",
    icon: <PiggyBank className="h-5 w-5" />,
    difficulty: "Beginner",
    duration: "10 min read",
    content: [
      "Step 1: Open a Demat and Trading account with a broker like Zerodha, Groww, or Angel One. You'll need your PAN card, Aadhaar, and bank details.",
      "Step 2: Start with a small amount — ₹500 to ₹5,000. Consider beginning with Index ETFs (like Nifty 50 ETF) which give you instant diversification.",
      "Step 3: Research before buying. Look at the company's P/E ratio, revenue growth, and industry outlook. Use the StockSense AI chatbot to understand these metrics!",
      "Step 4: Place your order. A 'Market Order' buys at the current price. A 'Limit Order' lets you set your desired price. Start with market orders for simplicity.",
    ],
  },
];

const difficultyColors = {
  Beginner: "bg-success-muted text-success",
  Intermediate: "bg-primary/10 text-primary",
  Advanced: "bg-danger-muted text-danger",
};

const Learn = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="container mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm mb-4">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          Learning Center
        </div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-3">
          Learn <span className="gradient-text">Smart Investing</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Free beginner-friendly lessons to help you understand the stock market, technical analysis, and building your first portfolio.
        </p>
      </section>

      {/* Topics */}
      <section className="container mx-auto px-4 pb-12 max-w-3xl">
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <button
                onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                className="flex w-full items-center gap-4 p-5 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {topic.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{topic.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColors[topic.difficulty]}`}>
                      {topic.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{topic.description} · {topic.duration}</p>
                </div>
                {expanded === topic.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {expanded === topic.id && (
                <div className="border-t px-5 py-5 animate-fade-in">
                  <div className="space-y-4 pl-16">
                    {topic.content.map((paragraph, i) => (
                      <p key={i} className="text-sm leading-relaxed text-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="mt-5 pl-16">
                    <Link
                      to="/chatbot"
                      className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                    >
                      <Brain className="h-3.5 w-3.5" />
                      Have questions? Ask the AI chatbot
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl gradient-primary p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-primary-foreground mb-2">Ready to practice?</h2>
          <p className="text-primary-foreground/80 text-sm mb-5">
            Try analyzing real stocks with our AI-powered tools or ask the chatbot your questions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-transform hover:scale-105"
            >
              <TrendingUp className="h-4 w-4" /> Explore Stocks
            </Link>
            <Link
              to="/chatbot"
              className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/20 px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
            >
              <Brain className="h-4 w-4" /> Ask AI
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 StockSense AI — Educational content for beginners. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Learn;
