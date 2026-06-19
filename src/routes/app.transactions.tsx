import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell, Pill } from "@/components/app-shell";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { generateTrend, aggregateByChannel, aggregateByCountry } from "@/lib/mock-data";
import { InfoTooltip } from "@/components/info-tooltip";
import { ModuleActions } from "@/components/module-actions";
import type { TooltipKey } from "@/lib/tooltips";

export const Route = createFileRoute("/app/transactions")({
  head: () => ({ meta: [{ title: "Transaction Monitoring · Sentinel AI" }] }),
  component: Page,
});

function Page() {
  const trend = useMemo(() => generateTrend(30), []);
  const channels = useMemo(() => aggregateByChannel(), []);
  const countries = useMemo(() => aggregateByCountry(generateTrend(30)).slice(0, 6), []);

  const kpis: Array<{ l: string; v: string; d: string; tip: TooltipKey }> = [
    { l: "Volume (24h)",     v: "8.42M", d: "+2.1%", tip: "total_transactions" },
    { l: "Approval Rate",    v: "94.2%", d: "-0.8%", tip: "approval_rate" },
    { l: "Decline Rate",     v: "5.8%",  d: "+0.8%", tip: "decline_rate" },
    { l: "Fraud Rate (bps)", v: "12.4",  d: "+1.6",  tip: "fraud_rate" },
  ];

  return (
    <AppShell
      title="Transaction Monitoring"
      subtitle="Live volume, approvals, declines and fraud by region and channel."
      actions={<ModuleActions module="Transactions" rows={trend} />}
    >
      <div className="grid md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.l} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
              {k.l} <InfoTooltip tip={k.tip} />
            </div>
            <div className="text-2xl font-semibold mt-1">{k.v}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{k.d} vs 30d baseline</div>
          </div>
        ))}
      </div>


      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Volume vs Approvals (30d)</h2>
            <Pill tone="info"><Activity className="size-3" /> Live</Pill>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip />
                <Legend />
                <Line type="monotone" dataKey="volume" stroke="hsl(var(--accent))" dot={false} />
                <Line type="monotone" dataKey="approvals" stroke="hsl(var(--success))" dot={false} />
                <Line type="monotone" dataKey="declines" stroke="hsl(var(--destructive))" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Channel mix</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channels}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RTooltip />
                <Bar dataKey="volume" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b text-sm font-semibold">Top countries by volume</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr><th className="text-left px-4 py-2">Country</th><th className="text-right px-4 py-2">Volume</th><th className="text-right px-4 py-2">Approval</th><th className="text-right px-4 py-2">Fraud bps</th></tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.country} className="border-t">
                <td className="px-4 py-2">{c.country}</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.volume.toLocaleString()}</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.approval.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right tabular-nums">{c.fraud.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
