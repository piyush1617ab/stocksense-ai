import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";

interface Props {
  symbol: string;
  name: string;
}

/**
 * Auto-suggests 3 beginner lessons relevant to the current stock.
 * In a real app these would be fetched from /api/learn/lessons?symbol=...
 */
const LearningPath = ({ symbol, name }: Props) => {
  const lessons = [
    { title: `What does ${name} actually do?`, time: "3 min read" },
    { title: `How to read ${symbol}'s key metrics (P/E, RSI, MA)`, time: "5 min read" },
    { title: "What moves a stock's price day-to-day?", time: "4 min read" },
  ];

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Learning path for {symbol}</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Bite-sized lessons to help you understand this stock before you invest.
      </p>

      <div className="mt-4 space-y-2">
        {lessons.map((l, i) => (
          <Link
            key={l.title}
            to="/learn"
            className="group flex items-center justify-between rounded-xl border bg-background/50 p-3 transition-colors hover:border-primary/50 hover:bg-accent/5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.time}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LearningPath;
