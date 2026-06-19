import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Pill, severityTone } from "@/components/app-shell";
import { InfoTooltip } from "@/components/info-tooltip";
import { ModuleActions } from "@/components/module-actions";
import { generateAnomalies, declineBreakdownFor } from "@/lib/mock-data";
import { Network, ArrowRight, Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/app/rca")({
  head: () => ({ meta: [{ title: "Root Cause Analysis · Sentinel AI" }] }),
  component: Page,
});

function Page() {
  const anomalies = useMemo(() => generateAnomalies().slice(0, 6), []);
  const [selected, setSelected] = useState(anomalies[0]);
  const breakdown = useMemo(() => declineBreakdownFor(selected.id), [selected]);

  return (
    <AppShell
      title="Root Cause Analysis"
      subtitle="Decompose detected anomalies by dimension, vendor, and decline reason."
      actions={<ModuleActions module="RCA" rows={anomalies.map((a) => ({ id: a.id, metric: a.metric, severity: a.severity, country: a.country, mcc: a.mcc, confidence: a.confidence }))} />}
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drilldown">Drill-down</TabsTrigger>
          <TabsTrigger value="recs">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {anomalies.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelected(a); toast.message(`Loaded ${a.id}`, { description: a.metric }); }}
                className={"text-left rounded-xl border bg-card p-5 hover:border-accent transition " + (selected.id === a.id ? "border-accent ring-1 ring-accent/30" : "")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.id}</span>
                  <Pill tone={severityTone(a.severity)}>{a.severity}</Pill>
                </div>
                <div className="mt-2 text-sm font-semibold">{a.metric} · {a.country}/{a.mcc}</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                    <Network className="size-3" /> Contributing factors <InfoTooltip tip={{ title: "Contributing factors", definition: "Dimensions correlated with this anomaly.", purpose: "Pinpoint the segment driving the deviation." }} />
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {a.rootCauses.map((rc) => (
                      <li key={rc} className="text-xs flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-accent mt-1.5" />
                        <span>{rc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drilldown" className="mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Selected anomaly</div>
              <div className="text-sm font-semibold mt-1">{selected.id} · {selected.metric}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Country</span><div>{selected.country}</div></div>
                <div><span className="text-muted-foreground">MCC</span><div>{selected.mcc}</div></div>
                <div><span className="text-muted-foreground">Channel</span><div>{selected.channel}</div></div>
                <div><span className="text-muted-foreground">Affected txns</span><div>{selected.affectedTxns.toLocaleString()}</div></div>
              </div>
            </div>
            <div className="lg:col-span-2 rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold">Top decline reasons</h2>
                <InfoTooltip tip={{ title: "Decline reason breakdown", definition: "Share of declines by reason code for this anomaly.", purpose: "Pinpoint the failure mode driving the metric drop.", action: "Engage the issuer for the dominant code." }} />
              </div>
              <ul className="space-y-2">
                {breakdown.map((b) => (
                  <li key={b.code} className="grid grid-cols-[80px_1fr_60px_60px] gap-3 items-center text-xs">
                    <span className="font-mono">{b.code}</span>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${b.share}%` }} />
                    </div>
                    <span className="text-right tabular-nums">{b.share}%</span>
                    <span className={"text-right tabular-nums " + (b.change >= 0 ? "text-destructive" : "text-success")}>{b.change >= 0 ? "+" : ""}{b.change}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recs" className="mt-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="size-4 text-accent" />
              <h2 className="text-sm font-semibold">Recommended actions · {selected.id}</h2>
            </div>
            <ol className="space-y-2.5">
              {selected.recommendations.map((rec, i) => (
                <li key={rec} className="flex items-start gap-3 text-sm">
                  <span className="size-6 rounded-full bg-accent/10 text-accent text-xs grid place-items-center font-semibold shrink-0">{i + 1}</span>
                  <div className="flex-1">{rec}</div>
                  <button
                    onClick={() => toast.success("Action queued for approval.")}
                    className="h-7 px-2 rounded border text-[11px] hover:bg-muted"
                  >Apply</button>
                </li>
              ))}
            </ol>
            <Link to="/app/anomalies" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline">
              Open anomaly detail <ArrowRight className="size-3" />
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
