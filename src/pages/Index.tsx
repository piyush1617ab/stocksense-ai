import { useState, useEffect } from "react";
import { TrendingUp, BarChart3, Brain, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";
import MarketOverview from "@/components/MarketOverview";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import PersonalizedFeed from "@/components/PersonalizedFeed";
import { popularStocks } from "@/data/dummyData";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover opacity-20" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/90 to-background" />
        </div>

        <div className="relative container mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-Powered Stock Analysis for Beginners
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-slide-up">
              Understand Stocks.
              <br />
              <span className="text-muted-foreground">Learn Smart Investing.</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-lg mx-auto animate-slide-up">
              Get AI-powered insights, beginner-friendly explanations, and real-time market analysis — all in one place.
            </p>

            <div className="animate-slide-up">
              <SearchBar large />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 animate-fade-in">
              <Link
                to="/chatbot"
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-md transition-transform hover:scale-105"
              >
                <Brain className="h-4 w-4" />
                Ask AI Assistant
              </Link>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 rounded-xl border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                <BookOpen className="h-4 w-4" />
                Start Learning
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized "For You" feed */}
      <PersonalizedFeed />

      {/* Market Overview */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Market Overview</h2>
          <span className="text-xs text-muted-foreground">Live (demo data)</span>
        </div>
        <MarketOverview />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: TrendingUp, title: "Real-time Analysis", desc: "Track price trends, RSI, and moving averages with visual indicators", color: "text-success" },
            { icon: Brain, title: "AI Explanations", desc: "Complex market data explained in simple, beginner-friendly language", color: "text-primary" },
            { icon: BarChart3, title: "Smart Insights", desc: "Bullish, bearish, or neutral — know the trend at a glance", color: "text-danger" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-accent mb-4 transition-colors group-hover:gradient-primary`}>
                <Icon className={`h-6 w-6 ${color} group-hover:text-primary-foreground`} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Stocks */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Popular Stocks</h2>
          <span className="text-xs text-muted-foreground">Tap to view analysis</span>
        </div>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
            {popularStocks.map((stock) => (
              <StockCard key={stock.symbol} {...stock} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 StockSense AI — Built for learning purposes. Data shown is placeholder only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
