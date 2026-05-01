import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

interface AppLoaderProps {
  /** When true the loader fades out and unmounts */
  ready: boolean;
  children: React.ReactNode;
}

/**
 * Full-screen loading splash shown while the app boots / backend connects.
 * Displays a branded animation, then fades out once `ready` is true.
 */
const AppLoader = ({ ready, children }: AppLoaderProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (ready) {
      // allow fade-out animation before unmounting
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [ready]);

  if (!visible) return <>{children}</>;

  return (
    <>
      {/* Loader overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
          ready ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Logo mark */}
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-xl animate-pulse">
            <TrendingUp className="h-10 w-10 text-primary-foreground" />
          </div>
          {/* Glow ring */}
          <div className="absolute -inset-3 rounded-[2rem] border-2 border-primary/20 animate-ping" />
        </div>

        {/* Brand name */}
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Stock<span className="text-primary">Sense</span> AI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Learn. Analyze. Invest.</p>

        {/* Progress bar */}
        <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full origin-left animate-loader-bar rounded-full gradient-primary" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground animate-pulse">
          Connecting to services…
        </p>
      </div>

      {/* Render children underneath so they can hydrate */}
      <div className={ready ? "" : "invisible"}>
        {children}
      </div>
    </>
  );
};

export default AppLoader;
