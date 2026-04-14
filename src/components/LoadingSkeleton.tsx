const LoadingSkeleton = ({ type = "card" }: { type?: "card" | "detail" | "chat" }) => {
  if (type === "detail") {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded-lg bg-accent" />
            <div className="h-8 w-36 rounded-lg bg-accent" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-8 w-28 rounded-lg bg-accent ml-auto" />
            <div className="h-4 w-20 rounded-lg bg-accent ml-auto" />
          </div>
        </div>
        <div className="h-56 rounded-2xl bg-accent" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-accent" />
          ))}
        </div>
        <div className="h-32 rounded-2xl bg-accent" />
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className="flex gap-3 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-accent shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 rounded-lg bg-accent" />
          <div className="h-4 w-1/2 rounded-lg bg-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-accent" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 rounded bg-accent" />
          <div className="h-3 w-36 rounded bg-accent" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-20 rounded bg-accent ml-auto" />
          <div className="h-3 w-16 rounded bg-accent ml-auto" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
