import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Pill } from "@/components/app-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import { ModuleActions } from "@/components/module-actions";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { generateTrend } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/fraud")({
  head: () => ({ meta: [{ title: "Fraud Analytics · Sentinel AI" }] }),
  component: Page,
});

const VECTORS = [
  { name: "Card Testing",         share: 32, trend: "+12%", cases: 184, exposure: 412_000 },
  { name: "Account Takeover",     share: 24, trend: "+5%",  cases: 138, exposure: 612_000 },
  { name: "CNP Friendly Fraud",   share: 18, trend: "-3%",  cases: 104, exposure: 198_000 },
  { name: "BIN Attack",           share: 14, trend: "+22%", cases:  81, exposure: 305_000 },
  { name: "Synthetic Identity",   share:  8, trend: "+1%",  cases:  46, exposure: 245_000 },
  { name: "Phishing-driven",      share:  4, trend: "-2%",  cases:  22, exposure:  82_000 },
];

const RULES = [
  { id: "RL-001", name: "Velocity > 5 txn / 60s same PAN",  status: "Active",  fires: 412, fp: "2.1%" },
  { id: "RL-014", name: "BIN range mismatch (issuer/country)", status: "Active", fires: 188, fp: "0.8%" },
  { id: "RL-022", name: "3DS step-up bypass attempt",      status: "Active",  fires:  64, fp: "0.3%" },
  { id: "RL-031", name: "Synthetic ID — device + email age",status: "Tuning", fires:  31, fp: "6.4%" },
  { id: "RL-040", name: "Geo / IP / shipping mismatch",    status: "Active",  fires: 121, fp: "1.5%" },
];

function Page() {
  const [range, setRange] = useState<"30d" | "60d" | "90d">("60d");
  const trend = useMemo(() => {
    const days = range === "30d" ? 30 : range === "60d" ? 60 : 90;
    return generateTrend(days).map((d) => ({ date: d.date, fraud: Math.round(d.fraud * 1.3), blocked: Math.round(d.fraud * 1.1) }));
  }, [range]);

  const totalCases = VECTORS.reduce((a, b) => a + b.cases, 0);
  const totalExposure = VECTORS.reduce((a, b) => a + b.exposure, 0);

  return (
    <AppShell
      title="Fraud Analytics"
      subtitle="Attack vectors, fraud trends, exposure, and rule performance across portfolios."
      actions={<ModuleActions module="Fraud Analytics" rows={VECTORS} />}
    >
      {/* KPI strip */}
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        {[
          { l: "Total Fraud Cases",  v: totalCases.toLocaleString(), tip: "fraud_rate",      icon: ShieldAlert,   tone: "text-destructive" },
          { l: "Exposure (30d)",     v: `$${(totalExposure/1_000_000).toFixed(2)}M`, tip: "revenue_impact", icon: TrendingUp, tone: "text-warning" },
          { l: "Blocked Attempts",   v: "12,481",                    tip: "active_alerts",    icon: ShieldAlert,   tone: "text-success" },
          { l: "False Positive Rate",v: "1.8%",                       tip: "confidence",       icon: AlertTriangle, tone: "text-accent" },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border bg-card p-5 flex items-center gap-3">
            <div className={"size-10 rounded-lg bg-muted grid place-items-center " + k.tone}><k.icon className="size-5" /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                {k.l} <InfoTooltip tip={k.tip as never} />
              </div>
              <div className="text-xl font-semibold">{k.v}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Fraud Trend</TabsTrigger>
          <TabsTrigger value="vectors">Attack Vectors</TabsTrigger>
          <TabsTrigger value="rules">Detection Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Fraud vs blocked attempts</h2>
                <InfoTooltip tip="fraud_rate" />
              </div>
              <div className="flex gap-1 rounded-md border p-0.5 bg-muted/40">
                {(["30d", "60d", "90d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={"px-2.5 h-7 rounded text-[11px] font-medium " + (range === r ? "bg-background shadow" : "text-muted-foreground hover:text-foreground")}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="fraud" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.15)" name="Fraud cases" />
                  <Area type="monotone" dataKey="blocked" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.12)" name="Blocked attempts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vectors" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold">Share by attack vector</h2>
              <InfoTooltip tip={{ title: "Attack vector share", definition: "Distribution of fraud cases by tactic.", purpose: "Surfaces where attackers focus this period.", action: "Tighten the rule pack matching the dominant vector." }} />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={VECTORS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="share" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {VECTORS.map((v) => (
              <div key={v.name} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{v.name}</div>
                  <Pill tone={v.trend.startsWith("+") ? "danger" : "success"}>{v.trend}</Pill>
                </div>
                <div className="text-2xl font-semibold mt-2">{v.share}%</div>
                <div className="text-xs text-muted-foreground mt-1">{v.cases} cases · ${(v.exposure/1000).toFixed(0)}k exposure</div>
                <button
                  onClick={() => toast.success(`Investigation opened for "${v.name}"`)}
                  className="mt-3 h-7 w-full rounded-md border text-[11px] hover:bg-muted"
                >
                  Open investigation
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-4">
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Rule</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Fires (24h)</th>
                  <th className="text-right px-4 py-2">False positives</th>
                  <th className="text-right px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {RULES.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <div className="text-xs text-muted-foreground">{r.id}</div>
                      <div className="text-sm font-medium">{r.name}</div>
                    </td>
                    <td className="px-4 py-2"><Pill tone={r.status === "Active" ? "success" : "warning"}>{r.status}</Pill></td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.fires}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.fp}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => toast.message(`Rule ${r.id}`, { description: "Opening tuning panel…" })}
                        className="h-7 px-2 rounded border text-[11px] hover:bg-muted"
                      >Tune</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
