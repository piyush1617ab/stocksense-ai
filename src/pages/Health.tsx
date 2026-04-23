import { useEffect, useState, useCallback } from "react";
import { Activity, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { USE_MOCKS } from "@/lib/api";
import { sendMessage } from "@/services/chat";
import { searchStocks } from "@/services/stocks";

type Status = "idle" | "checking" | "ok" | "error";

interface ServiceCheck {
  key: string;
  name: string;
  description: string;
  run: () => Promise<void>;
}

interface ServiceState {
  status: Status;
  latencyMs?: number;
  error?: string;
  checkedAt?: Date;
}

const Health = () => {
  const [states, setStates] = useState<Record<string, ServiceState>>({});

  const checks: ServiceCheck[] = [
    {
      key: "chat",
      name: "Chat Service",
      description: "AI chatbot reply endpoint",
      run: async () => {
        await sendMessage([{ role: "user", content: "ping" }]);
      },
    },
    {
      key: "stocks",
      name: "Stocks Search",
      description: "Stock search & detail lookups",
      run: async () => {
        await searchStocks("REL");
      },
    },
    {
      key: "auth",
      name: "Auth Service",
      description: "Session rehydration (/api/auth/me)",
      run: async () => {
        if (USE_MOCKS) {
          await new Promise((r) => setTimeout(r, 200));
          return;
        }
        // 🔌 When wired: const { apiFetch } = await import("@/lib/api");
        // await apiFetch("/api/auth/me");
        throw new Error("Auth endpoint not wired yet — uncomment in src/services/auth.ts");
      },
    },
  ];

  const runCheck = useCallback(async (check: ServiceCheck) => {
    setStates((s) => ({ ...s, [check.key]: { ...s[check.key], status: "checking" } }));
    const start = performance.now();
    try {
      await check.run();
      setStates((s) => ({
        ...s,
        [check.key]: {
          status: "ok",
          latencyMs: Math.round(performance.now() - start),
          checkedAt: new Date(),
        },
      }));
    } catch (err) {
      setStates((s) => ({
        ...s,
        [check.key]: {
          status: "error",
          latencyMs: Math.round(performance.now() - start),
          error: err instanceof Error ? err.message : String(err),
          checkedAt: new Date(),
        },
      }));
    }
  }, []);

  const runAll = useCallback(() => {
    checks.forEach(runCheck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runCheck]);

  useEffect(() => {
    runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const okCount = Object.values(states).filter((s) => s.status === "ok").length;
  const errCount = Object.values(states).filter((s) => s.status === "error").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Backend Health</h1>
            </div>
            <p className="text-muted-foreground">
              Live status of services your app depends on.{" "}
              <Badge variant={USE_MOCKS ? "secondary" : "default"} className="ml-1">
                {USE_MOCKS ? "MOCK MODE" : "LIVE"}
              </Badge>
            </p>
          </div>
          <Button onClick={runAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-check all
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Healthy</div>
              <div className="text-2xl font-bold text-success">{okCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Failing</div>
              <div className="text-2xl font-bold text-destructive">{errCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{checks.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {checks.map((check) => {
            const state = states[check.key] ?? { status: "idle" as Status };
            return (
              <Card key={check.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <StatusIcon status={state.status} />
                      <div>
                        <CardTitle className="text-base">{check.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">{check.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {state.latencyMs !== undefined && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {state.latencyMs}ms
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => runCheck(check)}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {state.status === "error" && state.error && (
                  <CardContent className="pt-0">
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                      <div className="text-xs font-semibold text-destructive mb-1">Last error</div>
                      <pre className="text-xs text-destructive/90 whitespace-pre-wrap break-words font-mono">
                        {state.error}
                      </pre>
                    </div>
                  </CardContent>
                )}
                {state.checkedAt && (
                  <CardContent className="pt-0 -mt-2">
                    <p className="text-[11px] text-muted-foreground">
                      Last checked {state.checkedAt.toLocaleTimeString()}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          🔌 Add new checks in <code className="px-1 py-0.5 rounded bg-muted">src/pages/Health.tsx</code> as you wire more services.
        </p>
      </main>
    </div>
  );
};

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "checking") return <Loader2 className="h-5 w-5 text-primary animate-spin mt-0.5" />;
  if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />;
  if (status === "error") return <XCircle className="h-5 w-5 text-destructive mt-0.5" />;
  return <div className="h-5 w-5 rounded-full border-2 border-muted mt-0.5" />;
};

export default Health;
