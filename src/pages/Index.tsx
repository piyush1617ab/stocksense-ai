import { TrendingUp, BarChart3, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";
import { popularStocks } from "@/data/dummyData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Brain className="h-3.5 w-3.5 text-primary" />
            AI-Powered Stock Analysis
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Understand Stocks.
            <br />
            <span className="text-primary">Learn Smart Investing.</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Get AI-powered insights, beginner-friendly explanations, and real-time analysis — all in one place.
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          {[
            { icon: TrendingUp, title: "Real-time Analysis", desc: "Track trends and indicators" },
            { icon: Brain, title: "AI Explanations", desc: "Beginner-friendly insights" },
            { icon: BarChart3, title: "Key Metrics", desc: "RSI, Moving Averages & more" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Stocks */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Popular Stocks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularStocks.map((stock) => (
            <StockCard key={stock.symbol} {...stock} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
