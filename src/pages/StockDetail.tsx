import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Brain, Newspaper, Minus } from "lucide-react";
import Navbar from "@/components/Navbar";
import InsightCard from "@/components/InsightCard";
import { stockDetails } from "@/data/dummyData";
import { Skeleton } from "@/components/ui/skeleton";

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const stock = symbol ? stockDetails[symbol.toUpperCase()] : null;

  if (!stock) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Stock not found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find data for "{symbol}"</p>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const TrendIcon = stock.trendType === "success" ? TrendingUp : stock.trendType === "danger" ? TrendingDown : Minus;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-muted-foreground">{stock.name}</p>
            <h1 className="text-3xl font-bold text-foreground">{stock.symbol}</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground">₹{stock.price.toLocaleString()}</p>
            <p className={`text-sm font-medium ${isPositive ? "text-success" : "text-danger"}`}>
              {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="mb-8 flex h-56 items-center justify-center rounded-xl border bg-card shadow-sm">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="mx-auto mb-2 h-10 w-10 opacity-30" />
            <p className="text-sm">Price chart coming soon</p>
          </div>
        </div>

        {/* Key Insights */}
        <h2 className="mb-3 text-lg font-semibold text-foreground">Key Insights</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          <InsightCard
            icon={<TrendIcon className="h-5 w-5" />}
            label="Trend"
            value={stock.trend}
            variant={stock.trendType}
          />
          <InsightCard
            icon={<Activity className="h-5 w-5" />}
            label="RSI (14)"
            value={stock.rsi.toString()}
            variant={stock.rsi > 70 ? "danger" : stock.rsi < 30 ? "success" : "neutral"}
          />
          <InsightCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="50-Day MA"
            value={`₹${stock.movingAvg.toLocaleString()}`}
            variant="neutral"
          />
        </div>

        {/* AI Explanation */}
        <h2 className="mb-3 text-lg font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> AI Explanation
        </h2>
        <div className="mb-8 rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm leading-relaxed text-foreground">{stock.aiExplanation}</p>
        </div>

        {/* Latest News */}
        <h2 className="mb-3 text-lg font-semibold text-foreground flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" /> Latest News
        </h2>
        <div className="space-y-3 pb-8">
          {stock.news.map((item, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.source} · {item.time}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
