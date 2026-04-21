import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Brain, Newspaper, Minus, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import InsightCard from "@/components/InsightCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import PriceChart from "@/components/charts/PriceChart";
import StockExplainer from "@/components/learning/StockExplainer";
import LearningPath from "@/components/learning/LearningPath";
import StockAnalysis from "@/components/StockAnalysis";
import PriceAlertButton from "@/components/PriceAlertButton";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import GlossaryTerm from "@/components/glossary/GlossaryTerm";
import { useStock } from "@/hooks/useStock";

const StockDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: stock, isLoading } = useStock(symbol);

  if (!isLoading && !stock) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="mx-auto max-w-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Stock not found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find data for "{symbol}"</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = stock ? stock.change >= 0 : true;
  const TrendIcon = stock?.trendType === "success" ? TrendingUp : stock?.trendType === "danger" ? TrendingDown : Minus;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to stocks
        </Link>

        {isLoading || !stock ? (
          <LoadingSkeleton type="detail" />
        ) : (
          <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-lg font-bold text-primary-foreground shadow-md">
                  {stock.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stock.name}</p>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-foreground">{stock.symbol}</h1>
                    <WatchlistButton symbol={stock.symbol} variant="filled" stopPropagation={false} />
                    <PriceAlertButton symbol={stock.symbol} currentPrice={stock.price} />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground tabular-nums">₹{stock.price.toLocaleString()}</p>
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  isPositive ? "bg-success-muted text-success" : "bg-danger-muted text-danger"
                }`}>
                  {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  <span className="tabular-nums">
                    {isPositive ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive price chart */}
            <PriceChart symbol={stock.symbol} positive={isPositive} />

            {/* Key Insights */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">Key Insights</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <InsightCard
                  icon={<TrendIcon className="h-5 w-5" />}
                  label="Trend"
                  value={stock.trend}
                  description="Based on price action & volume"
                  variant={stock.trendType}
                />
                <InsightCard
                  icon={<Activity className="h-5 w-5" />}
                  label={<><GlossaryTerm termKey="rsi">RSI</GlossaryTerm> (14)</>}
                  value={stock.rsi.toString()}
                  description={stock.rsi > 70 ? "Overbought zone" : stock.rsi < 30 ? "Oversold zone" : "Neutral range"}
                  variant={stock.rsi > 70 ? "danger" : stock.rsi < 30 ? "success" : "neutral"}
                />
                <InsightCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  label={<>50-Day <GlossaryTerm termKey="ma">MA</GlossaryTerm></>}
                  value={`₹${stock.movingAvg.toLocaleString()}`}
                  description={stock.price > stock.movingAvg ? "Price above MA (bullish)" : "Price below MA (bearish)"}
                  variant={stock.price > stock.movingAvg ? "success" : "danger"}
                />
              </div>
            </div>

            {/* Explain to me — beginner mode */}
            <StockExplainer
              symbol={stock.symbol}
              name={stock.name}
              rsi={stock.rsi}
              price={stock.price}
              movingAvg={stock.movingAvg}
              trend={stock.trend}
            />

            {/* Learning path */}
            <LearningPath symbol={stock.symbol} name={stock.name} />

            {/* Deep Analysis — Buy or Not? */}
            <StockAnalysis stock={stock} />

            {/* AI Explanation */}
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" /> AI Explanation
              </h2>
              <div className="rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
                <p className="text-sm leading-relaxed text-foreground">{stock.aiExplanation}</p>
                <p className="mt-4 text-xs text-muted-foreground italic">
                  💡 This explanation is AI-generated and simplified for beginners. Always do your own research.
                </p>
              </div>
            </div>

            {/* Latest News */}
            <div className="pb-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" /> Latest News
              </h2>
              <div className="space-y-3">
                {stock.news.map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.source} · {item.time}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetail;
