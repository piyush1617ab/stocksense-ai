import { useMemo } from "react";

interface Props {
  /** Seed string so the same symbol renders the same line. */
  seed: string;
  positive: boolean;
  width?: number;
  height?: number;
  className?: string;
}

const seeded = (seed: number) => {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

/** Tiny pure-SVG sparkline — no external dependency, near-zero render cost. */
const Sparkline = ({ seed, positive, width = 80, height = 28, className }: Props) => {
  const path = useMemo(() => {
    const seedNum = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = seeded(seedNum);
    const n = 16;
    const pts: number[] = [];
    let v = 50;
    for (let i = 0; i < n; i++) {
      v += (rand() - (positive ? 0.4 : 0.6)) * 14;
      v = Math.max(8, Math.min(92, v));
      pts.push(v);
    }
    return pts
      .map((y, i) => {
        const x = (i / (n - 1)) * width;
        const yPx = (1 - y / 100) * height;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yPx.toFixed(1)}`;
      })
      .join(" ");
  }, [seed, positive, width, height]);

  const stroke = positive ? "hsl(var(--success))" : "hsl(var(--danger))";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Sparkline;
